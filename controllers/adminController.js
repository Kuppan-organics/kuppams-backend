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

    const [products, total] = await Promise.all([
      Product.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(),
    ]);

    const productIds = products.map((product) => product._id);
    let orderedQtyMap = new Map();

    if (productIds.length > 0) {
      const orderedQtyByProduct = await Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        { $match: { "items.product": { $in: productIds } } },
        {
          $group: {
            _id: "$items.product",
            totalOrderedQuantity: { $sum: "$items.quantity" },
          },
        },
      ]);

      orderedQtyMap = new Map(
        orderedQtyByProduct.map((entry) => [
          entry._id.toString(),
          entry.totalOrderedQuantity,
        ])
      );
    }

    const productsWithAvailableStock = products.map((product) => ({
      ...product,
      availableStock: Math.max(0, product.stock),
      totalOrderedQuantity: orderedQtyMap.get(product._id.toString()) || 0,
    }));

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

    const query = {
      $or: [{ orderType: "retail" }, { orderType: { $exists: false } }],
    };
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
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      ordersByStatus,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

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
