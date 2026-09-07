const mongoose = require("mongoose");
const Franchise = require("../models/Franchise");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const { deleteFranchiseImage } = require("../config/cloudinary");

const populateFranchise = (query) =>
  query.populate("user", "name email phone role isActive");

// @desc    Get all franchises
// @route   GET /api/admin/franchises
// @access  Admin
exports.getFranchises = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [franchises, total] = await Promise.all([
      populateFranchise(
        Franchise.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      ),
      Franchise.countDocuments(),
    ]);

    res.json({
      success: true,
      franchises,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single franchise
// @route   GET /api/admin/franchises/:id
// @access  Admin
exports.getFranchise = async (req, res, next) => {
  try {
    const franchise = await populateFranchise(
      Franchise.findById(req.params.id),
    );

    if (!franchise) {
      return res.status(404).json({
        success: false,
        message: "Franchise not found",
      });
    }

    res.json({
      success: true,
      franchise,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create franchise with owner account
// @route   POST /api/admin/franchises
// @access  Admin
exports.createFranchise = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      franchiseName,
      storeName,
      ownerName,
      ownerEmail,
      ownerPhone,
      location,
      state,
      district,
      physicalAddress,
      description,
      password,
      isActive,
    } = req.body;

    const normalizedEmail = ownerEmail?.trim()?.toLowerCase() || null;
    const normalizedPhone = ownerPhone.trim();

    if (normalizedEmail) {
      const existingEmail = await User.findOne({ email: normalizedEmail }).session(
        session,
      );
      if (existingEmail) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "A user with this email already exists",
        });
      }
    }

    const existingPhone = await User.findOne({
      phone: normalizedPhone,
      role: "franchise",
    }).session(session);
    if (existingPhone) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "A franchise owner with this phone number already exists",
      });
    }

    const photo = req.file ? req.file.path : null;

    const [user] = await User.create(
      [
        {
          name: ownerName.trim(),
          email: normalizedEmail || undefined,
          phone: normalizedPhone,
          password,
          role: "franchise",
        },
      ],
      { session },
    );

    const [franchise] = await Franchise.create(
      [
        {
          franchiseName: franchiseName.trim(),
          storeName: storeName.trim(),
          ownerName: ownerName.trim(),
          ownerEmail: normalizedEmail,
          ownerPhone: normalizedPhone,
          location: location.trim(),
          state: state.trim(),
          district: district.trim(),
          physicalAddress: physicalAddress.trim(),
          description: description?.trim() || "",
          photo,
          user: user._id,
          isActive: isActive !== false && isActive !== "false",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    const populated = await populateFranchise(Franchise.findById(franchise._id));

    res.status(201).json({
      success: true,
      message: "Franchise created successfully",
      franchise: populated,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (req.file?.path) {
      await deleteFranchiseImage(req.file.path);
    }
    next(error);
  }
};

// @desc    Update franchise
// @route   PUT /api/admin/franchises/:id
// @access  Admin
exports.updateFranchise = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const franchise = await Franchise.findById(req.params.id).populate(
      "user",
      "name email phone role",
    );

    if (!franchise) {
      if (req.file?.path) {
        await deleteFranchiseImage(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: "Franchise not found",
      });
    }

    const {
      franchiseName,
      storeName,
      ownerName,
      ownerEmail,
      ownerPhone,
      location,
      state,
      district,
      physicalAddress,
      description,
      password,
      isActive,
    } = req.body;

    const normalizedEmail =
      ownerEmail !== undefined
        ? ownerEmail?.trim()?.toLowerCase() || null
        : franchise.ownerEmail;
    const normalizedPhone =
      ownerPhone !== undefined ? ownerPhone.trim() : franchise.ownerPhone;

    if (normalizedEmail) {
      const existingEmail = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: franchise.user._id },
      });
      if (existingEmail) {
        if (req.file?.path) {
          await deleteFranchiseImage(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "A user with this email already exists",
        });
      }
    }

    if (normalizedPhone) {
      const existingPhone = await User.findOne({
        phone: normalizedPhone,
        role: "franchise",
        _id: { $ne: franchise.user._id },
      });
      if (existingPhone) {
        if (req.file?.path) {
          await deleteFranchiseImage(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "A franchise owner with this phone number already exists",
        });
      }
    }

    if (franchiseName !== undefined) franchise.franchiseName = franchiseName.trim();
    if (storeName !== undefined) franchise.storeName = storeName.trim();
    if (ownerName !== undefined) franchise.ownerName = ownerName.trim();
    if (ownerEmail !== undefined) franchise.ownerEmail = normalizedEmail;
    if (ownerPhone !== undefined) franchise.ownerPhone = normalizedPhone;
    if (location !== undefined) franchise.location = location.trim();
    if (state !== undefined) franchise.state = state.trim();
    if (district !== undefined) franchise.district = district.trim();
    if (physicalAddress !== undefined) {
      franchise.physicalAddress = physicalAddress.trim();
    }
    if (description !== undefined) franchise.description = description.trim();
    if (isActive !== undefined) {
      franchise.isActive = isActive !== false && isActive !== "false";
    }

    if (req.file) {
      if (franchise.photo) {
        await deleteFranchiseImage(franchise.photo);
      }
      franchise.photo = req.file.path;
    }

    const user = await User.findById(franchise.user._id).select("+password");
    if (user) {
      if (ownerName !== undefined) user.name = ownerName.trim();
      if (ownerEmail !== undefined) user.email = normalizedEmail || undefined;
      if (ownerPhone !== undefined) user.phone = normalizedPhone;
      if (password) user.password = password;
      await user.save();
    }

    await franchise.save();

    const populated = await populateFranchise(Franchise.findById(franchise._id));

    res.json({
      success: true,
      message: "Franchise updated successfully",
      franchise: populated,
    });
  } catch (error) {
    if (req.file?.path) {
      await deleteFranchiseImage(req.file.path);
    }
    next(error);
  }
};

// @desc    Delete franchise and owner account
// @route   DELETE /api/admin/franchises/:id
// @access  Admin
exports.deleteFranchise = async (req, res, next) => {
  try {
    const franchise = await Franchise.findById(req.params.id);

    if (!franchise) {
      return res.status(404).json({
        success: false,
        message: "Franchise not found",
      });
    }

    if (franchise.photo) {
      await deleteFranchiseImage(franchise.photo);
    }

    await User.findByIdAndDelete(franchise.user);
    await franchise.deleteOne();

    res.json({
      success: true,
      message: "Franchise deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get franchise profile for logged-in owner
// @route   GET /api/franchises/me
// @access  Franchise
exports.getMyFranchise = async (req, res, next) => {
  try {
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

    res.json({
      success: true,
      franchise,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active products for franchise bulk ordering
// @route   GET /api/franchises/products
// @access  Franchise
exports.getFranchiseProducts = async (req, res, next) => {
  try {
    const Product = require("../models/Product");
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select("name price discount stock images category quantity")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const productsWithPricing = products.map((product) => ({
      ...product,
      discountedPrice:
        product.discount > 0
          ? product.price * (1 - product.discount / 100)
          : product.price,
    }));

    res.json({
      success: true,
      products: productsWithPricing,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};
