/**
 * Cookie Utilities
 * Helper functions for setting and parsing httpOnly cookies
 */

import { config } from "../config.js";
import type { Context } from "hono";

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  maxAge?: number;
  path?: string;
  domain?: string;
}

/**
 * Detect if request is over HTTPS
 */
function isHttpsRequest(c?: Context): boolean {
  if (!c) return config.isProduction;

  const protocol = c.req.header("x-forwarded-proto") || c.req.url.split(":")[0];
  return protocol === "https" || config.isProduction;
}

/**
 * Generate Set-Cookie header value
 * @param c - Optional Hono context to detect HTTPS
 */
export function generateSetCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
  c?: Context
): string {
  const {
    httpOnly = true,
    secure = isHttpsRequest(c),
    sameSite = "Lax",
    maxAge = config.cookieMaxAge,
    path = "/",
    domain,
  } = options;

  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `Max-Age=${Math.floor(maxAge / 1000)}`, // Convert ms to seconds
    `SameSite=${sameSite}`,
  ];

  if (httpOnly) parts.push("HttpOnly");
  if (secure) parts.push("Secure");
  if (domain) parts.push(`Domain=${domain}`);

  return parts.join("; ");
}

/**
 * Generate cookie deletion header
 */
export function generateDeleteCookie(name: string, path: string = "/"): string {
  return `${name}=; Path=${path}; Max-Age=0; HttpOnly; SameSite=Lax`;
}

/**
 * Parse cookies from Cookie header
 */
export function parseCookies(
  cookieHeader: string | null
): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name && rest.length > 0) {
      cookies[name] = decodeURIComponent(rest.join("="));
    }
    return cookies;
  }, {} as Record<string, string>);
}

/**
 * Get cookie value from request
 */
export function getCookie(
  cookieHeader: string | null,
  name: string
): string | undefined {
  const cookies = parseCookies(cookieHeader);
  return cookies[name];
}
