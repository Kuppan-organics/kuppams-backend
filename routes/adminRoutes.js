const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getAllOrders,
  getAllUsers,
  getStats,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");
const { paginationValidator } = require("../middleware/validator");

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

module.exports = router;
