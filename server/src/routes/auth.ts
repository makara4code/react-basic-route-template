/**
 * Authentication Routes
 * Handles login, logout, refresh, and session management with httpOnly cookies
 */

import { Hono } from "hono";
import { config } from "../config.js";
import {
  generateSetCookie,
  generateDeleteCookie,
  getCookie,
} from "../utils/cookies.js";
import { logAuth, logError } from "../utils/logger.js";

const auth = new Hono();

/**
 * POST /auth/login
 * Authenticates user with Directus and sets httpOnly cookies
 */
auth.post("/login", async (c) => {
  let email = "";
  try {
    const body = await c.req.json();
    email = body.email;
    const password = body.password;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // Call Directus login endpoint
    const response = await fetch(`${config.directusUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as any;
      const errorMessage =
        errorData.errors?.[0]?.message ||
        "Login failed. Please check your credentials.";
      logAuth.loginFailed(email, errorMessage);
      return c.json(
        {
          error: errorMessage,
        },
        response.status as any
      );
    }

    const data = (await response.json()) as any;
    const accessToken = data.data?.access_token;
    const refreshToken = data.data?.refresh_token;

    if (!accessToken) {
      return c.json({ error: "No access token received from server" }, 500);
    }

    // Fetch user data using the access token
    let user = null;
    try {
      const userResponse = await fetch(`${config.directusUrl}/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (userResponse.ok) {
        const userData = (await userResponse.json()) as any;
        user = userData.data;
      }
    } catch (error) {
      logError(error, { context: "fetching user data after login", email });
      // Continue without user data - not critical for login
    }

    // Set httpOnly cookies
    const cookieHeaders: string[] = [];

    // Access token cookie
    cookieHeaders.push(
      generateSetCookie(
        config.accessTokenCookieName,
        accessToken,
        {
          httpOnly: true,
          sameSite: "Lax",
          maxAge: config.accessTokenMaxAge,
        },
        c
      )
    );

    // Refresh token cookie (if provided)
    if (refreshToken) {
      cookieHeaders.push(
        generateSetCookie(
          config.refreshTokenCookieName,
          refreshToken,
          {
            httpOnly: true,
            sameSite: "Lax",
            maxAge: config.refreshTokenMaxAge,
          },
          c
        )
      );
    }

    // Log successful login
    logAuth.loginSuccess(email);

    // Return user data (NOT the tokens)
    return c.json(
      {
        success: true,
        user,
      },
      200,
      {
        "Set-Cookie": cookieHeaders,
      }
    );
  } catch (error) {
    logError(error, { context: "login", email });
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * POST /auth/logout
 * Clears authentication cookies
 */
auth.post("/logout", async (c) => {
  const cookieHeaders: string[] = [];

  // Clear all auth cookies
  cookieHeaders.push(generateDeleteCookie(config.accessTokenCookieName));
  cookieHeaders.push(generateDeleteCookie(config.refreshTokenCookieName));
  cookieHeaders.push(generateDeleteCookie(config.sessionCookieName));

  logAuth.logout();

  return c.json({ success: true, message: "Logged out successfully" }, 200, {
    "Set-Cookie": cookieHeaders,
  });
});

/**
 * POST /auth/refresh
 * Refreshes access token using refresh token from cookie
 */
auth.post("/refresh", async (c) => {
  try {
    const cookieHeader = c.req.header("Cookie") || null;
    const refreshToken = getCookie(cookieHeader, config.refreshTokenCookieName);

    if (!refreshToken) {
      logAuth.noToken("/auth/refresh");
      return c.json({ error: "No refresh token found" }, 401);
    }

    // Call Directus refresh endpoint
    const response = await fetch(`${config.directusUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      logAuth.tokenRefresh(false);
      return c.json({ error: "Failed to refresh token" }, 401);
    }

    const data = (await response.json()) as any;
    const newAccessToken = data.data?.access_token;
    const newRefreshToken = data.data?.refresh_token;

    if (!newAccessToken) {
      return c.json({ error: "No access token received" }, 500);
    }

    // Set new cookies
    const cookieHeaders: string[] = [];

    cookieHeaders.push(
      generateSetCookie(
        config.accessTokenCookieName,
        newAccessToken,
        {
          httpOnly: true,
          sameSite: "Lax",
          maxAge: config.accessTokenMaxAge,
        },
        c
      )
    );

    if (newRefreshToken) {
      cookieHeaders.push(
        generateSetCookie(
          config.refreshTokenCookieName,
          newRefreshToken,
          {
            httpOnly: true,
            sameSite: "Lax",
            maxAge: config.refreshTokenMaxAge,
          },
          c
        )
      );
    }

    logAuth.tokenRefresh(true);

    return c.json({ success: true }, 200, {
      "Set-Cookie": cookieHeaders,
    });
  } catch (error) {
    logError(error, { context: "token refresh" });
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * GET /auth/me
 * Returns current user info (requires authentication)
 */
auth.get("/me", async (c) => {
  try {
    const cookieHeader = c.req.header("Cookie") || null;
    const accessToken = getCookie(cookieHeader, config.accessTokenCookieName);

    if (!accessToken) {
      logAuth.noToken("/auth/me");
      return c.json({ error: "Not authenticated" }, 401);
    }

    // Call Directus /users/me endpoint
    const response = await fetch(`${config.directusUrl}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return c.json(
        { error: "Failed to fetch user data" },
        response.status as any
      );
    }

    const data = await response.json();
    return c.json(data);
  } catch (error) {
    logError(error, { context: "get user" });
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default auth;
