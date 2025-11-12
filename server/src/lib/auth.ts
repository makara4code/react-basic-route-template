/**
 * Better Auth Configuration
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import { openAPI } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // Automatically sign in after signup
  },
  // Important: This tells Better Auth where your frontend is
  trustedOrigins: ["http://localhost:5173", "http://localhost:3000"],
  secret:
    process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  // Session configuration - Balanced security and UX
  session: {
    expiresIn: 60 * 60 * 24, // 24 hours (86400 seconds)
    updateAge: 60 * 60, // 1 hour - session refreshes every hour of activity
    cookieCache: {
      enabled: true,
      maxAge: 300, // 5 minutes - cache session data in cookie
    },
  },

  plugins: [openAPI()],
});

export type Session = typeof auth.$Infer.Session;
