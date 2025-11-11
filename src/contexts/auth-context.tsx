import { useState, useEffect, type ReactNode } from "react";
import {
  AuthContext,
  type User,
  type AuthContextType,
} from "./auth-context-definition";
import axios, { resetRefreshTimer, clearRefreshTimer } from "@/lib/axios";

// Re-export types for convenience
export type { User, AuthContextType };

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount by calling /auth/me
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Call /auth/me endpoint which reads token from httpOnly cookie
        const response = await axios.get("/auth/me");

        if (response.status === 200) {
          const data = response.data;
          const userData = data.data || data;
          setUser(userData);
          setToken("authenticated"); // We don't have access to actual token (it's httpOnly)

          // Reset refresh timer after successful auth check
          resetRefreshTimer();
        }
      } catch (error) {
        console.error("Failed to check authentication:", error);
        setUser(null);
        setToken(null);
        clearRefreshTimer();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Call our backend /auth/login which sets httpOnly cookies
      const response = await axios.post("/auth/login", {
        email,
        password,
      });

      if (response.status !== 200) {
        throw new Error(
          response.data.error || "Login failed. Please check your credentials."
        );
      }

      const data = response.data;
      const userData = data.user;

      if (!userData) {
        throw new Error("No user data received from server");
      }

      // Set user data in state
      // Token is stored in httpOnly cookie (not accessible to JavaScript)
      setUser(userData);
      setToken("authenticated"); // Placeholder since we can't access the actual token

      // Reset refresh timer after successful login
      resetRefreshTimer();

      console.log("✅ Login successful, refresh timer started");
    } catch (error) {
      console.error("Login error:", error);
      clearRefreshTimer();
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend /auth/logout to clear httpOnly cookies
      await axios.post("/auth/logout");

      // Clear state
      setToken(null);
      setUser(null);

      // Clear refresh timer after logout
      clearRefreshTimer();

      console.log("✅ Logout successful, refresh timer cleared");
    } catch (error) {
      console.error("Logout error:", error);
      // Clear state even if request fails
      setToken(null);
      setUser(null);
      clearRefreshTimer();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
