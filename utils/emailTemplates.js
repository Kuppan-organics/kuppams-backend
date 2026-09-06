/**
 * HTML email templates for Kuppam Organics.
 * All amounts are in INR (₹). Order items expect: name, quantity, price, discount.
 */

const APP_NAME = "Kuppam Organics";

/** Light walnut brown palette (logo-aligned). */
const WALNUT = {
  header: "#c4a77d",           // light walnut
  headerDark: "#a67c52",       // walnut
  headerGradient: "linear-gradient(135deg, #c9b18a 0%, #a67c52 100%)",
  textOnHeader: "#3d2914",     // dark brown for contrast
  textOnHeaderMuted: "rgba(61, 41, 20, 0.85)",
  border: "#d4b896",           // light walnut border
};

const BASE_STYLES = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.5;
  color: #333;
  max-width: 600px;
  margin: 0 auto;
`;

function formatCurrency(amount) {
  return `₹${Number(amount).toFixed(2)}`;
}

function getItemPrice(item) {
  const discounted = item.price * (1 - (item.discount || 0) / 100);
  return discounted * item.quantity;
}

/**
 * Registration / Welcome email – sent when a user registers.
 */
function getRegistrationEmailHtml({ name, email }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${APP_NAME} 🌱</title>
</head>

<body style="margin:0; padding:0; background:#f3efe9; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;">
    <tr>
      <td align="center">

        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:620px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${WALNUT.headerGradient}; padding:28px; text-align:center;">
              <table cellpadding="0" cellspacing="0" align="center" style="width:140px; height:140px; border-radius:50%; background:#fff; margin:0 auto 14px;">
                <tr><td align="center" style="padding:14px;">
                  <img src="cid:kuppam-logo" alt="${APP_NAME}" width="112" height="112" style="display:block; border-radius:50%; object-fit:contain;" />
                </td></tr>
              </table>

              <h1 style="margin:0; color:${WALNUT.textOnHeader}; font-size:22px;">
                Welcome to the ${APP_NAME} family 🌿
              </h1>

              <p style="margin:8px 0 0; color:${WALNUT.textOnHeader}; opacity:0.9; font-size:14px;">
                We’re happy you’re here
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px; color:#3d2914;">

              <p style="font-size:18px; margin:0 0 8px;">
                Hi <strong>${name}</strong>,
              </p>

              <p style="margin:0 0 16px; line-height:1.6;">
                Thanks for joining <strong>${APP_NAME}</strong>! Your account is officially ready 🎉
              </p>

              <p style="margin:0 0 16px; line-height:1.6;">
                You can now explore our range of <strong>organic, high-quality products</strong>,
                add your favorites to the cart, and place your first order with ease.
              </p>

              <!-- Account Info -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="margin:20px 0; background:#faf7f2; border:1px solid ${WALNUT.border}; border-radius:12px;">
                <tr>
                  <td style="padding:14px;">
                    <p style="margin:4px 0; font-size:13px; opacity:0.8;">
                      Registered Email
                    </p>
                    <p style="margin:0; font-weight:bold;">
                      ${email}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Gentle Note -->
              <p style="margin:18px 0 0; font-size:14px; color:#6b5a47; line-height:1.5;">
                If you didn’t create this account, you can safely ignore this email.
              </p>

              <p style="margin:26px 0 0;">
                With warm wishes,<br>
                <strong>${APP_NAME} Team</strong>
              </p>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <p style="margin:16px 0 0; font-size:12px; color:#8a7a68;">
          © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
        </p>

      </td>
    </tr>
  </table>
</body>
</html>

`.trim();
}

/**
 * Order confirmation email – sent when an order is placed (with order details and pricing).
 */
function getOrderConfirmationEmailHtml({ userName, orderNumber, order, orderDate }) {
  const dateStr = orderDate ? new Date(orderDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const addr = order.shippingAddress || {};
  const addressLines = [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean).join(", ") || "—";

  let rows = "";
  for (const item of order.items || []) {
    const itemTotal = getItemPrice(item);
    const priceDisplay = item.discount ? `${formatCurrency(item.price)} (${item.discount}% off)` : formatCurrency(item.price);
    rows += `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #eee;">${item.name}</td>
        <td style="padding:10px; border-bottom:1px solid #eee; text-align:center;">${item.quantity}</td>
        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">${priceDisplay}</td>
        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">${formatCurrency(itemTotal)}</td>
      </tr>`;
  }

  const hasCoupon = order.couponCode && (order.couponDiscount > 0 || order.discountAmount > 0);
  const totalAmount = order.totalAmount != null ? order.totalAmount : 0;
  const discountAmount = order.discountAmount != null ? order.discountAmount : 0;
  const finalAmount = order.finalAmount != null ? order.finalAmount : totalAmount - discountAmount;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed • ${orderNumber}</title>
</head>

<body style="margin:0; padding:0; background:#f3efe9; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;">
    <tr>
      <td align="center">

        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${WALNUT.headerGradient}; padding:28px; text-align:center;">
              <table cellpadding="0" cellspacing="0" align="center" style="width:140px; height:140px; border-radius:50%; background:#fff; margin:0 auto 12px;">
                <tr><td align="center" style="padding:14px;">
                  <img src="cid:kuppam-logo" alt="${APP_NAME}" width="112" height="112" style="display:block; border-radius:50%; object-fit:contain;" />
                </td></tr>
              </table>
              <h1 style="margin:0; color:${WALNUT.textOnHeader}; font-size:22px;">
                🎉 Order Confirmed!
              </h1>
              <p style="margin:6px 0 0; color:${WALNUT.textOnHeader}; opacity:0.9; font-size:14px;">
                Thanks for shopping with ${APP_NAME}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px; color:#3d2914;">

              <p style="font-size:18px; margin:0 0 8px;">Hi <strong>${userName}</strong>,</p>
              <p style="margin:0 0 16px; line-height:1.6;">
                We’ve received your order and it’s already being prepared with care 🌿
              </p>

              <!-- Order Meta -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="margin:20px 0; background:#faf7f2; border:1px solid ${WALNUT.border}; border-radius:12px;">
                <tr>
                  <td style="padding:14px;">
                    <p style="margin:4px 0; font-size:14px;">Order Number</p>
                    <p style="margin:0; font-size:18px; font-weight:bold; letter-spacing:0.5px;">
                      ${orderNumber}
                    </p>
                  </td>
                  <td style="padding:14px; text-align:right;">
                    <p style="margin:4px 0; font-size:14px;">Order Date</p>
                    <p style="margin:0; font-weight:bold;">${dateStr}</p>
                  </td>
                </tr>
              </table>

              <!-- Address -->
              <p style="margin:24px 0 6px; font-weight:bold;">📦 Shipping Address</p>
              <p style="margin:0; line-height:1.6;">${addressLines}</p>

              <!-- Items Table -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="margin:28px 0; border-collapse:collapse;">
                <thead>
                  <tr style="background:#f5f0e8;">
                    <th style="padding:12px; text-align:left;">Item</th>
                    <th style="padding:12px; text-align:center;">Qty</th>
                    <th style="padding:12px; text-align:right;">Price</th>
                    <th style="padding:12px; text-align:right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>

              <!-- Price Summary -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f5f0e8; border-radius:12px; padding:16px;">
                <tr>
                  <td style="padding:6px 0;">Subtotal</td>
                  <td style="padding:6px 0; text-align:right;"><strong>${formatCurrency(totalAmount)}</strong></td>
                </tr>

                ${hasCoupon ? `
                <tr>
                  <td style="padding:6px 0;">Coupon (${order.couponCode})</td>
                  <td style="padding:6px 0; text-align:right; color:#2f7d32;">
                    <strong>- ${formatCurrency(discountAmount)}</strong>
                  </td>
                </tr>` : ""}

                <tr>
                  <td style="padding:10px 0; font-size:18px; font-weight:bold;">Final Amount</td>
                  <td style="padding:10px 0; text-align:right; font-size:18px; font-weight:bold;">
                    ${formatCurrency(finalAmount)}
                  </td>
                </tr>
              </table>

              <!-- Footer Message -->
              <p style="margin:28px 0 0; line-height:1.6;">
                We’ll keep you updated as your order moves along 🚚<br>
                If you have any questions, just reply to this email.
              </p>

              <p style="margin:24px 0 0;">
                With gratitude,<br>
                <strong>${APP_NAME} Team</strong>
              </p>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <p style="margin:16px 0 0; font-size:12px; color:#8a7a68;">
          © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
        </p>

      </td>
    </tr>
  </table>
</body>
</html>

`.trim();
}

/**
 * Order status update email – for: accepted, sent_to_delivery, delivered.
 */
function getOrderStatusEmailHtml({
  userName,
  orderNumber,
  status,
  orderDate,
  expectedDeliveryDate,
  note,
  items = [],
}) {
  const dateStr = orderDate ? new Date(orderDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const expectedStr = expectedDeliveryDate ? new Date(expectedDeliveryDate).toLocaleDateString("en-IN", { dateStyle: "medium" }) : null;

  let itemRows = "";
  for (const item of items) {
    const itemTotal = getItemPrice(item);
    const priceDisplay = item.discount
      ? `${formatCurrency(item.price)} (${item.discount}% off)`
      : formatCurrency(item.price);
    itemRows += `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #eee;">${item.name || "Product"}</td>
        <td style="padding:10px; border-bottom:1px solid #eee; text-align:center;">${item.quantity || 1}</td>
        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">${priceDisplay}</td>
        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">${formatCurrency(itemTotal)}</td>
      </tr>`;
  }

  const itemsSection =
    items.length > 0
      ? `
              <p style="margin:24px 0 8px; font-weight:bold;">🛒 Your Order Items</p>
              <table width="100%" cellpadding="0" cellspacing="0"
                style="margin:0 0 20px; border-collapse:collapse;">
                <thead>
                  <tr style="background:#f5f0e8;">
                    <th style="padding:12px; text-align:left;">Item</th>
                    <th style="padding:12px; text-align:center;">Qty</th>
                    <th style="padding:12px; text-align:right;">Price</th>
                    <th style="padding:12px; text-align:right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>`
      : "";

  const statusConfig = {
    accepted: {
      title: "Order Accepted",
      message: "Your order has been accepted and is being prepared.",
      color: WALNUT.headerDark,
    },
    packing: {
      title: "Order Packing",
      message: "Your order is being packed and will be dispatched soon.",
      color: WALNUT.headerDark,
    },
    sent_to_delivery: {
      title: "Out for Delivery",
      message: "Your order has been dispatched and is on its way to you." + (expectedStr ? ` Expected delivery: ${expectedStr}.` : ""),
      color: WALNUT.headerDark,
    },
    delivered: {
      title: "Order Delivered",
      message: "Your order has been delivered. Thank you for shopping with us!",
      color: WALNUT.headerDark,
    },
    cancelled: {
      title: "Order Cancelled",
      message: "Your order has been cancelled. If you have any questions, please contact us.",
      color: "#c01c28",
    },
  };

  const config = statusConfig[status] || {
    title: `Order ${status.replace(/_/g, " ")}`,
    message: note || `Your order status has been updated to: ${status}.`,
    color: WALNUT.headerDark,
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title} • ${orderNumber}</title>
</head>

<body style="margin:0; padding:0; background:#f3efe9; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;">
    <tr>
      <td align="center">

        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:620px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${WALNUT.headerGradient}; padding:26px; text-align:center;">
              <table cellpadding="0" cellspacing="0" align="center" style="width:140px; height:140px; border-radius:50%; background:#fff; margin:0 auto 12px;">
                <tr><td align="center" style="padding:14px;">
                  <img src="cid:kuppam-logo" alt="${APP_NAME}" width="112" height="112" style="display:block; border-radius:50%; object-fit:contain;" />
                </td></tr>
              </table>

              <h1 style="margin:0; color:${WALNUT.textOnHeader}; font-size:20px;">
                ${config.title}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px; color:#3d2914;">

              <p style="font-size:18px; margin:0 0 8px;">
                Hi <strong>${userName}</strong>,
              </p>

              <p style="margin:0 0 18px; line-height:1.6;">
                ${config.message}
              </p>

              <!-- Order Info -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#faf7f2; border:1px solid ${WALNUT.border}; border-radius:12px; margin:20px 0;">
                <tr>
                  <td style="padding:14px;">
                    <p style="margin:4px 0; font-size:13px; opacity:0.8;">Order Number</p>
                    <p style="margin:0; font-size:16px; font-weight:bold;">
                      ${orderNumber}
                    </p>
                  </td>
                  <td style="padding:14px; text-align:right;">
                    <p style="margin:4px 0; font-size:13px; opacity:0.8;">Updated On</p>
                    <p style="margin:0; font-weight:bold;">
                      ${dateStr}
                    </p>
                  </td>
                </tr>
              </table>

              ${itemsSection}

              <!-- Optional Note -->
              ${note ? `
              <div style="margin:18px 0; padding:14px; background:#f5f0e8; border-left:4px solid #8b5e34; border-radius:8px;">
                <p style="margin:0; font-style:italic;">
                  ${note}
                </p>
              </div>
              ` : ""}

              <p style="margin-top:24px; line-height:1.6;">
                If you have any questions, feel free to reply to this email — we’re always happy to help 😊
              </p>

              <p style="margin:24px 0 0;">
                Warm regards,<br>
                <strong>${APP_NAME} Team</strong>
              </p>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <p style="margin:16px 0 0; font-size:12px; color:#8a7a68;">
          © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
        </p>

      </td>
    </tr>
  </table>
</body>
</html>

`.trim();
}

function getPasswordResetOtpEmailHtml({ name, otp }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP - ${APP_NAME}</title>
</head>
<body style="margin:0; padding:0; background:#f3efe9; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:620px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:${WALNUT.headerGradient}; padding:28px; text-align:center;">
              <h1 style="margin:0; color:${WALNUT.textOnHeader}; font-size:22px;">
                Password Reset Code
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px; color:#3d2914;">
              <p style="font-size:18px; margin:0 0 8px;">Hi <strong>${name}</strong>,</p>
              <p style="margin:0 0 16px; line-height:1.6;">
                Use the one-time code below to reset your password. This code expires in <strong>10 minutes</strong>.
              </p>
              <div style="margin:24px 0; padding:20px; background:#faf7f2; border:1px solid ${WALNUT.border}; border-radius:12px; text-align:center;">
                <p style="margin:0 0 8px; font-size:13px; opacity:0.8;">Your OTP</p>
                <p style="margin:0; font-size:32px; font-weight:bold; letter-spacing:8px; color:#3d2914;">
                  ${otp}
                </p>
              </div>
              <p style="margin:0; font-size:14px; color:#6b5a47; line-height:1.5;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
              <p style="margin:24px 0 0;">
                Warm regards,<br>
                <strong>${APP_NAME} Team</strong>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0; font-size:12px; color:#8a7a68;">
          © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

module.exports = {
  getRegistrationEmailHtml,
  getOrderConfirmationEmailHtml,
  getOrderStatusEmailHtml,
  getPasswordResetOtpEmailHtml,
  formatCurrency,
  APP_NAME,
};
