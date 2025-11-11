/**
 * Hono Application
 * Main application setup - works on Node.js, Cloudflare Workers, and other platforms
 */

import { Hono } from "hono";
import { auditLoggerMiddleware } from "./middleware/audit-logger.js";
import { loggerMiddleware } from "./middleware/logger.js";
import { corsMiddleware } from "./middleware/cors.js";
import { securityMiddleware } from "./middleware/security.js";
import auth from "./routes/auth.js";
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

// Mount routes
app.route("/auth", auth);
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
