/**
 * Authentication Routes
 * Better Auth integration with Hono
 */

import { Hono } from "hono";
import { auth } from "../lib/auth.js";

const authRoutes = new Hono();

// Better Auth handles all these routes automatically:
// POST /auth/sign-in/email
// POST /auth/sign-up/email
// GET /auth/get-session
// POST /auth/sign-out
// And many more...

// Mount all Better Auth routes
authRoutes.on(["POST", "GET"], "/*", (c) => {
  return auth.handler(c.req.raw);
});

export default authRoutes;
