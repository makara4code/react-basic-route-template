/**
 * Node.js Server Entry Point
 * Serves static files and runs the Hono app on Node.js
 */

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import app from "./app.js";
import { config } from "./config.js";
import * as pathModule from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { logServerStart, logError } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathModule.dirname(__filename);

// Serve static files from React build (public folder)
// Frontend builds to server/public, which is ../public from dist/
const staticPath = pathModule.join(__dirname, "../public");

// Serve static files for all non-API routes
app.use(
  "*",
  serveStatic({
    root: staticPath,
  })
);

// Fallback to index.html for client-side routing
app.get("*", async (c) => {
  const requestPath = c.req.path;

  // Don't serve index.html for API routes
  if (
    requestPath.startsWith("/api") ||
    requestPath.startsWith("/auth") ||
    requestPath.startsWith("/health")
  ) {
    return c.notFound();
  }

  // Serve index.html for all other routes (SPA)
  try {
    const indexPath = pathModule.join(staticPath, "index.html");
    let html = readFileSync(indexPath, "utf-8");

    // Inject CSP nonce into script and style tags
    const nonce = c.get("cspNonce") as string | undefined;
    if (nonce) {
      // Add nonce to all script tags (both inline and external with type="module")
      html = html.replace(
        /<script(\s+[^>]*)?>/gi,
        (_match, attrs) => `<script${attrs || ""} nonce="${nonce}">`
      );
      // Add nonce to all inline style tags (not link tags)
      html = html.replace(
        /<style(\s+[^>]*)?>/gi,
        (_match, attrs) => `<style${attrs || ""} nonce="${nonce}">`
      );
    }

    return c.html(html);
  } catch (error) {
    logError(error, { path: requestPath, context: "serving index.html" });
    return c.text("Error loading application", 500);
  }
});

// Start server
const port = config.port;

serve({
  fetch: app.fetch,
  port,
});

// Log server startup with Pino
logServerStart(port, config.nodeEnv, config.directusUrl);
