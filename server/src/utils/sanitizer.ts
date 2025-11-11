/**
 * Sensitive Data Sanitization Utilities
 *
 * Provides functions to sanitize sensitive data from headers, bodies, query parameters,
 * and errors before logging. This ensures compliance with security and privacy regulations
 * (GDPR, HIPAA, etc.) by preventing sensitive information from appearing in logs.
 *
 * All functions handle null, undefined, and non-object inputs gracefully.
 */

import { config } from "../config.js";

/**
 * Default list of sensitive field names to redact from request/response bodies
 * These are case-insensitive matches
 */
const DEFAULT_REDACT_FIELDS = [
  "password",
  "token",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "secret",
  "apikey",
  "api_key",
  "creditcard",
  "credit_card",
  "cardnumber",
  "card_number",
  "ssn",
  "cvv",
  "cvc",
  "pin",
  "authorization",
  "auth",
];

/**
 * Sensitive HTTP headers to redact (case-insensitive)
 */
const SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "x-api-key",
  "proxy-authorization",
  "x-auth-token",
  "x-access-token",
];

/**
 * Sensitive query parameter names to redact (case-insensitive)
 */
const SENSITIVE_QUERY_PARAMS = [
  "token",
  "apikey",
  "api_key",
  "secret",
  "password",
  "access_token",
  "refresh_token",
];

/**
 * Get the complete list of fields to redact (default + custom from env)
 */
function getRedactFields(): string[] {
  const customFields = config.logRedactFields
    .split(",")
    .map((f) => f.trim().toLowerCase())
    .filter((f) => f.length > 0);

  return [...DEFAULT_REDACT_FIELDS, ...customFields];
}

/**
 * Check if a field name should be redacted (case-insensitive)
 */
function shouldRedactField(fieldName: string, redactList: string[]): boolean {
  const lowerFieldName = fieldName.toLowerCase();
  return redactList.some((redactField) => lowerFieldName.includes(redactField));
}

/**
 * Sanitize HTTP headers by removing sensitive headers
 *
 * @param headers - Headers object (plain object or Headers instance)
 * @returns Sanitized headers object with sensitive headers removed
 *
 * @example
 * sanitizeHeaders({ 'content-type': 'application/json', 'authorization': 'Bearer token' })
 * // Returns: { 'content-type': 'application/json' }
 */
export function sanitizeHeaders(
  headers: Record<string, string> | Headers | null | undefined
): Record<string, string> {
  if (!headers) {
    return {};
  }

  const sanitized: Record<string, string> = {};

  // Handle Headers instance (Web API)
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!SENSITIVE_HEADERS.includes(lowerKey)) {
        sanitized[key] = value;
      }
    });
    return sanitized;
  }

  // Handle plain object
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (!SENSITIVE_HEADERS.includes(lowerKey)) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize request/response body by redacting sensitive fields
 *
 * Recursively traverses objects and arrays to redact sensitive fields.
 * Supports nested objects and arrays.
 *
 * @param body - Request/response body (object, array, or primitive)
 * @param customRedactFields - Additional fields to redact (optional)
 * @returns Sanitized body with sensitive fields replaced with "[REDACTED]"
 *
 * @example
 * sanitizeBody({ email: 'user@example.com', password: 'secret123' })
 * // Returns: { email: 'user@example.com', password: '[REDACTED]' }
 */
export function sanitizeBody(
  body: any,
  customRedactFields: string[] = []
): any {
  // Handle null, undefined, or primitive types
  if (body === null || body === undefined) {
    return body;
  }

  if (typeof body !== "object") {
    return body;
  }

  // Get complete redact list
  const redactFields = [...getRedactFields(), ...customRedactFields];

  // Handle arrays
  if (Array.isArray(body)) {
    return body.map((item) => sanitizeBody(item, customRedactFields));
  }

  // Handle objects
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(body)) {
    if (shouldRedactField(key, redactFields)) {
      sanitized[key] = "[REDACTED]";
    } else if (value !== null && typeof value === "object") {
      // Recursively sanitize nested objects/arrays
      sanitized[key] = sanitizeBody(value, customRedactFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize query parameters by redacting sensitive parameters
 *
 * @param query - Query parameters object
 * @returns Sanitized query parameters with sensitive values redacted
 *
 * @example
 * sanitizeQueryParams({ page: '1', token: 'abc123' })
 * // Returns: { page: '1', token: '[REDACTED]' }
 */
export function sanitizeQueryParams(
  query: Record<string, string | string[]> | null | undefined
): Record<string, string | string[]> {
  if (!query) {
    return {};
  }

  const sanitized: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(query)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_QUERY_PARAMS.includes(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize error object while preserving stack trace
 *
 * Removes sensitive data from error messages and properties while keeping
 * the stack trace for debugging purposes.
 *
 * @param error - Error object or any value
 * @returns Sanitized error object
 *
 * @example
 * sanitizeError(new Error('Login failed for password: secret123'))
 * // Returns: { type: 'Error', message: 'Login failed for password: [REDACTED]', stack: '...' }
 */
export function sanitizeError(error: any): any {
  if (!error) {
    return error;
  }

  // Handle Error instances
  if (error instanceof Error) {
    const sanitized: any = {
      type: error.constructor.name,
      message: sanitizeErrorMessage(error.message),
    };

    // Include stack trace (already sanitized by sanitizeErrorMessage)
    if (error.stack) {
      sanitized.stack = sanitizeErrorMessage(error.stack);
    }

    // Include any custom properties (sanitized)
    for (const [key, value] of Object.entries(error)) {
      if (key !== "message" && key !== "stack") {
        sanitized[key] = sanitizeBody(value);
      }
    }

    return sanitized;
  }

  // Handle plain objects or other types
  return sanitizeBody(error);
}

/**
 * Sanitize error message by redacting potential sensitive data
 *
 * Uses regex patterns to detect and redact common sensitive data patterns
 * in error messages (tokens, passwords, API keys, etc.)
 *
 * @param message - Error message string
 * @returns Sanitized error message
 */
function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== "string") {
    return message;
  }

  let sanitized = message;

  // Redact JWT tokens (pattern: eyJ...)
  sanitized = sanitized.replace(
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    "[REDACTED_JWT]"
  );

  // Redact Bearer tokens
  sanitized = sanitized.replace(
    /Bearer\s+[A-Za-z0-9_-]+/gi,
    "Bearer [REDACTED]"
  );

  // Redact API keys (pattern: common API key formats)
  sanitized = sanitized.replace(/[A-Za-z0-9]{32,}/g, (match) => {
    // Only redact if it looks like a key (all alphanumeric, long string)
    if (/^[A-Za-z0-9]+$/.test(match) && match.length >= 32) {
      return "[REDACTED_KEY]";
    }
    return match;
  });

  // Redact password values in messages (e.g., "password: secret123")
  sanitized = sanitized.replace(
    /(password|token|secret|apikey|api_key)[\s:=]+[^\s,}]+/gi,
    "$1: [REDACTED]"
  );

  return sanitized;
}

/**
 * Sanitize entire request object for logging
 *
 * Convenience function to sanitize all parts of a request object
 *
 * @param request - Request object with method, path, headers, query, body
 * @returns Sanitized request object
 */
export function sanitizeRequest(request: {
  method?: string;
  path?: string;
  headers?: any;
  query?: any;
  body?: any;
}): any {
  return {
    method: request.method,
    path: request.path,
    headers: sanitizeHeaders(request.headers),
    query: sanitizeQueryParams(request.query),
    body: sanitizeBody(request.body),
  };
}

/**
 * Sanitize entire response object for logging
 *
 * Convenience function to sanitize all parts of a response object
 *
 * @param response - Response object with statusCode, headers, body
 * @returns Sanitized response object
 */
export function sanitizeResponse(response: {
  statusCode?: number;
  headers?: any;
  body?: any;
}): any {
  return {
    statusCode: response.statusCode,
    headers: sanitizeHeaders(response.headers),
    body: sanitizeBody(response.body),
  };
}
