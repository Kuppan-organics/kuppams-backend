const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Franchise = require("../models/Franchise");
const { validationResult } = require("express-validator");
const { emitNewOrder } = require("../utils/socketService");
const { sendOrderConfirmationEmail } = require("../utils/emailService");

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
    options,
  );

  if (result.modifiedCount !== stockChanges.length) {
    const error = new Error("Insufficient stock for one or more products");
    error.statusCode = 400;
    throw error;
  }
};

// @desc    Create franchise bulk order
// @route   POST /api/franchises/orders
// @access  Franchise
exports.createFranchiseOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const franchise = await Franchise.findOne({
      user: req.user.id,
      isActive: true,
    });

    if (!franchise) {
      return res.status(404).json({
        success: false,
        message: "Franchise profile not found or inactive",
      });
    }

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one order item is required",
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${product?.name || "Unknown"} is no longer available`,
        });
      }

      const quantity = parseInt(item.quantity, 10);
      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}`,
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`,
        });
      }

      const price = product.discountedPrice || product.price;
      totalAmount += price * quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity,
        price: product.price,
        discount: product.discount,
      });
    }

    const shippingAddress = {
      street: franchise.physicalAddress,
      city: franchise.location,
      state: franchise.state,
      country: "India",
    };

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await applyStockChanges(
        orderItems.map((orderItem) => ({
          productId: orderItem.product,
          quantityDelta: -orderItem.quantity,
        })),
        session,
      );

      const [order] = await Order.create(
        [
          {
            user: req.user.id,
            franchise: franchise._id,
            orderType: "franchise",
            items: orderItems,
            totalAmount,
            finalAmount: totalAmount,
            shippingAddress,
            status: "placed",
            paymentStatus: "pending",
            statusTimeline: [
              {
                status: "placed",
                timestamp: new Date(),
                note: `Franchise bulk order placed (${franchise.franchiseCode})`,
              },
            ],
          },
        ],
        { session },
      );

      await session.commitTransaction();

      await order.populate([
        { path: "items.product" },
        { path: "user", select: "name email phone" },
        { path: "franchise", select: "franchiseCode storeName franchiseName" },
      ]);

      emitNewOrder(order);

      sendOrderConfirmationEmail({ user: order.user, order }).catch((err) =>
        console.error("[FranchiseOrder] Confirmation email failed:", err.message),
      );

      res.status(201).json({
        success: true,
        message: "Franchise order placed successfully",
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

// @desc    Get franchise owner's orders
// @route   GET /api/franchises/orders
// @access  Franchise
exports.getFranchiseOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {
      user: req.user.id,
      orderType: "franchise",
    };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("items.product", "name price discount images")
        .populate("franchise", "franchiseCode storeName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all franchise orders (Admin)
// @route   GET /api/admin/franchise-orders
// @access  Admin
exports.getAdminFranchiseOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const query = { orderType: "franchise" };
    if (status) {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("items.product")
        .populate("user", "name email phone")
        .populate("franchise", "franchiseCode storeName franchiseName location state district")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      orders,
    });
  } catch (error) {
    next(error);
  }
};
