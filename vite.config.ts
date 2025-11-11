import path from "path";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Build configuration - output to server/public for production
  build: {
    outDir: path.resolve(__dirname, "./server/public"),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      // Proxy /api and /auth to our backend server
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        // Don't rewrite - let backend handle the path
      },
      "/auth": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
