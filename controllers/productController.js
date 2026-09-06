const Product = require("../models/Product");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Cart = require("../models/Cart");
const { validationResult } = require("express-validator");
const { deleteImages } = require("../config/cloudinary");

const formatProductResponse = (product, extras = {}) => ({
  id: product._id,
  name: product.name,
  description: product.description,
  category: product.category,
  price: product.price,
  discount: product.discount || 0,
  images: product.images,
  quantity: product.quantity,
  stock: product.stock,
  variants: product.variants,
  isActive: product.isActive,
  discountedPrice:
    product.discount > 0
      ? product.price * (1 - product.discount / 100)
      : product.price,
  ...extras,
});

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { isActive: true };

    if (category) {
      query.category = category;
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
      .select("name category price discount images quantity variants isActive")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean({ virtuals: true });

    const total = await Product.countDocuments(query);

    const formattedProducts = products.map((product) =>
      formatProductResponse(product)
    );

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
        await deleteImages(product.images);
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

// @desc    Get best selling products
// @route   GET /api/products/best-selling
// @access  Public
exports.getBestSellingProducts = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 4, 1), 12);

    const salesAgg = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ]);

    let products = [];

    if (salesAgg.length > 0) {
      const productIds = salesAgg.map((entry) => entry._id);
      const productDocs = await Product.find({
        _id: { $in: productIds },
        isActive: true,
      }).lean();

      const salesMap = new Map(
        salesAgg.map((entry) => [entry._id.toString(), entry.totalSold])
      );

      products = productIds
        .map((id) => {
          const product = productDocs.find(
            (doc) => doc._id.toString() === id.toString()
          );
          if (!product) return null;
          return formatProductResponse(product, {
            totalSold: salesMap.get(id.toString()) || 0,
          });
        })
        .filter(Boolean);
    }

    if (products.length < limit) {
      const excludeIds = products.map((product) => product.id);
      const fallbackProducts = await Product.find({
        isActive: true,
        _id: { $nin: excludeIds },
      })
        .sort({ createdAt: -1 })
        .limit(limit - products.length)
        .lean();

      products = [
        ...products,
        ...fallbackProducts.map((product) => formatProductResponse(product)),
      ];
    }

    res.json({
      success: true,
      count: products.length,
      products,
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
