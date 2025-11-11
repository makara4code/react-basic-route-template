/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing with credentials support
 */

import { Context, Next } from "hono";
import { config } from "../config.js";

export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header("Origin");

  // Check if origin is allowed
  const isAllowedOrigin = origin && config.allowedOrigins.includes(origin);

  if (isAllowedOrigin) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Access-Control-Allow-Credentials", "true");
  }

  // Handle preflight requests
  if (c.req.method === "OPTIONS") {
    c.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    c.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Cookie"
    );
    c.header("Access-Control-Max-Age", "86400"); // 24 hours
    return new Response(null, { status: 204 });
  }

  await next();
}
