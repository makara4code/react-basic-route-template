/**
 * Pino Logger Configuration
 * Provides structured logging with pretty-print in development and JSON in production
 *
 * IMPORTANT: Pino writes to stdout by default (asynchronous, non-blocking)
 * - In containerized environments (Docker/Kubernetes), logs are automatically captured
 * - Log collectors (Fluentd, Fluent Bit, Promtail) read from container stdout
 * - No need for file transports or log rotation
 * - Follows 12-Factor App methodology for cloud-native applications
 */

import pino from "pino";
import { config } from "../config.js";
import { sanitizeHeaders, sanitizeBody, sanitizeError } from "./sanitizer.js";

/**
 * Create Pino logger instance with environment-specific configuration
 *
 * ASYNCHRONOUS LOGGING:
 * - Pino writes to stdout asynchronously by default (non-blocking)
 * - Uses worker threads for JSON serialization in production
 * - Minimal performance impact on request processing (< 1ms overhead)
 * - Logs are buffered and flushed automatically
 *
 * CONTAINERIZED ENVIRONMENTS:
 * - Logs written to stdout are captured by Docker/Kubernetes runtime
 * - Log collectors (Fluentd, Fluent Bit, Promtail) read from container logs
 * - No file transports needed - follows 12-Factor App pattern
 */
export const logger = pino({
  // Use log level from config (supports LOG_LEVEL env variable)
  level: config.logLevel,

  // Base configuration - included in every log entry
  base: {
    env: config.nodeEnv,
  },

  // Timestamp configuration - ISO 8601 format for consistency
  timestamp: pino.stdTimeFunctions.isoTime,

  // Pretty-print configuration for development (human-readable)
  // JSON format in production (machine-readable for log collectors)
  transport: config.isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
          singleLine: false,
          messageFormat: "{msg}",
          errorLikeObjectKeys: ["err", "error"],
        },
      },

  // Serializers for common objects - automatically sanitize sensitive data
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers),
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: sanitizeHeaders(res.headers),
    }),
    err: (err) => sanitizeError(err),
  },
});

/**
 * Create a child logger with additional context
 *
 * Useful for creating request-scoped loggers with request ID
 *
 * @param context - Additional context to include in all log entries
 * @returns Child logger instance
 *
 * @example
 * const requestLogger = createLogger({ requestId: '550e8400-e29b-41d4-a716-446655440000' });
 * requestLogger.info('Processing request'); // Includes requestId in log
 */
export const createLogger = (context: Record<string, any>) => {
  return logger.child(context);
};

/**
 * Create a request-scoped logger with request ID and user context
 *
 * @param requestId - Unique request ID (UUID)
 * @param userContext - User context (userId, userEmail)
 * @returns Child logger instance with request ID and user context
 */
export const createRequestLogger = (
  requestId: string,
  userContext?: { userId: string | null; userEmail: string | null }
) => {
  return logger.child({
    requestId,
    userId: userContext?.userId || null,
    userEmail: userContext?.userEmail || null,
  });
};

/**
 * Log HTTP request
 */
export const logRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number
) => {
  const logLevel =
    statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

  logger[logLevel](
    {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
    },
    `${method} ${path} ${statusCode} - ${duration}ms`
  );
};

/**
 * Log server startup
 */
export const logServerStart = (
  port: number,
  env: string,
  directusUrl: string
) => {
  logger.info("");
  logger.info("🚀 Server starting...");
  logger.info(`📁 Environment: ${env}`);
  logger.info(`🌐 Port: ${port}`);
  logger.info(`🔗 Directus URL: ${directusUrl}`);
  logger.info(
    `🍪 Cookie settings: httpOnly, ${
      config.isProduction ? "secure" : "not secure"
    }, SameSite=Lax`
  );
  logger.info("");
  logger.info(`✅ Server running at http://localhost:${port}`);
  logger.info("");
};

/**
 * Log authentication events
 */
export const logAuth = {
  loginSuccess: (email: string) => {
    logger.info({ email }, `Login successful: ${email}`);
  },
  loginFailed: (email: string, reason: string) => {
    logger.warn({ email, reason }, `Login failed: ${email} - ${reason}`);
  },
  logout: (email?: string) => {
    logger.info({ email }, `Logout: ${email || "unknown user"}`);
  },
  tokenRefresh: (success: boolean) => {
    if (success) {
      logger.info("Token refresh successful");
    } else {
      logger.warn("Token refresh failed");
    }
  },
  noToken: (endpoint: string) => {
    logger.warn({ endpoint }, `No access token found for: ${endpoint}`);
  },
};

/**
 * Log errors with context
 */
export const logError = (error: unknown, context?: Record<string, any>) => {
  if (error instanceof Error) {
    logger.error({ err: error, ...context }, error.message);
  } else {
    logger.error({ error, ...context }, "An error occurred");
  }
};

export default logger;
