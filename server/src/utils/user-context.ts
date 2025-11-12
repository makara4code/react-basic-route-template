/**
 * User Context Extraction Utilities
 *
 * Extracts user information from JWT access tokens for logging purposes.
 *
 * IMPORTANT: This is for LOGGING ONLY, not for authentication!
 * - Does NOT verify JWT signature
 * - Does NOT validate token expiration
 * - Only decodes the token payload to extract user info
 *
 * Authentication is handled by existing middleware in routes/auth.ts
 */

import type { Context } from "hono";
import { config } from "../config.js";
import { getCookie } from "./cookies.js";

/**
 * User context information extracted from JWT token
 */
export interface UserContext {
  userId: string | null;
  userEmail: string | null;
}

/**
 * Decode JWT token payload without verification
 *
 * This is a simple base64 decode of the JWT payload section.
 * Does NOT verify signature or validate claims.
 *
 * @param token - JWT token string
 * @returns Decoded payload object or null if invalid
 */
function decodeJwtPayload(token: string): any {
  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Base64 URL decode
    // Replace URL-safe characters and add padding if needed
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    // Decode base64 to string
    const jsonString = Buffer.from(paddedBase64, "base64").toString("utf-8");

    // Parse JSON
    return JSON.parse(jsonString);
  } catch {
    // Invalid token format or JSON - return null
    return null;
  }
}

/**
 * Extract user context from Hono request context
 *
 * Reads the access token from httpOnly cookie, decodes it (without verification),
 * and extracts user information for logging purposes.
 *
 * @param c - Hono context object
 * @returns User context with userId and userEmail (null if not available)
 *
 * @example
 * const userContext = extractUserContext(c);
 * // Returns: { userId: 'user-456', userEmail: 'user@example.com' }
 * // Or: { userId: null, userEmail: null } if not authenticated
 */
export function extractUserContext(c: Context): UserContext {
  try {
    // Get access token from cookie
    const cookieHeader = c.req.header("Cookie") || null;
    const accessToken = getCookie(cookieHeader, config.accessTokenCookieName);

    if (!accessToken) {
      return { userId: null, userEmail: null };
    }

    // Decode JWT payload (no verification - for logging only)
    const payload = decodeJwtPayload(accessToken);

    if (!payload) {
      return { userId: null, userEmail: null };
    }

    // Extract user information from payload
    // Directus JWT tokens typically have: { id, email, role, ... }
    // Standard JWT claims use 'sub' for user ID
    const userId = payload.id || payload.sub || null;
    const userEmail = payload.email || null;

    return {
      userId: userId ? String(userId) : null,
      userEmail: userEmail ? String(userEmail) : null,
    };
  } catch {
    // If anything goes wrong, return null values
    // Don't throw - this is for logging only, shouldn't break requests
    return { userId: null, userEmail: null };
  }
}

/**
 * Check if user is authenticated (has valid access token)
 *
 * This is a simple check for logging purposes only.
 * Does NOT verify token validity or expiration.
 *
 * @param c - Hono context object
 * @returns true if access token exists, false otherwise
 */
export function isAuthenticated(c: Context): boolean {
  const cookieHeader = c.req.header("Cookie") || null;
  const accessToken = getCookie(cookieHeader, config.accessTokenCookieName);
  return !!accessToken;
}
