const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getAllOrders,
  getAllUsers,
  getStats,
} = require("../controllers/adminController");
const {
  getAllCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/couponController");
const { protect, authorize } = require("../middleware/auth");
const {
  paginationValidator,
  createCouponValidator,
  updateCouponValidator,
  couponIdValidator,
} = require("../middleware/validator");

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: Get all products (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get(
  "/products",
  protect,
  authorize("admin"),
  paginationValidator,
  getAllProducts
);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get(
  "/orders",
  protect,
  authorize("admin"),
  paginationValidator,
  getAllOrders
);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get(
  "/users",
  protect,
  authorize("admin"),
  paginationValidator,
  getAllUsers
);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get dashboard statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                     totalProducts:
 *                       type: number
 *                     totalOrders:
 *                       type: number
 *                     revenue:
 *                       type: number
 *                     ordersByStatus:
 *                       type: array
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get("/stats", protect, authorize("admin"), getStats);

/**
 * @swagger
 * components:
 *   schemas:
 *     Coupon:
 *       type: object
 *       required:
 *         - code
 *         - discountPercentage
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated coupon ID
 *         code:
 *           type: string
 *           description: Unique coupon code (uppercase)
 *         discountPercentage:
 *           type: number
 *           description: Discount percentage (0-100)
 *         description:
 *           type: string
 *           description: Coupon description
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether the coupon is active
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           description: Expiry date of the coupon
 *         usageLimit:
 *           type: number
 *           description: Maximum number of times the coupon can be used
 *         usedCount:
 *           type: number
 *           default: 0
 *           description: Number of times the coupon has been used
 *         minPurchaseAmount:
 *           type: number
 *           default: 0
 *           description: Minimum purchase amount required to use the coupon
 *         isValid:
 *           type: boolean
 *           description: Virtual field indicating if coupon is valid
 */

/**
 * @swagger
 * /api/admin/coupons:
 *   get:
 *     summary: Get all coupons (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 coupons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get(
  "/coupons",
  protect,
  authorize("admin"),
  paginationValidator,
  getAllCoupons
);

/**
 * @swagger
 * /api/admin/coupons/{id}:
 *   get:
 *     summary: Get single coupon by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     responses:
 *       200:
 *         description: Coupon retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 coupon:
 *                   $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Coupon not found
 */
router.get(
  "/coupons/:id",
  protect,
  authorize("admin"),
  couponIdValidator,
  getCoupon
);

/**
 * @swagger
 * /api/admin/coupons:
 *   post:
 *     summary: Create a new coupon (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountPercentage
 *             properties:
 *               code:
 *                 type: string
 *                 description: Unique coupon code (will be converted to uppercase)
 *               discountPercentage:
 *                 type: number
 *                 description: Discount percentage (0-100)
 *               description:
 *                 type: string
 *                 description: Coupon description
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Expiry date of the coupon
 *               usageLimit:
 *                 type: number
 *                 description: Maximum number of times the coupon can be used
 *               minPurchaseAmount:
 *                 type: number
 *                 default: 0
 *                 description: Minimum purchase amount required
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 coupon:
 *                   $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Validation error or coupon code already exists
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.post(
  "/coupons",
  protect,
  authorize("admin"),
  createCouponValidator,
  createCoupon
);

/**
 * @swagger
 * /api/admin/coupons/{id}:
 *   put:
 *     summary: Update a coupon (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Coupon code (will be converted to uppercase)
 *               discountPercentage:
 *                 type: number
 *                 description: Discount percentage (0-100)
 *               description:
 *                 type: string
 *                 description: Coupon description
 *               isActive:
 *                 type: boolean
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Expiry date of the coupon
 *               usageLimit:
 *                 type: number
 *                 description: Maximum number of times the coupon can be used
 *               minPurchaseAmount:
 *                 type: number
 *                 description: Minimum purchase amount required
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 coupon:
 *                   $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Validation error or coupon code already exists
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Coupon not found
 */
router.put(
  "/coupons/:id",
  protect,
  authorize("admin"),
  couponIdValidator,
  updateCouponValidator,
  updateCoupon
);

/**
 * @swagger
 * /api/admin/coupons/{id}:
 *   delete:
 *     summary: Delete a coupon (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     responses:
 *       200:
 *         description: Coupon deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Coupon not found
 */
router.delete(
  "/coupons/:id",
  protect,
  authorize("admin"),
  couponIdValidator,
  deleteCoupon
);

module.exports = router;
