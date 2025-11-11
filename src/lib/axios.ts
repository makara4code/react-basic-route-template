/**
 * Axios Instance with Automatic Token Refresh
 *
 * Features:
 * - Automatically refreshes tokens when access token is close to expiring
 * - Handles 401 errors by refreshing and retrying failed requests
 * - Prevents multiple simultaneous refresh requests
 * - Includes credentials (httpOnly cookies) in all requests
 */

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// Configuration
const API_BASE_URL = ""; // Empty string means same origin
const ACCESS_TOKEN_EXPIRY = 5 * 60 * 1000; // 5 minutes (matches backend config)
const REFRESH_BUFFER = 1 * 60 * 1000; // Refresh 1 minute before expiry
const REFRESH_THRESHOLD = ACCESS_TOKEN_EXPIRY - REFRESH_BUFFER; // 4 minutes

// Track last refresh time to determine when to refresh
let lastRefreshTime = Date.now();
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Create axios instance with default configuration
 */
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: Include httpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Refresh access token using refresh token
 * Returns true if refresh was successful, false otherwise
 */
async function refreshToken(): Promise<boolean> {
  try {
    console.log("🔄 Refreshing access token...");

    const response = await axios.post(
      "/auth/refresh",
      {},
      {
        withCredentials: true, // Include cookies
      }
    );

    if (response.status === 200 && response.data.success) {
      console.log("✅ Token refreshed successfully");
      lastRefreshTime = Date.now(); // Update last refresh time
      return true;
    } else {
      console.error("❌ Token refresh failed:", response.data);
      return false;
    }
  } catch (error) {
    console.error("❌ Token refresh error:", error);
    return false;
  }
}

/**
 * Check if token should be refreshed based on time elapsed
 */
function shouldRefreshToken(): boolean {
  const timeSinceLastRefresh = Date.now() - lastRefreshTime;
  return timeSinceLastRefresh >= REFRESH_THRESHOLD;
}

/**
 * Request Interceptor
 * Automatically refreshes token if it's close to expiring
 */
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip refresh for auth endpoints
    if (
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/refresh") ||
      config.url?.includes("/auth/logout")
    ) {
      return config;
    }

    // Check if token should be refreshed (proactive refresh)
    if (shouldRefreshToken()) {
      console.log(
        "⏰ Access token close to expiring, refreshing proactively..."
      );

      // If already refreshing, wait for it to complete
      if (isRefreshing && refreshPromise) {
        await refreshPromise;
        return config;
      }

      // Start refreshing
      isRefreshing = true;
      refreshPromise = refreshToken();

      try {
        const refreshed = await refreshPromise;

        if (!refreshed) {
          console.error("❌ Proactive token refresh failed");
          // Don't block the request, let it proceed and handle 401 in response interceptor
        }
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles 401 errors by refreshing token and retrying the request
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // Successful response, return as-is
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip retry for auth endpoints
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/logout") ||
      originalRequest.url?.includes("/auth/me")
    ) {
      return Promise.reject(error);
    }

    console.log("🔒 Received 401 error, attempting to refresh token...");

    // Mark request as retried to prevent infinite loops
    originalRequest._retry = true;

    // If already refreshing, wait for it to complete
    if (isRefreshing && refreshPromise) {
      const refreshed = await refreshPromise;

      if (refreshed) {
        console.log("🔄 Retrying original request after refresh...");
        return axiosInstance(originalRequest);
      } else {
        console.error("❌ Token refresh failed, redirecting to login...");
        handleRefreshFailure();
        return Promise.reject(error);
      }
    }

    // Start refreshing
    isRefreshing = true;
    refreshPromise = refreshToken();

    try {
      const refreshed = await refreshPromise;

      if (refreshed) {
        console.log("🔄 Retrying original request after refresh...");
        return axiosInstance(originalRequest);
      } else {
        console.error("❌ Token refresh failed, redirecting to login...");
        handleRefreshFailure();
        return Promise.reject(error);
      }
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  }
);

/**
 * Handle refresh failure by redirecting to login
 */
function handleRefreshFailure() {
  // Clear last refresh time
  lastRefreshTime = 0;

  // Don't redirect if already on login page (prevents infinite loop)
  if (window.location.pathname === "/login") {
    console.log("⚠️ Already on login page, skipping redirect");
    return;
  }

  // Redirect to login with return URL
  const returnUrl = encodeURIComponent(window.location.pathname);
  window.location.href = `/login?redirect=${returnUrl}`;
}

/**
 * Reset refresh timer (call this after successful login)
 */
export function resetRefreshTimer() {
  lastRefreshTime = Date.now();
  console.log("✅ Refresh timer reset");
}

/**
 * Clear refresh timer (call this after logout)
 */
export function clearRefreshTimer() {
  lastRefreshTime = 0;
  isRefreshing = false;
  refreshPromise = null;
  console.log("✅ Refresh timer cleared");
}

/**
 * Get time until next refresh (for debugging)
 */
export function getTimeUntilRefresh(): number {
  const timeSinceLastRefresh = Date.now() - lastRefreshTime;
  const timeUntilRefresh = REFRESH_THRESHOLD - timeSinceLastRefresh;
  return Math.max(0, timeUntilRefresh);
}

/**
 * Get last refresh time (for debugging)
 */
export function getLastRefreshTime(): number {
  return lastRefreshTime;
}

/**
 * Get refresh threshold (for debugging)
 */
export function getRefreshThreshold(): number {
  return REFRESH_THRESHOLD;
}

/**
 * Get access token expiry time (for debugging)
 */
export function getAccessTokenExpiry(): number {
  return ACCESS_TOKEN_EXPIRY;
}

/**
 * Manually trigger token refresh (for debugging)
 */
export async function manualRefresh(): Promise<boolean> {
  console.log("🔧 Manual refresh triggered from debug panel");
  return await refreshToken();
}

/**
 * Export axios instance as default
 */
export default axiosInstance;
