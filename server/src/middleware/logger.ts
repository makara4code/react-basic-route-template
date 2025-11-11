/**
 * Pino Logger Middleware for Hono
 * Logs all HTTP requests with method, path, status code, and response time
 */

import { Context, Next } from "hono";
import { logRequest } from "../utils/logger.js";

/**
 * Logger middleware
 * Logs HTTP requests with timing information
 */
export const loggerMiddleware = async (c: Context, next: Next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  // Process the request
  await next();

  // Calculate duration
  const duration = Date.now() - start;
  const statusCode = c.res.status;

  // Log the request
  logRequest(method, path, statusCode, duration);
};
