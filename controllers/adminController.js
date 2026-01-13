const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

// @desc    Get all products (Admin)
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments();

    // Calculate available stock for each product by accounting for ordered quantities
    // We sum the quantities (not just count orders) from active orders
    const productsWithAvailableStock = await Promise.all(
      products.map(async (product) => {
        // Aggregate ordered quantities for this product
        // Sum quantities (not just count orders) from all non-cancelled orders
        // Cancelled orders restore stock, so we exclude them
        const orderAggregation = await Order.aggregate([
          {
            $match: {
              status: { $ne: "cancelled" }, // Exclude cancelled orders as they restore stock
            },
          },
          {
            $unwind: "$items",
          },
          {
            $match: {
              "items.product": product._id,
            },
          },
          {
            $group: {
              _id: null,
              totalOrderedQuantity: { $sum: "$items.quantity" },
            },
          },
        ]);

        const totalOrderedQuantity =
          orderAggregation.length > 0
            ? orderAggregation[0].totalOrderedQuantity
            : 0;

        // Calculate available stock
        // Note: product.stock is already reduced when orders are placed and restored when cancelled
        // So product.stock represents the current available stock
        // We calculate totalOrderedQuantity (sum of quantities, not order count) for reference
        const availableStock = Math.max(0, product.stock);

        return {
          ...product.toObject(),
          availableStock,
          totalOrderedQuantity, // Total quantity in active orders (for reference)
        };
      })
    );

    res.json({
      success: true,
      count: productsWithAvailableStock.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      products: productsWithAvailableStock,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("items.product")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

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

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments();

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats (Admin)
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        revenue,
        ordersByStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};
