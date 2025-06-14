import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  // Set the base URL to match your GitHub repository name
  // For example, if your repo is "my-docs", use "/my-docs/"
  // For a user/org page (username.github.io), use "/"
  // The empty string "" means it will use relative paths which works in both cases
  base: "",

  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
