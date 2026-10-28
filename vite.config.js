import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "/taihu/",
  server: {
    proxy: {
      "/api/taihu": {
        target: "http://127.0.0.1:4240",
        rewrite: (path) => path.replace(/^\/api\/taihu/, ""),
      },
    },
  },
  preview: {
    proxy: {
      "/api/taihu": {
        target: "http://127.0.0.1:4240",
        rewrite: (path) => path.replace(/^\/api\/taihu/, ""),
      },
    },
  },
  build: { target: "es2020" },
});
