/**
 * Authentication Service using Axios
 * Works with Better Auth's cookie-based JWT authentication
 *
 * Security Notes:
 * - Better Auth stores tokens in httpOnly cookies automatically
 * - Cookies are sent automatically by the browser (axios does this with withCredentials)
 * - You don't need to manually handle token storage or headers
 * - This is MORE secure than localStorage/sessionStorage approach
 */

import axios, { AxiosError } from "axios";

// Create axios instance with base configuration
const authApi = axios.create({
  baseURL: window.location.origin,
  withCredentials: true, // CRITICAL: Send cookies with every request
  headers: {
    "Content-Type": "application/json",
  },
});

// Types
export interface SignUpData {
  email: string;
  password: string;
  name: string;
  image?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
  user: User;
}

export interface AuthResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    status?: number;
  };
}

/**
 * Better Auth API Endpoints
 * These are the REST endpoints exposed by Better Auth
 */
export const authService = {
  /**
   * Sign Up - Create new account
   * POST /api/auth/sign-up/email
   */
  signUp: async (data: SignUpData): Promise<AuthResponse<Session>> => {
    try {
      const response = await authApi.post("/api/auth/sign-up/email", data);
      return { data: response.data };
    } catch (error) {
      return { error: handleAuthError(error) };
    }
  },

  /**
   * Sign In - Login with email and password
   * POST /api/auth/sign-in/email
   */
  signIn: async (data: SignInData): Promise<AuthResponse<Session>> => {
    try {
      const response = await authApi.post("/api/auth/sign-in/email", data);
      return { data: response.data };
    } catch (error) {
      return { error: handleAuthError(error) };
    }
  },

  /**
   * Sign Out - Logout and clear session
   * POST /api/auth/sign-out
   */
  signOut: async (): Promise<AuthResponse<void>> => {
    try {
      await authApi.post("/api/auth/sign-out");
      return { data: undefined };
    } catch (error) {
      return { error: handleAuthError(error) };
    }
  },

  /**
   * Get Current Session
   * GET /api/auth/get-session
   */
  getSession: async (): Promise<AuthResponse<Session>> => {
    try {
      const response = await authApi.get("/api/auth/get-session");
      return { data: response.data };
    } catch (error) {
      return { error: handleAuthError(error) };
    }
  },

  /**
   * Refresh Session (Better Auth handles this automatically via cookies)
   * You typically don't need to call this manually
   */
  refreshSession: async (): Promise<AuthResponse<Session>> => {
    try {
      const response = await authApi.post("/api/auth/refresh");
      return { data: response.data };
    } catch (error) {
      return { error: handleAuthError(error) };
    }
  },
};

/**
 * Error handler for authentication errors
 */
function handleAuthError(error: unknown): { message: string; status?: number } {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    return {
      message: axiosError.response?.data?.message || axiosError.message || "An error occurred",
      status: axiosError.response?.status,
    };
  }
  return {
    message: error instanceof Error ? error.message : "An unexpected error occurred",
  };
}

/**
 * Setup axios interceptors for automatic token refresh
 * Better Auth handles refresh automatically via cookies, but you can
 * add retry logic here if needed
 */
authApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and we haven't already retried, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the session
        await authService.refreshSession();

        // Retry the original request
        return authApi(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default authService;
