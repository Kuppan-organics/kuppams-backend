const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { validationResult } = require("express-validator");
const { emitNewOrder, emitOrderStatusUpdate } = require("../utils/socketService");
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require("../utils/emailService");
const { validateCouponForUser } = require("../utils/couponValidation");

const applyStockChanges = async (stockChanges, session = null) => {
  if (stockChanges.length === 0) {
    return;
  }

  const options = session ? { session } : {};

  const result = await Product.bulkWrite(
    stockChanges.map(({ productId, quantityDelta }) => ({
      updateOne: {
        filter:
          quantityDelta < 0
            ? { _id: productId, stock: { $gte: Math.abs(quantityDelta) } }
            : { _id: productId },
        update: { $inc: { stock: quantityDelta } },
      },
    })),
    options
  );

  if (result.modifiedCount !== stockChanges.length) {
    const error = new Error("Insufficient stock for one or more products");
    error.statusCode = 400;
    throw error;
  }
};

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user.id })
        .populate("items.product", "name price discount images quantity")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments({ user: req.user.id }),
    ]);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product")
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Make sure user owns the order or is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this order",
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create order from cart
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { shippingAddress, couponCode } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Validate stock and prepare order items
    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = item.product;
      
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${product?.name || "Unknown"} is no longer available`,
        });
      }

      // stock = total available quantity in inventory
      // item.quantity = quantity user wants to buy
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        });
      }

      const price = product.discountedPrice || product.price;
      const itemTotal = price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        discount: product.discount,
      });
    }

    // Apply coupon discount if provided
    let couponDiscount = 0;
    let discountAmount = 0;
    let finalAmount = totalAmount;
    let coupon = null;

    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

      const validation = await validateCouponForUser(
        coupon,
        req.user.id,
        totalAmount,
      );

      if (!validation.valid) {
        const response = {
          success: false,
          message: validation.message,
        };
        if (validation.minPurchaseAmount) {
          response.minPurchaseAmount = validation.minPurchaseAmount;
        }
        return res.status(validation.statusCode).json(response);
      }

      couponDiscount = coupon.discountPercentage;
      discountAmount = validation.discountAmount;
      finalAmount = validation.finalAmount;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await applyStockChanges(
        orderItems.map((item) => ({
          productId: item.product,
          quantityDelta: -item.quantity,
        })),
        session
      );

      const [order] = await Order.create(
        [
          {
            user: req.user.id,
            items: orderItems,
            totalAmount,
            couponCode: couponCode ? couponCode.toUpperCase() : null,
            couponDiscount,
            discountAmount,
            finalAmount,
            shippingAddress: shippingAddress || req.user.address,
            status: "placed",
            paymentStatus: "pending",
            statusTimeline: [
              {
                status: "placed",
                timestamp: new Date(),
                note: couponCode
                  ? `Order placed successfully with coupon ${couponCode.toUpperCase()}`
                  : "Order placed successfully",
              },
            ],
          },
        ],
        { session }
      );

      cart.items = [];
      await cart.save({ session });

      if (coupon) {
        coupon.usedCount += 1;
        await coupon.save({ session });
      }

      await session.commitTransaction();

      await order.populate([
        { path: "items.product" },
        { path: "user", select: "name email" },
      ]);

      // Emit socket event to notify admins of new order
      emitNewOrder(order);

      // Send order confirmation email with details and pricing (non-blocking)
      sendOrderConfirmationEmail({ user: order.user, order }).catch((err) =>
        console.error("[Order] Confirmation email failed:", err.message)
      );

      res.status(201).json({
        success: true,
        order,
      });
    } catch (error) {
      await session.abortTransaction();
      if (error.statusCode === 400) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Buy now - Create order directly from product (without cart)
// @route   POST /api/orders/buy-now
// @access  Private
exports.buyNow = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { productId, quantity, shippingAddress, couponCode } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not available",
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock available. Available: ${product.stock}, Requested: ${quantity}`,
      });
    }

    // Calculate total amount
    const price = product.discountedPrice || product.price;
    let totalAmount = price * quantity;

    // Apply coupon discount if provided
    let couponDiscount = 0;
    let discountAmount = 0;
    let finalAmount = totalAmount;
    let coupon = null;

    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

      const validation = await validateCouponForUser(
        coupon,
        req.user.id,
        totalAmount,
      );

      if (!validation.valid) {
        const response = {
          success: false,
          message: validation.message,
        };
        if (validation.minPurchaseAmount) {
          response.minPurchaseAmount = validation.minPurchaseAmount;
        }
        return res.status(validation.statusCode).json(response);
      }

      couponDiscount = coupon.discountPercentage;
      discountAmount = validation.discountAmount;
      finalAmount = validation.finalAmount;
    }

    // Prepare order item
    const orderItems = [{
      product: product._id,
      name: product.name,
      quantity: quantity,
      price: product.price,
      discount: product.discount,
    }];

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await applyStockChanges(
        [{ productId: product._id, quantityDelta: -quantity }],
        session
      );

      const [order] = await Order.create(
        [
          {
            user: req.user.id,
            items: orderItems,
            totalAmount,
            couponCode: couponCode ? couponCode.toUpperCase() : null,
            couponDiscount,
            discountAmount,
            finalAmount,
            shippingAddress: shippingAddress || req.user.address,
            status: "placed",
            paymentStatus: "pending",
            statusTimeline: [
              {
                status: "placed",
                timestamp: new Date(),
                note: couponCode
                  ? `Order placed successfully (Buy Now) with coupon ${couponCode.toUpperCase()}`
                  : "Order placed successfully (Buy Now)",
              },
            ],
          },
        ],
        { session }
      );

      if (coupon) {
        coupon.usedCount += 1;
        await coupon.save({ session });
      }

      await session.commitTransaction();

      await order.populate([
        { path: "items.product" },
        { path: "user", select: "name email" },
      ]);

      // Emit socket event to notify admins of new order
      emitNewOrder(order);

      // Send order confirmation email with details and pricing (non-blocking)
      sendOrderConfirmationEmail({ user: order.user, order }).catch((err) =>
        console.error("[Order] Confirmation email failed (buy-now):", err.message)
      );

      res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order,
      });
    } catch (error) {
      await session.abortTransaction();
      if (error.statusCode === 400) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { status, paymentStatus, expectedDeliveryDate, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const previousStatus = order.status;

    if (status && status !== previousStatus) {
      // If order is being cancelled, restore stock and coupon usage
      if (status === "cancelled" && previousStatus !== "cancelled" && previousStatus !== "delivered") {
        await applyStockChanges(
          order.items.map((item) => ({
            productId: item.product,
            quantityDelta: item.quantity,
          }))
        );

        // Restore coupon usage if coupon was used
        if (order.couponCode) {
          const coupon = await Coupon.findOne({ code: order.couponCode });
          if (coupon && coupon.usedCount > 0) {
            coupon.usedCount -= 1;
            await coupon.save();
          }
        }
      }

      // If order was cancelled and is now being reactivated, reduce stock again and increment coupon usage
      if (previousStatus === "cancelled" && status !== "cancelled") {
        const products = await Product.find({
          _id: { $in: order.items.map((item) => item.product) },
        }).select("_id name stock");

        const productMap = new Map(
          products.map((product) => [product._id.toString(), product])
        );

        for (const item of order.items) {
          const product = productMap.get(item.product.toString());
          if (product && product.stock < item.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`,
            });
          }
        }

        await applyStockChanges(
          order.items.map((item) => ({
            productId: item.product,
            quantityDelta: -item.quantity,
          }))
        );

        // Increment coupon usage again if coupon was used
        if (order.couponCode) {
          const coupon = await Coupon.findOne({ code: order.couponCode });
          if (coupon) {
            // Validate coupon is still valid before incrementing
            if (
              coupon.isActive &&
              (!coupon.expiryDate || new Date() <= coupon.expiryDate) &&
              (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit)
            ) {
              coupon.usedCount += 1;
              await coupon.save();
            }
          }
        }
      }
      
      order.status = status;
      
      // Add timeline entry for status change
      if (!order.statusTimeline) {
        order.statusTimeline = [];
      }
      
      order.statusTimeline.push({
        status: status,
        timestamp: new Date(),
        note: note || `Status changed from ${previousStatus} to ${status}`,
      });
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    if (expectedDeliveryDate) {
      order.expectedDeliveryDate = new Date(expectedDeliveryDate);
      
      // Add note to timeline if status is sent_to_delivery
      if (order.status === "sent_to_delivery" && order.statusTimeline.length > 0) {
        const lastEntry = order.statusTimeline[order.statusTimeline.length - 1];
        if (lastEntry.status === "sent_to_delivery") {
          lastEntry.note = `Order sent to delivery. Expected delivery: ${new Date(expectedDeliveryDate).toLocaleDateString()}`;
        }
      }
    }

    await order.save();
    await order.populate([
      { path: "items.product" },
      { path: "user", select: "name email" },
    ]);

    // Emit socket event to notify admins of order status update
    emitOrderStatusUpdate(order);

    // Send status update email for: accepted, sent_to_delivery, delivered (non-blocking)
    if (status && status !== previousStatus) {
      sendOrderStatusEmail({
        user: order.user,
        order,
        newStatus: status,
        note,
      }).catch((err) =>
        console.error("[Order] Status email failed:", err.message)
      );
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};
