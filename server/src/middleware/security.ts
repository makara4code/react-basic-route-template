/**
 * Security Middleware
 * Adds security headers to responses
 */

import { Context, Next } from "hono";
import { config } from "../config.js";
import { randomBytes } from "crypto";

/**
 * Generate a cryptographically secure nonce for CSP
 */
function generateNonce(): string {
  return randomBytes(16).toString("base64");
}

export async function securityMiddleware(c: Context, next: Next) {
  // Generate nonce before processing request
  const nonce = generateNonce();
  c.set("cspNonce", nonce);

  await next();

  // Detect if request is over HTTPS (e.g., ngrok, production)
  const protocol = c.req.header("x-forwarded-proto") || c.req.url.split(":")[0];
  const isHttps = protocol === "https";

  // Enable production security features if:
  // 1. NODE_ENV is production, OR
  // 2. Request is over HTTPS (ngrok, reverse proxy, etc.)
  const enableProductionSecurity = config.isProduction || isHttps;

  // Security headers (always enabled)
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy (production/HTTPS only)
  if (enableProductionSecurity) {
    // Strict CSP without unsafe-inline or unsafe-eval
    // Use default-src 'none' and explicitly allow each resource type for maximum security
    const cspDirectives = [
      // Default: Block everything by default
      "default-src 'none'",
      // Script: Use nonce + strict-dynamic for modern browsers, fallback to 'self' for older browsers
      `script-src 'nonce-${nonce}' 'strict-dynamic' 'self'`,
      // Style: Use nonce for inline styles, allow external stylesheets and Google Fonts
      `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
      // Fonts: Allow self-hosted and Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: Allow self, data URIs, and HTTPS images
      "img-src 'self' data: https:",
      // Connect: Allow API calls to self and Directus
      `connect-src 'self' ${config.directusUrl}`,
      // Media: Allow self-hosted audio/video
      "media-src 'self'",
      // Manifest: Allow web app manifest from self
      "manifest-src 'self'",
      // Worker: Allow web workers from self
      "worker-src 'self'",
      // Child: Allow self (for service workers, web workers)
      "child-src 'self'",
      // Block plugins (Flash, Java, etc.)
      "object-src 'none'",
      // Prevent base tag injection
      "base-uri 'self'",
      // Restrict form submissions
      "form-action 'self'",
      // Prevent clickjacking (same as X-Frame-Options)
      "frame-ancestors 'none'",
      // Block all frames/iframes
      "frame-src 'none'",
      // Upgrade HTTP to HTTPS
      "upgrade-insecure-requests",
    ];

    c.header("Content-Security-Policy", cspDirectives.join("; "));
  }

  // HSTS (only with HTTPS - required for HSTS to work)
  if (isHttps) {
    c.header(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
}
