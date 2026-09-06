const Category = require("../models/Category");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @desc    Get all categories (admin)
// @route   GET /api/admin/categories
// @access  Admin
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/admin/categories
// @access  Admin
exports.createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, isActive } = req.body;
    const trimmedName = String(name).trim();

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await Category.create({
      name: trimmedName,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Admin
exports.updateCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const oldName = category.name;
    const { name, isActive } = req.body;

    if (name && String(name).trim() !== oldName) {
      const trimmedName = String(name).trim();
      const existing = await Category.findOne({
        _id: { $ne: category._id },
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Category already exists",
        });
      }

      category.name = trimmedName;

      await Product.updateMany(
        { category: oldName },
        { $set: { category: trimmedName } },
      );
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    await category.save();

    res.json({
      success: true,
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const productCount = await Product.countDocuments({
      category: category.name,
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${productCount} product(s) are using it.`,
        productCount,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active category names (public)
// @route   Used by productController.getCategories
exports.getActiveCategoryNames = async () => {
  const categories = await Category.find({ isActive: true })
    .sort({ name: 1 })
    .select("name");

  return categories.map((category) => category.name);
};
