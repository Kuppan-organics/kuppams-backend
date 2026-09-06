const Order = require("../models/Order");

/**
 * Validate coupon for a user and cart total.
 * Returns { valid: true, coupon } or { valid: false, statusCode, message, ...extras }
 */
async function validateCouponForUser(coupon, userId, cartTotal = 0) {
  if (!coupon) {
    return {
      valid: false,
      statusCode: 404,
      message: "Invalid coupon code",
    };
  }

  if (!coupon.isActive) {
    return {
      valid: false,
      statusCode: 400,
      message: "This coupon is not active",
    };
  }

  if (coupon.expiryDate && new Date() > coupon.expiryDate) {
    return {
      valid: false,
      statusCode: 400,
      message: "This coupon has expired",
    };
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return {
      valid: false,
      statusCode: 400,
      message: "This coupon has reached its usage limit",
    };
  }

  const totalAmount = parseFloat(cartTotal) || 0;
  if (coupon.minPurchaseAmount && totalAmount < coupon.minPurchaseAmount) {
    return {
      valid: false,
      statusCode: 400,
      message: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} is required to use this coupon`,
      minPurchaseAmount: coupon.minPurchaseAmount,
    };
  }

  if (coupon.allowMultipleUsePerUser === false && userId) {
    const priorUse = await Order.findOne({
      user: userId,
      couponCode: coupon.code,
      status: { $ne: "cancelled" },
    }).select("_id");

    if (priorUse) {
      return {
        valid: false,
        statusCode: 400,
        message: "You have already used this coupon",
      };
    }
  }

  const discountAmount = (totalAmount * coupon.discountPercentage) / 100;
  const finalAmount = totalAmount - discountAmount;

  return {
    valid: true,
    coupon,
    discountAmount,
    finalAmount,
  };
}

module.exports = {
  validateCouponForUser,
};
