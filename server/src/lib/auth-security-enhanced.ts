/**
 * Enhanced Security Configuration for Better Auth
 * Addresses physical access and session hijacking concerns
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import { openAPI } from "better-auth/plugins";

export const authEnhanced = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: ["http://localhost:5173", "http://localhost:3000"],
  secret:
    process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  // ===================================================================
  // SESSION SECURITY CONFIGURATION
  // ===================================================================
  session: {
    // Primary session expires after 24 hours of inactivity
    expiresIn: 60 * 60 * 24, // 86400 seconds = 24 hours

    // Session automatically refreshes every hour the user is active
    // This extends the 24-hour window on each active request
    updateAge: 60 * 60, // 3600 seconds = 1 hour

    // Cookie cache: Store session data in cookie for 5 minutes
    // This satisfies security team's 5-minute requirement
    // - Reduces database queries (performance)
    // - Session still validated against DB every 5 minutes (security)
    cookieCache: {
      enabled: true,
      maxAge: 300, // 5 minutes
    },

    // ===================================================================
    // PHYSICAL ACCESS PROTECTION: Fresh Session Requirement
    // ===================================================================
    // For sensitive operations (change password, delete account, etc.),
    // require the session to be "fresh" (created within last 5 minutes)
    // This means even if attacker has physical access, they must
    // re-authenticate before performing sensitive operations
    freshAge: 60 * 5, // 300 seconds = 5 minutes

    // ===================================================================
    // IMPORTANT: How this protects against physical access:
    // ===================================================================
    // 1. Hacker sits at unlocked computer with active session
    // 2. Tries to change password or delete account
    // 3. Backend checks: Is session "fresh" (< 5 minutes old)?
    // 4. If no → Requires re-authentication with password
    // 5. Hacker doesn't know password → Attack fails
    // ===================================================================
  },

  plugins: [openAPI()],
});

export type Session = typeof authEnhanced.$Infer.Session;
