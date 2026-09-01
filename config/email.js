const nodemailer = require("nodemailer");

/**
 * Create nodemailer transport. Uses SMTP from env or ethereal/test account when not configured.
 * Set in .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 */
const createTransport = () => {
  const host = process.env.SMTP_HOST?.trim();
  const port = parseInt(String(process.env.SMTP_PORT || "587").trim(), 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // No SMTP configured: use a no-op transport that logs (emails won't actually send)
  return nodemailer.createTransport({
    jsonTransport: true,
  });
};

const transport = createTransport();

module.exports = { transport, createTransport };
