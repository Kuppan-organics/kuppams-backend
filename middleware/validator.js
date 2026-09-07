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
    .withMessage("Email or phone is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

exports.forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
];

exports.verifyOtpValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("Verification code is required")
    .matches(/^[0-9]{6}$/)
    .withMessage("Verification code must be 6 digits"),
];

exports.resetPasswordValidator = [
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

exports.upsertAddressValidator = [
  param("label")
    .isIn(["home", "work", "other"])
    .withMessage("Label must be home, work, or other"),
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("street").trim().notEmpty().withMessage("Street address is required"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("state").trim().notEmpty().withMessage("State is required"),
  body("zipCode")
    .trim()
    .notEmpty()
    .withMessage("PIN code is required")
    .matches(/^\d{6}$/)
    .withMessage("PIN code must be 6 digits"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone must be 10 digits"),
  body("country").optional().trim(),
];

exports.deleteAddressValidator = [
  param("label")
    .isIn(["home", "work", "other"])
    .withMessage("Label must be home, work, or other"),
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
  body("framingMethods")
    .optional()
    .isArray()
    .withMessage("Framing methods must be an array"),
  body("framingMethods.*")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Each framing method must be a non-empty string"),
  body("nutritionalBenefits")
    .optional()
    .isArray({ min: 3 })
    .withMessage("Nutritional benefits must be an array with at least 3 values"),
  body("nutritionalBenefits.*")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Each nutritional benefit must be a non-empty string"),
  body("variants")
    .optional()
    .isArray()
    .withMessage("Variants must be an array"),
  body("variants.*.quantity")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Variant quantity label is required"),
  body("variants.*.price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Variant price must be a positive number"),
  body("variants.*.discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Variant discount must be between 0 and 100"),
  body("variants.*.stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Variant stock must be a non-negative integer"),
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
  body("framingMethods")
    .optional()
    .isArray()
    .withMessage("Framing methods must be an array"),
  body("framingMethods.*")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Each framing method must be a non-empty string"),
  body("nutritionalBenefits")
    .optional()
    .isArray({ min: 3 })
    .withMessage("Nutritional benefits must be an array with at least 3 values"),
  body("nutritionalBenefits.*")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Each nutritional benefit must be a non-empty string"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  body("variants")
    .optional()
    .isArray()
    .withMessage("Variants must be an array"),
  body("variants.*.quantity")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Variant quantity label is required"),
  body("variants.*.price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Variant price must be a positive number"),
  body("variants.*.discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Variant discount must be between 0 and 100"),
  body("variants.*.stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Variant stock must be a non-negative integer"),
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
  body("allowMultipleUsePerUser")
    .optional()
    .isBoolean()
    .withMessage("allowMultipleUsePerUser must be a boolean"),
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
  body("allowMultipleUsePerUser")
    .optional()
    .isBoolean()
    .withMessage("allowMultipleUsePerUser must be a boolean"),
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

// Review validators
exports.createReviewValidator = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),
  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Review comment is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Review must be between 1 and 200 characters"),
];

exports.updateReviewValidator = [
  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Review comment is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Review must be between 1 and 200 characters"),
];

exports.reviewIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Review ID is required")
    .isMongoId()
    .withMessage("Invalid review ID"),
];

exports.productIdParamValidator = [
  param("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),
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

exports.contactFormValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("subject")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Subject must be at most 200 characters"),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 10, max: 5000 })
    .withMessage("Message must be between 10 and 5000 characters"),
];

exports.contactStatusValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["new", "read", "archived"])
    .withMessage("Status must be new, read, or archived"),
];

exports.contactIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Contact message ID is required")
    .isMongoId()
    .withMessage("Invalid contact message ID"),
];

exports.createCategoryValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

exports.updateCategoryValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

exports.categoryIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Category ID is required")
    .isMongoId()
    .withMessage("Invalid category ID"),
];

exports.franchiseEnquiryValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name must be at most 100 characters"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .isLength({ max: 20 })
    .withMessage("Phone number must be at most 20 characters"),
  body("email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description must be at most 5000 characters"),
];

exports.createFranchiseValidator = [
  body("franchiseName")
    .trim()
    .notEmpty()
    .withMessage("Franchise name is required")
    .isLength({ max: 200 }),
  body("storeName")
    .trim()
    .notEmpty()
    .withMessage("Store name is required")
    .isLength({ max: 200 }),
  body("ownerName")
    .trim()
    .notEmpty()
    .withMessage("Owner name is required")
    .isLength({ max: 100 }),
  body("ownerPhone")
    .trim()
    .notEmpty()
    .withMessage("Owner phone is required")
    .isLength({ max: 20 }),
  body("ownerEmail")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Please provide a valid owner email"),
  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ max: 100 }),
  body("state")
    .trim()
    .notEmpty()
    .withMessage("State is required")
    .isLength({ max: 100 }),
  body("district")
    .trim()
    .notEmpty()
    .withMessage("District is required")
    .isLength({ max: 100 }),
  body("physicalAddress")
    .trim()
    .notEmpty()
    .withMessage("Physical address is required")
    .isLength({ max: 500 }),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }),
  body("password")
    .notEmpty()
    .withMessage("Owner password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

exports.updateFranchiseValidator = [
  body("franchiseName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }),
  body("storeName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }),
  body("ownerName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }),
  body("ownerPhone")
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 }),
  body("ownerEmail")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Please provide a valid owner email"),
  body("location")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }),
  body("state")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }),
  body("district")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }),
  body("physicalAddress")
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 }),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

exports.franchiseIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Franchise ID is required")
    .isMongoId()
    .withMessage("Invalid franchise ID"),
];

exports.franchiseEnquiryIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Franchise enquiry ID is required")
    .isMongoId()
    .withMessage("Invalid franchise enquiry ID"),
];

exports.franchiseEnquiryStatusValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["new", "read", "archived"])
    .withMessage("Status must be new, read, or archived"),
];

exports.createFranchiseOrderValidator = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Items must be a non-empty array"),
  body("items.*.productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
];
