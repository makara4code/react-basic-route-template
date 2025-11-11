/**
 * Server Configuration
 * Loads environment variables and provides typed configuration
 */

// Load environment variables in Node.js environment
if (typeof process !== "undefined" && process.env) {
  try {
    const dotenv = await import("dotenv");
    dotenv.config();
  } catch {
    // dotenv not available in edge environments
  }
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // Directus
  directusUrl:
    process.env.DIRECTUS_URL ||
    "https://directus-production-7511.up.railway.app",

  // Security
  cookieSecret: process.env.COOKIE_SECRET || "dev-secret-change-in-production",
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000"
  ).split(","),

  // Cookies
  sessionCookieName: process.env.SESSION_COOKIE_NAME || "auth_session",
  accessTokenCookieName: process.env.ACCESS_TOKEN_COOKIE_NAME || "access_token",
  refreshTokenCookieName:
    process.env.REFRESH_TOKEN_COOKIE_NAME || "refresh_token",

  // Token expiration times (in milliseconds)
  accessTokenMaxAge: parseInt(
    process.env.ACCESS_TOKEN_MAX_AGE || "300000", // 5 minutes
    10
  ),
  refreshTokenMaxAge: parseInt(
    process.env.REFRESH_TOKEN_MAX_AGE || "900000", // 15 minutes
    10
  ),

  // Legacy: cookieMaxAge (deprecated - use accessTokenMaxAge instead)
  // Kept for backward compatibility
  cookieMaxAge: parseInt(
    process.env.COOKIE_MAX_AGE || process.env.ACCESS_TOKEN_MAX_AGE || "300000",
    10
  ),

  // Logging
  logLevel:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  logAuditEnabled:
    process.env.LOG_AUDIT_ENABLED === "true" ||
    process.env.NODE_ENV === "production",
  logRedactFields: process.env.LOG_REDACT_FIELDS || "", // Comma-separated list of additional fields to redact

  // Computed
  get isProduction() {
    return this.nodeEnv === "production";
  },

  get isDevelopment() {
    return this.nodeEnv === "development";
  },
} as const;
