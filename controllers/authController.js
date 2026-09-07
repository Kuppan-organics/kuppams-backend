const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendRegistrationEmail, sendPasswordResetOtpEmail } = require("../utils/emailService");
const {
  hashOtp,
  generateOtp,
  OTP_EXPIRY_MS,
  RESEND_COOLDOWN_MS,
  VERIFIED_WINDOW_MS,
} = require("../utils/passwordReset");
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

    // Send welcome email (non-blocking)
    sendRegistrationEmail({ name: user.name, email: user.email }).catch((err) =>
      console.error("[Auth] Registration email failed:", err.message)
    );

    const token = generateToken(user);

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
    const loginInput = email.trim();

    const userQuery = loginInput.includes("@")
      ? { email: loginInput.toLowerCase() }
      : { phone: loginInput };

    const user = await User.findOne(userQuery).select("+password");
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

    if (user.role === "franchise") {
      const Franchise = require("../models/Franchise");
      const franchise = await Franchise.findOne({
        user: user._id,
        isActive: true,
      });
      if (!franchise) {
        return res.status(403).json({
          success: false,
          message: "Franchise account is inactive or not found",
        });
      }
    }

    const token = generateToken(user);

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

const GENERIC_RESET_MESSAGE =
  "If an account exists with this email, a password reset code has been sent.";

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const email = String(req.body.email).toLowerCase().trim();
    const user = await User.findOne({ email }).select(
      "+passwordResetLastRequestedAt",
    );

    if (!user) {
      return res.json({
        success: true,
        message: GENERIC_RESET_MESSAGE,
      });
    }

    if (
      user.passwordResetLastRequestedAt &&
      Date.now() - user.passwordResetLastRequestedAt.getTime() <
        RESEND_COOLDOWN_MS
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait a minute before requesting another code.",
      });
    }

    const otp = generateOtp();
    user.passwordResetOtpHash = hashOtp(otp, email);
    user.passwordResetOtpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    user.passwordResetVerifiedUntil = undefined;
    user.passwordResetLastRequestedAt = new Date();
    await user.save({ validateBeforeSave: false });

    sendPasswordResetOtpEmail({
      name: user.name,
      email: user.email,
      otp,
    }).catch((err) =>
      console.error("[Auth] Password reset OTP email failed:", err.message),
    );

    res.json({
      success: true,
      message: GENERIC_RESET_MESSAGE,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify password reset OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const email = String(req.body.email).toLowerCase().trim();
    const otp = String(req.body.otp).trim();

    const user = await User.findOne({ email }).select(
      "+passwordResetOtpHash +passwordResetOtpExpires",
    );

    if (
      !user ||
      !user.passwordResetOtpHash ||
      !user.passwordResetOtpExpires ||
      user.passwordResetOtpExpires < new Date() ||
      user.passwordResetOtpHash !== hashOtp(otp, email)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    user.passwordResetVerifiedUntil = new Date(
      Date.now() + VERIFIED_WINDOW_MS,
    );
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: "Verification code confirmed. You can now set a new password.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password after OTP verification
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const email = String(req.body.email).toLowerCase().trim();
    const { password } = req.body;

    const user = await User.findOne({ email }).select(
      "+password +passwordResetVerifiedUntil",
    );

    if (
      !user ||
      !user.passwordResetVerifiedUntil ||
      user.passwordResetVerifiedUntil < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please verify your code before resetting your password.",
      });
    }

    user.password = password;
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpires = undefined;
    user.passwordResetVerifiedUntil = undefined;
    user.passwordResetLastRequestedAt = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    next(error);
  }
};
