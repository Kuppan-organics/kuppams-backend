const express = require("express");
const router = express.Router();
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/auth");
const {
  createOrderValidator,
  orderIdValidator,
  updateOrderStatusValidator,
  paginationValidator,
} = require("../middleware/validator");

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         product:
 *           type: string
 *         name:
 *           type: string
 *         quantity:
 *           type: number
 *         price:
 *           type: number
 *         discount:
 *           type: number
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         user:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         totalAmount:
 *           type: number
 *         shippingAddress:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zipCode:
 *               type: string
 *             country:
 *               type: string
 *         orderNumber:
 *           type: string
 *           description: Unique order number (e.g., #738)
 *         status:
 *           type: string
 *           enum: [placed, accepted, packing, sent_to_delivery, delivered, cancelled]
 *           default: placed
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed]
 *           default: pending
 *         expectedDeliveryDate:
 *           type: string
 *           format: date-time
 *           description: Expected delivery date (set when status is sent_to_delivery)
 *         statusTimeline:
 *           type: array
 *           description: Timeline of status changes
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               note:
 *                 type: string
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authorized
 */
router.get("/", protect, getOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get single order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to access this order
 *       404:
 *         description: Order not found
 */
router.get("/:id", protect, orderIdValidator, getOrder);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order from cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Cart is empty or insufficient stock
 *       401:
 *         description: Not authorized
 */
router.post("/", protect, createOrderValidator, createOrder);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [placed, accepted, packing, sent_to_delivery, delivered, cancelled]
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed]
 *               expectedDeliveryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Expected delivery date
 *               note:
 *                 type: string
 *                 description: Optional note for the status change
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Order not found
 */
router.put(
  "/:id/status",
  protect,
  authorize("admin"),
  updateOrderStatusValidator,
  updateOrderStatus
);

module.exports = router;
