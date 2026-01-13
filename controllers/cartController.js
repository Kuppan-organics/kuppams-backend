const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const total = await cart.calculateTotal();

    res.json({
      success: true,
      cart: {
        ...cart.toObject(),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { productId, quantity } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not available",
      });
    }

    // Check stock availability
    // stock = total available quantity in inventory
    // quantity = quantity user wants to buy
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock available. Available: ${product.stock}, Requested: ${quantity}`,
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Check if item already exists in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[itemIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock available. Available: ${product.stock}, Requested: ${newQuantity}`,
        });
      }
      cart.items[itemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    await cart.populate("items.product");

    const total = await cart.calculateTotal();

    res.json({
      success: true,
      cart: {
        ...cart.toObject(),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item
// @route   PUT /api/cart/:itemId
// @access  Private
exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    // Validate quantity
    if (!quantity || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity is required and must be at least 1",
      });
    }

    // Parse item-0 format to get index
    const match = itemId.match(/^item-(\d+)$/);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID format. Expected format: item-{index}",
      });
    }

    const itemIndex = parseInt(match[1], 10);

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    // Check stock availability
    const product = await Product.findById(cart.items[itemIndex].product);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not available",
      });
    }

    // stock = total available quantity in inventory
    // quantity = quantity user wants to buy
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock available. Available: ${product.stock}, Requested: ${quantity}`,
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    await cart.populate("items.product");

    const total = await cart.calculateTotal();

    res.json({
      success: true,
      cart: {
        ...cart.toObject(),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
exports.removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    // Parse item-0 format to get index
    const match = itemId.match(/^item-(\d+)$/);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID format. Expected format: item-{index}",
      });
    }

    const itemIndex = parseInt(match[1], 10);

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Check if item exists in cart
    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    // Remove the item
    cart.items.splice(itemIndex, 1);
    await cart.save();
    await cart.populate("items.product");

    const total = await cart.calculateTotal();

    res.json({
      success: true,
      message: "Item removed from cart successfully",
      cart: {
        ...cart.toObject(),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    next(error);
  }
};
