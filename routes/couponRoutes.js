const express = require("express");
const router = express.Router();
const { validateCoupon } = require("../controllers/couponController");
const { protect } = require("../middleware/auth");
const { validateCouponValidator } = require("../middleware/validator");

/**
 * @swagger
 * /api/coupons/validate:
 *   post:
 *     summary: Validate and get coupon discount details (User)
 *     tags: [Coupons]
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
 *             properties:
 *               code:
 *                 type: string
 *                 description: Coupon code to validate
 *               cartTotal:
 *                 type: number
 *                 description: Total cart amount (optional, for validation)
 *     responses:
 *       200:
 *         description: Coupon validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 coupon:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     code:
 *                       type: string
 *                     discountPercentage:
 *                       type: number
 *                     description:
 *                       type: string
 *                     discountAmount:
 *                       type: string
 *                     finalAmount:
 *                       type: string
 *       400:
 *         description: Invalid coupon code or validation failed
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Coupon not found
 */
router.post(
  "/validate",
  protect,
  validateCouponValidator,
  validateCoupon
);

module.exports = router;
