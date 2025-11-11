# 🔧 Refresh Token Implementation Recommendations

This document provides detailed recommendations for implementing automatic token refresh functionality in your Hono + React application.

---

## 📋 Table of Contents

1. [Option 1: Frontend Automatic Refresh (Recommended)](#option-1-frontend-automatic-refresh-recommended)
2. [Option 2: Backend Automatic Refresh (Alternative)](#option-2-backend-automatic-refresh-alternative)
3. [Option 3: Proactive Token Refresh (Advanced)](#option-3-proactive-token-refresh-advanced)
4. [Error Handling Best Practices](#error-handling-best-practices)
5. [Testing Recommendations](#testing-recommendations)

---

## Option 1: Frontend Automatic Refresh (Recommended)

### **Overview:**

Implement a fetch wrapper that automatically refreshes tokens on 401 errors and retries failed requests.

### **Advantages:**
- ✅ Works with any backend API
- ✅ Centralized error handling
- ✅ Easy to test and debug
- ✅ No backend changes required

### **Implementation:**

#### **Step 1: Create Fetch Wrapper (`src/lib/api.ts`)**

```typescript
/**
 * API Fetch Wrapper with Automatic Token Refresh
 * Automatically refreshes tokens on 401 errors and retries failed requests
 */

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Refresh access token using refresh token
 */
async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch("/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      console.log("✅ Token refreshed successfully");
      return true;
    } else {
      console.error("❌ Token refresh failed");
      return false;
    }
  } catch (error) {
    console.error("❌ Token refresh error:", error);
    return false;
  }
}

/**
 * Fetch wrapper with automatic token refresh
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Ensure credentials are included
  const fetchOptions: RequestInit = {
    ...options,
    credentials: "include",
  };

  // Make the initial request
  let response = await fetch(url, fetchOptions);

  // If 401 Unauthorized, try to refresh token
  if (response.status === 401) {
    // If already refreshing, wait for it to complete
    if (isRefreshing && refreshPromise) {
      const refreshed = await refreshPromise;
      if (refreshed) {
        // Retry the original request
        response = await fetch(url, fetchOptions);
      }
      return response;
    }

    // Start refreshing
    isRefreshing = true;
    refreshPromise = refreshToken();

    try {
      const refreshed = await refreshPromise;

      if (refreshed) {
        // Retry the original request with new token
        response = await fetch(url, fetchOptions);
      } else {
        // Refresh failed - redirect to login
        window.location.href = "/login";
      }
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  }

  return response;
}

/**
 * Typed API fetch with JSON response
 */
export async function apiFetchJSON<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await apiFetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.error || error.message || "API request failed");
  }

  return response.json();
}
```

---

#### **Step 2: Update Auth Context (`src/contexts/auth-context.tsx`)**

```typescript
import { apiFetch, apiFetchJSON } from "@/lib/api";

// ... existing code ...

// Check authentication status on mount
useEffect(() => {
  const checkAuth = async () => {
    try {
      // Use apiFetch instead of fetch
      const data = await apiFetchJSON("/auth/me");
      const userData = data.data || data;
      setUser(userData);
      setToken("authenticated");
    } catch (error) {
      console.error("Failed to check authentication:", error);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  checkAuth();
}, []);

const login = async (email: string, password: string) => {
  try {
    // Use apiFetchJSON instead of fetch
    const data = await apiFetchJSON("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const userData = data.user;

    if (!userData) {
      throw new Error("No user data received from server");
    }

    setUser(userData);
    setToken("authenticated");
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

const logout = async () => {
  try {
    // Use apiFetch instead of fetch
    await apiFetch("/auth/logout", {
      method: "POST",
    });

    setToken(null);
    setUser(null);
  } catch (error) {
    console.error("Logout error:", error);
    setToken(null);
    setUser(null);
  }
};
```

---

#### **Step 3: Update All API Calls**

Replace all `fetch()` calls with `apiFetch()` or `apiFetchJSON()`:

```typescript
// Before:
const response = await fetch("/api/users/me", {
  credentials: "include",
});
const data = await response.json();

// After:
const data = await apiFetchJSON("/api/users/me");
```

---

## Option 2: Backend Automatic Refresh (Alternative)

### **Overview:**

Implement middleware in the backend that automatically refreshes tokens when Directus returns 401.

### **Advantages:**
- ✅ Transparent to frontend
- ✅ Centralized in backend
- ✅ Works for all API calls automatically

### **Disadvantages:**
- ⚠️ More complex backend logic
- ⚠️ Harder to debug
- ⚠️ May cause race conditions

### **Implementation:**

#### **Create Refresh Middleware (`server/src/middleware/auto-refresh.ts`)**

```typescript
import { Context, Next } from "hono";
import { config } from "../config.js";
import { getCookie, generateSetCookie } from "../utils/cookies.js";
import { logAuth, logError } from "../utils/logger.js";

/**
 * Automatic Token Refresh Middleware
 * Intercepts 401 responses from Directus and attempts to refresh the token
 */
export async function autoRefreshMiddleware(c: Context, next: Next) {
  // Only apply to /api routes (Directus proxy)
  if (!c.req.path.startsWith("/api")) {
    return next();
  }

  // Store original response
  await next();

  // If response is 401, try to refresh token
  if (c.res.status === 401) {
    const cookieHeader = c.req.header("Cookie") || null;
    const refreshToken = getCookie(cookieHeader, config.refreshTokenCookieName);

    if (!refreshToken) {
      // No refresh token - can't auto-refresh
      return;
    }

    try {
      // Call Directus refresh endpoint
      const refreshResponse = await fetch(`${config.directusUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!refreshResponse.ok) {
        logAuth.tokenRefresh(false);
        return; // Refresh failed - return original 401
      }

      const refreshData = (await refreshResponse.json()) as any;
      const newAccessToken = refreshData.data?.access_token;
      const newRefreshToken = refreshData.data?.refresh_token;

      if (!newAccessToken) {
        return; // No new token - return original 401
      }

      // Set new cookies
      const cookieHeaders: string[] = [];

      cookieHeaders.push(
        generateSetCookie(config.accessTokenCookieName, newAccessToken, {
          httpOnly: true,
          secure: config.isProduction,
          sameSite: "Lax",
          maxAge: config.cookieMaxAge,
        })
      );

      if (newRefreshToken) {
        cookieHeaders.push(
          generateSetCookie(config.refreshTokenCookieName, newRefreshToken, {
            httpOnly: true,
            secure: config.isProduction,
            sameSite: "Lax",
            maxAge: config.cookieMaxAge * 2,
          })
        );
      }

      logAuth.tokenRefresh(true);

      // Retry the original request with new token
      const retryHeaders = new Headers();
      const contentType = c.req.header("Content-Type");
      if (contentType) {
        retryHeaders.set("Content-Type", contentType);
      }
      retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);

      const retryOptions: RequestInit = {
        method: c.req.method,
        headers: retryHeaders,
      };

      if (c.req.method !== "GET" && c.req.method !== "HEAD") {
        const body = await c.req.text();
        if (body) {
          retryOptions.body = body;
        }
      }

      const targetUrl = `${config.directusUrl}${c.req.path.replace("/api", "")}`;
      const retryResponse = await fetch(targetUrl, retryOptions);

      // Return retry response with new cookies
      const retryData = await retryResponse.json();
      return c.json(retryData, retryResponse.status as any, {
        "Set-Cookie": cookieHeaders,
      });
    } catch (error) {
      logError(error, { context: "auto token refresh" });
      return; // Return original 401
    }
  }
}
```

**⚠️ Note:** This approach is more complex and may have issues with request body consumption. Option 1 (frontend) is recommended.

---

## Option 3: Proactive Token Refresh (Advanced)

### **Overview:**

Refresh tokens BEFORE they expire, rather than waiting for 401 errors.

### **Advantages:**
- ✅ No 401 errors for users
- ✅ Seamless user experience
- ✅ Predictable refresh timing

### **Disadvantages:**
- ⚠️ Requires token expiration tracking
- ⚠️ More complex implementation
- ⚠️ May refresh unnecessarily

### **Implementation:**

```typescript
/**
 * Proactive Token Refresh
 * Refreshes tokens before they expire
 */

// Token expiration times (from Directus defaults)
const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes
const REFRESH_BUFFER = 2 * 60 * 1000; // Refresh 2 minutes before expiry

let lastRefreshTime = Date.now();
let refreshInterval: NodeJS.Timeout | null = null;

/**
 * Start proactive token refresh
 */
export function startProactiveRefresh() {
  // Clear existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Refresh every 13 minutes (15 min expiry - 2 min buffer)
  const refreshIntervalMs = ACCESS_TOKEN_EXPIRY - REFRESH_BUFFER;

  refreshInterval = setInterval(async () => {
    try {
      const response = await fetch("/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        console.log("✅ Proactive token refresh successful");
        lastRefreshTime = Date.now();
      } else {
        console.error("❌ Proactive token refresh failed");
        // Stop refreshing and redirect to login
        stopProactiveRefresh();
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("❌ Proactive token refresh error:", error);
    }
  }, refreshIntervalMs);

  console.log(`✅ Proactive token refresh started (every ${refreshIntervalMs / 1000 / 60} minutes)`);
}

/**
 * Stop proactive token refresh
 */
export function stopProactiveRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log("✅ Proactive token refresh stopped");
  }
}

// Usage in auth context:
// - Call startProactiveRefresh() after successful login
// - Call stopProactiveRefresh() after logout
```

---

## Error Handling Best Practices

### **1. Graceful Logout on Refresh Failure**

```typescript
async function handleRefreshFailure() {
  // Clear user state
  setUser(null);
  setToken(null);

  // Show notification
  toast.error("Your session has expired. Please log in again.");

  // Redirect to login with return URL
  const returnUrl = encodeURIComponent(window.location.pathname);
  window.location.href = `/login?redirect=${returnUrl}`;
}
```

### **2. Show Session Expiration Warning**

```typescript
// Show warning 5 minutes before token expires
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes

setTimeout(() => {
  toast.warning("Your session will expire soon. Please save your work.");
}, ACCESS_TOKEN_EXPIRY - WARNING_TIME);
```

### **3. Handle Network Errors**

```typescript
try {
  const response = await apiFetch(url, options);
  // ...
} catch (error) {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    // Network error
    toast.error("Network error. Please check your connection.");
  } else {
    // Other error
    toast.error("An error occurred. Please try again.");
  }
}
```

---

## Testing Recommendations

### **Test 1: Automatic Refresh on 401**

```typescript
// 1. Login
// 2. Manually expire access token (delete cookie in DevTools)
// 3. Make API call
// Expected: Token refreshes automatically, API call succeeds
```

### **Test 2: Refresh Failure**

```typescript
// 1. Login
// 2. Manually expire both tokens (delete cookies in DevTools)
// 3. Make API call
// Expected: Redirect to login page
```

### **Test 3: Concurrent Requests**

```typescript
// 1. Login
// 2. Expire access token
// 3. Make multiple API calls simultaneously
// Expected: Only one refresh request, all API calls succeed
```

### **Test 4: Proactive Refresh**

```typescript
// 1. Login
// 2. Wait 13 minutes
// Expected: Token refreshes automatically in background
```

---

## 🎯 Recommended Approach

**For most applications, we recommend Option 1 (Frontend Automatic Refresh) because:**

1. ✅ **Simple to implement** - Just create a fetch wrapper
2. ✅ **Easy to test** - All logic in one place
3. ✅ **No backend changes** - Works with existing backend
4. ✅ **Transparent** - Works with all API calls automatically
5. ✅ **Debuggable** - Easy to add logging and error handling

**Optional Enhancement:** Add Option 3 (Proactive Refresh) for better UX.

---

## 📚 Next Steps

1. **Implement Option 1** - Create `src/lib/api.ts` with fetch wrapper
2. **Update Auth Context** - Use `apiFetch` instead of `fetch`
3. **Update All API Calls** - Replace `fetch` with `apiFetch` throughout app
4. **Test Thoroughly** - Test all scenarios (401, refresh failure, concurrent requests)
5. **Optional:** Add proactive refresh for seamless UX
6. **Optional:** Add session expiration warnings

---

**With automatic token refresh implemented, your users will have a seamless authentication experience with no unexpected logouts!** 🚀

