/**
 * Better Auth Client Configuration for React
 * Uses window.location.origin to work with Vite proxy
 */

import { createAuthClient } from "better-auth/react";

// Use current origin to work with Vite proxy in dev and production
const baseURL = typeof window !== "undefined"
  ? `${window.location.origin}/api/auth`
  : "http://localhost:3000/api/auth";

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
  },
});

export const { useSession, signIn, signOut, signUp } = authClient;
