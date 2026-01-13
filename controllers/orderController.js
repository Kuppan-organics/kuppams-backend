const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
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

    const { shippingAddress } = req.body;

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

      // Reduce product stock when order is placed
      // stock is reduced by the quantity being sold
      product.stock -= item.quantity;
      await product.save();
    }

    // Create order with initial status "placed"
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      shippingAddress: shippingAddress || req.user.address,
      status: "placed",
      paymentStatus: "pending",
      statusTimeline: [{
        status: "placed",
        timestamp: new Date(),
        note: "Order placed successfully",
      }],
    });

    // Clear cart
    cart.items = [];
    await cart.save();

    await order.populate("items.product");

    res.status(201).json({
      success: true,
      order
    });
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
      // If order is being cancelled, restore stock
      if (status === "cancelled" && previousStatus !== "cancelled" && previousStatus !== "delivered") {
        await order.populate("items.product");
        
        for (const item of order.items) {
          const product = item.product;
          if (product) {
            // Restore the quantity that was sold
            product.stock += item.quantity;
            await product.save();
          }
        }
      }
      
      // If order was cancelled and is now being reactivated, reduce stock again
      if (previousStatus === "cancelled" && status !== "cancelled") {
        await order.populate("items.product");
        
        for (const item of order.items) {
          const product = item.product;
          if (product) {
            // Check if stock is available
            if (product.stock < item.quantity) {
              return res.status(400).json({
                success: false,
                message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`,
              });
            }
            // Reduce stock again
            product.stock -= item.quantity;
            await product.save();
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
    await order.populate("items.product");
    await order.populate("user", "name email");

    res.json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};
