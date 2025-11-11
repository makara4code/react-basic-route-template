/**
 * Directus API Proxy Routes
 * Proxies authenticated requests to Directus with access token from cookie
 */

import { Hono } from "hono";
import { config } from "../config.js";
import { getCookie } from "../utils/cookies.js";
import { logAuth, logError } from "../utils/logger.js";

const proxy = new Hono();

/**
 * Proxy all /api/* requests to Directus
 * Automatically includes access token from httpOnly cookie
 */
proxy.all("/*", async (c) => {
  try {
    const cookieHeader = c.req.header("Cookie") || null;
    const accessToken = getCookie(cookieHeader, config.accessTokenCookieName);

    // Get the path after /api
    const path = c.req.path;
    const targetUrl = `${config.directusUrl}${path}`;

    // Prepare headers
    const headers = new Headers();

    // Copy relevant headers from original request
    const contentType = c.req.header("Content-Type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    // Add authorization if token exists
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    } else {
      // Log warning if no token found for authenticated endpoints
      if (!path.includes("/auth/login") && !path.includes("/auth/refresh")) {
        logAuth.noToken(path);
      }
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method: c.req.method,
      headers,
    };

    // Add body for non-GET requests
    if (c.req.method !== "GET" && c.req.method !== "HEAD") {
      try {
        const body = await c.req.text();
        if (body) {
          requestOptions.body = body;
        }
      } catch {
        // No body or already consumed
      }
    }

    // Make request to Directus
    const response = await fetch(targetUrl, requestOptions);

    // Get response body
    const responseBody = await response.text();

    // Create response with same status and headers
    const proxyResponse = new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy relevant response headers
    const headersToProxy = [
      "content-type",
      "cache-control",
      "etag",
      "last-modified",
    ];
    headersToProxy.forEach((headerName) => {
      const headerValue = response.headers.get(headerName);
      if (headerValue) {
        proxyResponse.headers.set(headerName, headerValue);
      }
    });

    return proxyResponse;
  } catch (error) {
    logError(error, {
      context: "proxy request",
      path: c.req.path,
      method: c.req.method,
    });
    return c.json({ error: "Failed to proxy request to Directus" }, 500);
  }
});

export default proxy;
