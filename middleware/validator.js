const { body, param, query } = require("express-validator");

// Auth validators
exports.registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone must be 10 digits"),
];

exports.loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

exports.updateProfileValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone must be 10 digits"),
  body("profilePhoto")
    .optional()
    .trim()
    .isURL()
    .withMessage("Profile photo must be a valid URL"),
  body("address.street").optional().trim(),
  body("address.city").optional().trim(),
  body("address.state").optional().trim(),
  body("address.zipCode").optional().trim(),
  body("address.country").optional().trim(),
];

exports.updateProfilePhotoValidator = [
  body("profilePhoto")
    .notEmpty()
    .withMessage("Profile photo URL is required")
    .trim()
    .isURL()
    .withMessage("Profile photo must be a valid URL"),
];

// Product validators
exports.createProductValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Product category is required"),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("images.*")
    .optional()
    .isURL()
    .withMessage("Each image must be a valid URL"),
];

exports.updateProductValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("category")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category cannot be empty"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("images.*")
    .optional()
    .isURL()
    .withMessage("Each image must be a valid URL"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

exports.productIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),
];

// Cart validators
exports.addToCartValidator = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
];

exports.updateCartItemValidator = [
  param("itemId")
    .notEmpty()
    .withMessage("Item ID is required")
    .isMongoId()
    .withMessage("Invalid item ID"),
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
];

exports.cartItemIdValidator = [
  param("itemId")
    .notEmpty()
    .withMessage("Item ID is required")
    .isMongoId()
    .withMessage("Invalid item ID"),
];

// Order validators
exports.createOrderValidator = [
  body("shippingAddress.street").optional().trim(),
  body("shippingAddress.city").optional().trim(),
  body("shippingAddress.state").optional().trim(),
  body("shippingAddress.zipCode").optional().trim(),
  body("shippingAddress.country").optional().trim(),
  body("couponCode")
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Coupon code must be between 3 and 20 characters"),
];

exports.buyNowValidator = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("shippingAddress.street").optional().trim(),
  body("shippingAddress.city").optional().trim(),
  body("shippingAddress.state").optional().trim(),
  body("shippingAddress.zipCode").optional().trim(),
  body("shippingAddress.country").optional().trim(),
  body("couponCode")
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Coupon code must be between 3 and 20 characters"),
];

exports.orderIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Order ID is required")
    .isMongoId()
    .withMessage("Invalid order ID"),
];

exports.updateOrderStatusValidator = [
  param("id")
    .notEmpty()
    .withMessage("Order ID is required")
    .isMongoId()
    .withMessage("Invalid order ID"),
  body("status")
    .optional()
    .isIn([
      "placed",
      "accepted",
      "packing",
      "sent_to_delivery",
      "delivered",
      "cancelled",
    ])
    .withMessage(
      "Invalid order status. Must be one of: placed, accepted, packing, sent_to_delivery, delivered, cancelled"
    ),
  body("paymentStatus")
    .optional()
    .isIn(["pending", "paid", "failed"])
    .withMessage("Invalid payment status"),
  body("expectedDeliveryDate")
    .optional()
    .isISO8601()
    .withMessage("Expected delivery date must be a valid ISO 8601 date"),
  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Note must be less than 500 characters"),
];

// Coupon validators
exports.createCouponValidator = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Coupon code is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Coupon code must be between 3 and 20 characters")
    .matches(/^[A-Z0-9]+$/)
    .withMessage("Coupon code must contain only uppercase letters and numbers"),
  body("discountPercentage")
    .notEmpty()
    .withMessage("Discount percentage is required")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount percentage must be between 0 and 100"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  body("expiryDate")
    .optional()
    .isISO8601()
    .withMessage("Expiry date must be a valid ISO 8601 date"),
  body("usageLimit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Usage limit must be a positive integer"),
  body("minPurchaseAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum purchase amount must be a non-negative number"),
];

exports.updateCouponValidator = [
  body("code")
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Coupon code must be between 3 and 20 characters")
    .matches(/^[A-Z0-9]+$/)
    .withMessage("Coupon code must contain only uppercase letters and numbers"),
  body("discountPercentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount percentage must be between 0 and 100"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  body("expiryDate")
    .optional()
    .isISO8601()
    .withMessage("Expiry date must be a valid ISO 8601 date"),
  body("usageLimit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Usage limit must be a positive integer"),
  body("minPurchaseAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum purchase amount must be a non-negative number"),
];

exports.couponIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Coupon ID is required")
    .isMongoId()
    .withMessage("Invalid coupon ID"),
];

exports.validateCouponValidator = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Coupon code is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Coupon code must be between 3 and 20 characters"),
  body("cartTotal")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Cart total must be a non-negative number"),
];

// Query validators
exports.paginationValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];
