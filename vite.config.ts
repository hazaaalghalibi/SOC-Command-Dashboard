import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Windows: some browsers resolve "localhost" to IPv6 first; binding broadly avoids ERR_CONNECTION_REFUSED
  // when a dev server is running but only IPv4 was listening.
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    open: false,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
    open: false,
  },
});
