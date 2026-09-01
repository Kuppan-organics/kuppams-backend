const Product = require("../models/Product");
const Review = require("../models/Review");
const Cart = require("../models/Cart");
const { validationResult } = require("express-validator");
const { deleteImage, deleteImages } = require("../config/cloudinary");

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { isActive: true };

    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    const formattedProducts = products.map((product) => ({
      name: product.name,
      category: product.category,
      price: product.price,
      discount: product.discount,
      images: product.images,
      quantity: product.quantity,
      variants: product.variants,
      isActive: product.isActive,
      discountedPrice: product.discountedPrice,
      id: product._id,
    }));

    res.json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      products: formattedProducts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      name,
      description,
      category,
      price,
      discount,
      stock,
      quantity,
      framingMethods,
      nutritionalBenefits,
      variants,
    } = req.body;

    // Extract image URLs from uploaded files
    const images = req.files ? req.files.map((file) => file.path) : [];

    // Parse JSON fields if they come as strings
    const parsedFramingMethods = framingMethods
      ? typeof framingMethods === "string"
        ? JSON.parse(framingMethods)
        : framingMethods
      : [];

    const parsedNutritionalBenefits = nutritionalBenefits
      ? typeof nutritionalBenefits === "string"
        ? JSON.parse(nutritionalBenefits)
        : nutritionalBenefits
      : [];

    const parsedVariants = variants
      ? typeof variants === "string"
        ? JSON.parse(variants)
        : variants
      : [];

    const product = await Product.create({
      name,
      description,
      category,
      price,
      discount: discount || 0,
      images,
      stock: stock || 0,
      quantity: quantity || "",
      framingMethods: parsedFramingMethods,
      nutritionalBenefits: parsedNutritionalBenefits,
      variants: parsedVariants,
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Prepare update data
    const updateData = { ...req.body };

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.path);

      // Delete old images from Cloudinary if requested
      if (req.body.deleteOldImages === "true" && product.images.length > 0) {
        for (const imageUrl of product.images) {
          await deleteImage(imageUrl);
        }
        updateData.images = newImages;
      } else {
        // Append new images to existing ones
        updateData.images = [...product.images, ...newImages];
      }
    }

    // Parse JSON fields if they come as strings
    if (updateData.framingMethods && typeof updateData.framingMethods === "string") {
      updateData.framingMethods = JSON.parse(updateData.framingMethods);
    }

    if (updateData.nutritionalBenefits && typeof updateData.nutritionalBenefits === "string") {
      updateData.nutritionalBenefits = JSON.parse(updateData.nutritionalBenefits);
    }

    if (updateData.variants && typeof updateData.variants === "string") {
      updateData.variants = JSON.parse(updateData.variants);
    }

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete all product images from Cloudinary
    if (product.images?.length > 0) {
      await deleteImages(product.images);
    }

    // Delete all reviews/comments for this product
    await Review.deleteMany({ product: product._id });

    // Remove product from user carts
    await Cart.updateMany(
      { "items.product": product._id },
      { $pull: { items: { product: product._id } } }
    );

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories
// @route   GET /api/products/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct("category", { isActive: true });

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    next(error);
  }
};
