const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { validationResult } = require("express-validator");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, email, password, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
    });

    const token = generateToken(user._id);

    // Explicitly exclude password from response
    res.status(201).json({
      success: true,
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Check if user exists and get password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    // Password is already excluded due to select: false in User schema
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comprehensive user profile with orders, cart, and settings
// @route   GET /api/auth/profile/complete
// @access  Private
exports.getCompleteProfile = async (req, res, next) => {
  try {
    const Order = require("../models/Order");
    const Cart = require("../models/Cart");

    // Get user info
    const user = await User.findById(req.user.id).select("-password");

    // Get user's orders
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "name images")
      .sort({ createdAt: -1 })
      .limit(10); // Get last 10 orders

    // Get user's cart
    let cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    let cartTotal = 0;
    if (cart) {
      cartTotal = await cart.calculateTotal();
    } else {
      cart = { items: [], total: 0 };
    }

    // Format orders for display (like the image)
    const formattedOrders = orders.map((order) => {
      const formattedItems = order.items.map((item) => {
        const discountedPrice = item.price * (1 - (item.discount || 0) / 100);
        return {
          id: item._id,
          product: item.product,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          itemTotal: discountedPrice * item.quantity,
        };
      });

      return {
        id: order._id,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        status: order.status,
        paymentStatus: order.paymentStatus,
        items: formattedItems,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
        expectedDeliveryDate: order.expectedDeliveryDate,
        statusTimeline: order.statusTimeline || [],
      };
    });

    res.json({
      success: true,
      profile: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profilePhoto: user.profilePhoto,
          address: user.address,
          role: user.role,
        },
        orders: {
          count: orders.length,
          history: formattedOrders,
        },
        cart: {
          items: cart.items || [],
          total: cartTotal,
          itemCount: cart.items ? cart.items.length : 0,
        },
        settings: {
          profilePhoto: user.profilePhoto,
          address: user.address,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, phone, address, profilePhoto } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile photo
// @route   PUT /api/auth/profile/photo
// @access  Private
exports.updateProfilePhoto = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { profilePhoto } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile photo updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};
