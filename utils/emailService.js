const path = require("path");
const fs = require("fs");
const { transport } = require("../config/email");
const {
  getRegistrationEmailHtml,
  getOrderConfirmationEmailHtml,
  getOrderStatusEmailHtml,
  APP_NAME,
} = require("./emailTemplates");

const FROM = process.env.EMAIL_FROM || `"${APP_NAME}" <noreply@kuppamorganics.com>`;

const LOGO_PATH = path.join(__dirname, "assests", "kuppam_organics-logo.png");
const LOGO_CID = "kuppam-logo";

function getLogoAttachment() {
  try {
    if (fs.existsSync(LOGO_PATH)) {
      return [
        {
          filename: "kuppam-organics-logo.png",
          content: fs.readFileSync(LOGO_PATH),
          cid: LOGO_CID,
        },
      ];
    }
  } catch (_) {
    // ignore
  }
  return [];
}

/**
 * Send email. Never throws; logs errors so API responses are not affected.
 */
async function sendMail({ to, subject, html, attachments = [] }) {
  try {
    const allAttachments = [...getLogoAttachment(), ...attachments];
    const info = await transport.sendMail({
      from: FROM,
      to,
      subject,
      html,
      attachments: allAttachments.length ? allAttachments : undefined,
    });
    if (process.env.NODE_ENV !== "production" && info.messageId) {
      console.log("[Email] Sent:", subject, "to", to, "messageId:", info.messageId);
    }
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error("[Email] Failed to send:", subject, "to", to, err.message);
    return { sent: false, error: err.message };
  }
}

/**
 * Send welcome email when a user registers.
 */
async function sendRegistrationEmail({ name, email }) {
  const html = getRegistrationEmailHtml({ name, email });
  return sendMail({
    to: email,
    subject: `Welcome to ${APP_NAME}`,
    html,
  });
}

/**
 * Send order confirmation with order details and pricing (after place order or buy-now).
 */
async function sendOrderConfirmationEmail({ user, order }) {
  const userName = user?.name || "Customer";
  const userEmail = user?.email;
  if (!userEmail) return { sent: false, error: "No user email" };

  const orderNumber = order?.orderNumber || order?._id?.toString() || "—";
  const html = getOrderConfirmationEmailHtml({
    userName,
    orderNumber,
    order: {
      items: order?.items || [],
      totalAmount: order?.totalAmount,
      couponCode: order?.couponCode,
      couponDiscount: order?.couponDiscount,
      discountAmount: order?.discountAmount,
      finalAmount: order?.finalAmount,
      shippingAddress: order?.shippingAddress,
    },
    orderDate: order?.createdAt,
  });

  return sendMail({
    to: userEmail,
    subject: `Order Confirmation ${orderNumber} - ${APP_NAME}`,
    html,
  });
}

/** Statuses for which we send a dedicated status-update email to the customer. */
const STATUS_EMAIL_SCENARIOS = ["accepted", "sent_to_delivery", "delivered"];

/**
 * Send order status update email for: accepted, sent_to_delivery, delivered.
 * Call this when admin updates order status; only sends for the 3 scenarios above.
 */
async function sendOrderStatusEmail({ user, order, newStatus, note }) {
  if (!STATUS_EMAIL_SCENARIOS.includes(newStatus)) {
    return { sent: false, skipped: true, reason: "No email for this status" };
  }

  const userName = user?.name || "Customer";
  const userEmail = user?.email;
  if (!userEmail) return { sent: false, error: "No user email" };

  const orderNumber = order?.orderNumber || order?._id?.toString() || "—";
  const lastTimeline = order?.statusTimeline?.length
    ? order.statusTimeline[order.statusTimeline.length - 1]
    : null;
  const orderDate = lastTimeline?.timestamp || order?.updatedAt || new Date();

  const html = getOrderStatusEmailHtml({
    userName,
    orderNumber,
    status: newStatus,
    orderDate,
    expectedDeliveryDate: order?.expectedDeliveryDate || null,
    note: note || lastTimeline?.note,
  });

  const subjectTitles = {
    accepted: "Order Accepted",
    sent_to_delivery: "Out for Delivery",
    delivered: "Order Delivered",
  };
  const subject = `${subjectTitles[newStatus] || newStatus} ${orderNumber} - ${APP_NAME}`;

  return sendMail({
    to: userEmail,
    subject,
    html,
  });
}

module.exports = {
  sendMail,
  sendRegistrationEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  STATUS_EMAIL_SCENARIOS,
};
