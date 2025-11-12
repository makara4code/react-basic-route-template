/**
 * Hono Application
 * Main application setup - works on Node.js, Cloudflare Workers, and other platforms
 */

import { Hono } from "hono";
import { auditLoggerMiddleware } from "./middleware/audit-logger.js";
import { loggerMiddleware } from "./middleware/logger.js";
import { corsMiddleware } from "./middleware/cors.js";
import { securityMiddleware } from "./middleware/security.js";
import { auth } from "./lib/auth.js";
import proxy from "./routes/proxy.js";
import { logError } from "./utils/logger.js";

// Define context variables type
type Variables = {
  cspNonce?: string;
};

// Create Hono app with typed variables
const app = new Hono<{ Variables: Variables }>();

// Global middleware
// IMPORTANT: Middleware order matters!
// 1. Audit logger - generates request ID and logs request start (must be first)
// 2. Basic logger - logs HTTP requests (uses request ID from audit logger)
// 3. CORS - handles cross-origin requests
// 4. Security - adds security headers
app.use("*", auditLoggerMiddleware);
app.use("*", loggerMiddleware);
app.use("*", corsMiddleware);
app.use("*", securityMiddleware);

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime?.() || 0,
  });
});

// Mount Better Auth handler with proper CORS
app.on(["POST", "GET", "OPTIONS"], "/api/auth/*", async (c) => {
  const origin = c.req.header("Origin");
  const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];

  // Handle OPTIONS preflight requests
  if (c.req.method === "OPTIONS") {
    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
      "Access-Control-Max-Age": "600",
    };

    if (origin && allowedOrigins.includes(origin)) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
      corsHeaders["Access-Control-Allow-Credentials"] = "true";
    }

    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Handle actual requests
  const response = await auth.handler(c.req.raw);

  // Clone the response and add CORS headers
  const headers = new Headers(response.headers);
  if (origin && allowedOrigins.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Expose-Headers", "Set-Cookie");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
});

// Mount routes
app.route("/api", proxy);

// 404 handler for API routes
app.notFound((c) => {
  if (c.req.path.startsWith("/api") || c.req.path.startsWith("/auth")) {
    return c.json({ error: "Not found" }, 404);
  }
  // For non-API routes, this will be handled by static file serving
  return c.notFound();
});

// Error handler
app.onError((err, c) => {
  logError(err, { path: c.req.path, method: c.req.method });
  return c.json(
    {
      error: "Internal server error",
      message: err.message,
    },
    500
  );
});

export default app;
