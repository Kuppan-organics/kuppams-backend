require("dotenv").config();

const nodemailer = require("nodemailer");

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  return ["true", "1", "yes", "on"].includes(
    String(value).trim().toLowerCase(),
  );
};

const parsePositiveInt = (value, defaultValue) => {
  const parsed = parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
};

/**
 * Read SMTP settings from environment variables.
 */
const getEmailConfig = () => {
  const host = process.env.SMTP_HOST?.trim() || "";
  const port = parsePositiveInt(process.env.SMTP_PORT, 587);
  const user = process.env.SMTP_USER?.trim() || "";
  const pass = process.env.SMTP_PASS?.trim() || "";
  const fromName =
    process.env.SMTP_FROM_NAME?.trim() ||
    process.env.EMAIL_FROM_NAME?.trim() ||
    "Kuppam Organics";
  const fromEmail =
    process.env.SMTP_FROM_EMAIL?.trim() ||
    process.env.EMAIL_FROM_ADDRESS?.trim() ||
    user ||
    "noreply@kuppamorganics.com";
  const emailFrom =
    process.env.EMAIL_FROM?.trim() || `"${fromName}" <${fromEmail}>`;
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? parseBoolean(process.env.SMTP_SECURE)
      : port === 465;
  const requireTLS = parseBoolean(process.env.SMTP_REQUIRE_TLS, port === 587);
  const pool = parseBoolean(process.env.SMTP_POOL, false);
  const connectionTimeout = parsePositiveInt(
    process.env.SMTP_CONNECTION_TIMEOUT,
    10000,
  );
  const greetingTimeout = parsePositiveInt(
    process.env.SMTP_GREETING_TIMEOUT,
    10000,
  );
  const rejectUnauthorized = !parseBoolean(
    process.env.SMTP_IGNORE_TLS_ERRORS,
    false,
  );
  const isConfigured = Boolean(host && user && pass);

  return {
    host,
    port,
    user,
    pass,
    fromName,
    fromEmail,
    emailFrom,
    secure,
    requireTLS,
    pool,
    connectionTimeout,
    greetingTimeout,
    rejectUnauthorized,
    isConfigured,
  };
};

let cachedTransport = null;
let cachedConfig = null;

const createTransport = (config) => {
  if (!config.isConfigured) {
    console.warn(
      "[Email] SMTP not configured. Emails will be logged only. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env",
    );
    return {
      transport: nodemailer.createTransport({ jsonTransport: true }),
      mode: "json",
    };
  }

  console.log(
    `[Email] SMTP configured: ${config.host}:${config.port} (secure: ${config.secure})`,
  );

  return {
    transport: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      pool: config.pool,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      requireTLS: config.requireTLS,
      connectionTimeout: config.connectionTimeout,
      greetingTimeout: config.greetingTimeout,
      tls: {
        rejectUnauthorized: config.rejectUnauthorized,
        minVersion: "TLSv1.2",
      },
    }),
    mode: "smtp",
  };
};

const getEmailRuntime = () => {
  if (!cachedConfig) {
    cachedConfig = getEmailConfig();
  }

  if (!cachedTransport) {
    const { transport, mode } = createTransport(cachedConfig);
    cachedTransport = transport;
    cachedConfig.transportMode = mode;
  }

  return {
    transport: cachedTransport,
    emailConfig: cachedConfig,
  };
};

const verifySmtpConnection = async () => {
  const { transport, emailConfig } = getEmailRuntime();

  if (!emailConfig.isConfigured) {
    return {
      ok: false,
      configured: false,
      message: "SMTP is not configured",
    };
  }

  try {
    await transport.verify();
    return {
      ok: true,
      configured: true,
      message: `SMTP connection verified (${emailConfig.host}:${emailConfig.port})`,
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      message: error.message,
    };
  }
};

module.exports = {
  getEmailRuntime,
  getEmailConfig,
  verifySmtpConnection,
};
