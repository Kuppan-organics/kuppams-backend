const Coupon = require("../models/Coupon");
const { validationResult } = require("express-validator");

// @desc    Get all coupons
// @route   GET /api/admin/coupons
// @access  Private/Admin
exports.getAllCoupons = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Coupon.countDocuments(query);

    res.json({
      success: true,
      count: coupons.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      coupons,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single coupon
// @route   GET /api/admin/coupons/:id
// @access  Private/Admin
exports.getCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.json({
      success: true,
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create coupon
// @route   POST /api/admin/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      code,
      discountPercentage,
      description,
      isActive,
      expiryDate,
      usageLimit,
      minPurchaseAmount,
    } = req.body;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountPercentage,
      description: description || "",
      isActive: isActive !== undefined ? isActive : true,
      expiryDate: expiryDate || null,
      usageLimit: usageLimit || null,
      minPurchaseAmount: minPurchaseAmount || 0,
      usedCount: 0,
    });

    res.status(201).json({
      success: true,
      coupon,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }
    next(error);
  }
};

// @desc    Update coupon
// @route   PUT /api/admin/coupons/:id
// @access  Private/Admin
exports.updateCoupon = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    let coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // If code is being updated, check for duplicates
    if (req.body.code && req.body.code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({
        code: req.body.code.toUpperCase(),
      });
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: "Coupon code already exists",
        });
      }
      req.body.code = req.body.code.toUpperCase();
    }

    // Update coupon
    coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      coupon,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }
    next(error);
  }
};

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    await Coupon.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate coupon code (User)
// @route   POST /api/coupons/validate
// @access  Private
exports.validateCoupon = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { code, cartTotal } = req.body;

    // Find coupon by code (case insensitive)
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "This coupon is not active",
      });
    }

    // Check if coupon has expired
    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      return res.status(400).json({
        success: false,
        message: "This coupon has expired",
      });
    }

    // Check if usage limit has been reached
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "This coupon has reached its usage limit",
      });
    }

    // Check minimum purchase amount
    const totalAmount = parseFloat(cartTotal) || 0;
    if (coupon.minPurchaseAmount && totalAmount < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} is required to use this coupon`,
        minPurchaseAmount: coupon.minPurchaseAmount,
      });
    }

    // Calculate discount amount
    const discountAmount = (totalAmount * coupon.discountPercentage) / 100;
    const finalAmount = totalAmount - discountAmount;

    res.json({
      success: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
        description: coupon.description,
        discountAmount: discountAmount.toFixed(2),
        finalAmount: finalAmount.toFixed(2),
      },
    });
  } catch (error) {
    next(error);
  }
};
