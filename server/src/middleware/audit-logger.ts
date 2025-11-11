/**
 * Audit Logging Middleware
 *
 * Provides comprehensive request/response audit trail for containerized environments.
 * Logs are written to stdout in structured JSON format for collection by external
 * log collectors (Fluentd, Fluent Bit, Promtail, etc.)
 *
 * Features:
 * - Request ID generation (UUID v4) for correlation across log entries
 * - Request start and completion logging (separate events)
 * - User context extraction from JWT tokens
 * - Sensitive data sanitization (passwords, tokens, headers)
 * - Asynchronous logging (non-blocking, < 5ms overhead)
 * - Configurable via environment variables
 *
 * Log Format:
 * - Development: Pretty-printed with colors
 * - Production: Structured JSON for log collectors
 *
 * Environment Variables:
 * - LOG_AUDIT_ENABLED: Enable/disable audit logging (default: true in production)
 * - LOG_REDACT_FIELDS: Additional fields to redact (comma-separated)
 * - LOG_LEVEL: Log level (debug, info, warn, error)
 */

import type { Context, Next } from "hono";
import { config } from "../config.js";
import { createRequestLogger } from "../utils/logger.js";
import { extractUserContext } from "../utils/user-context.js";
import {
  sanitizeHeaders,
  sanitizeBody,
  sanitizeQueryParams,
} from "../utils/sanitizer.js";

/**
 * Health check endpoints to skip audit logging (reduce noise)
 */
const SKIP_AUDIT_PATHS = ["/health", "/ping", "/healthz", "/readyz"];

/**
 * Generate unique request ID (UUID v4)
 *
 * Uses crypto.randomUUID() if available (Node.js 16.7+, not available in some edge environments)
 * Falls back to timestamp + random for edge compatibility
 */
function generateRequestId(): string {
  try {
    // Try crypto.randomUUID() first (Node.js 16.7+)
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to fallback
  }

  // Fallback for edge environments or older Node.js versions
  // Format: timestamp-random (not a true UUID but unique enough for logging)
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Parse query parameters from URL
 */
function parseQueryParams(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url, "http://localhost");
    const params: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    return {};
  }
}

/**
 * Audit Logger Middleware
 *
 * Logs request start and completion events with full audit trail.
 * Attaches request ID to Hono context for use in route handlers.
 *
 * Usage:
 * ```typescript
 * app.use('*', auditLoggerMiddleware);
 * ```
 *
 * Access request ID in route handlers:
 * ```typescript
 * const requestId = c.get('requestId');
 * ```
 */
export const auditLoggerMiddleware = async (c: Context, next: Next) => {
  // Skip audit logging if disabled
  if (!config.logAuditEnabled) {
    return next();
  }

  // Skip audit logging for health check endpoints
  const path = c.req.path;
  if (SKIP_AUDIT_PATHS.includes(path)) {
    return next();
  }

  // Generate unique request ID
  const requestId = generateRequestId();

  // Store request ID in context for use in route handlers
  c.set("requestId", requestId);

  // Extract user context from JWT token (for logging only, not authentication)
  const userContext = extractUserContext(c);

  // Create request-scoped logger with request ID and user context
  const requestLogger = createRequestLogger(requestId, userContext);

  // Store request logger in context for use in route handlers
  c.set("logger", requestLogger);

  // Capture request start time
  const startTime = Date.now();

  // Extract request details
  const method = c.req.method;
  const url = c.req.url;
  const query = parseQueryParams(url);

  // Get request headers
  const requestHeaders: Record<string, string> = {};
  c.req.raw.headers.forEach((value, key) => {
    requestHeaders[key] = value;
  });

  // Get request body (if applicable)
  let requestBody: any = null;
  if (method !== "GET" && method !== "HEAD") {
    try {
      // Clone the request to avoid consuming the body
      const clonedRequest = c.req.raw.clone();
      const contentType = clonedRequest.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        requestBody = await clonedRequest.json();
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await clonedRequest.text();
        requestBody = Object.fromEntries(new URLSearchParams(formData));
      } else if (contentType.includes("text/")) {
        requestBody = await clonedRequest.text();
      }
      // Skip binary data (multipart/form-data, application/octet-stream, etc.)
    } catch {
      // Body already consumed or invalid - skip
    }
  }

  // Log request start event
  requestLogger.info(
    {
      event: "request_start",
      request: {
        method,
        path,
        query: sanitizeQueryParams(query),
        headers: sanitizeHeaders(requestHeaders),
        body: sanitizeBody(requestBody),
      },
    },
    `Request started: ${method} ${path}`
  );

  // Process request
  await next();

  // Capture request end time
  const endTime = Date.now();
  const duration = endTime - startTime;

  // Extract response details
  const statusCode = c.res.status;

  // Get response headers
  const responseHeaders: Record<string, string> = {};
  c.res.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  // Get response body (only for error responses to avoid logging large payloads)
  let responseBody: any = null;
  if (statusCode >= 400) {
    try {
      // Clone the response to avoid consuming the body
      const clonedResponse = c.res.clone();
      const contentType = clonedResponse.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        responseBody = await clonedResponse.json();
      } else if (contentType.includes("text/")) {
        responseBody = await clonedResponse.text();
      }
      // Skip binary data
    } catch {
      // Body already consumed or invalid - skip
    }
  }

  // Determine log level based on status code
  const logLevel =
    statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

  // Log request completion event
  requestLogger[logLevel](
    {
      event: "request_complete",
      request: {
        method,
        path,
      },
      response: {
        statusCode,
        headers: sanitizeHeaders(responseHeaders),
        ...(responseBody !== null && { body: sanitizeBody(responseBody) }),
        duration,
      },
    },
    `Request completed: ${method} ${path} ${statusCode} - ${duration}ms`
  );
};
