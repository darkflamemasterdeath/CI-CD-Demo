import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 后端地址：开发 / 预览时把 /api 转发给 Spring Boot，避免跨域
const API_TARGET = "http://localhost:8080";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": API_TARGET,
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/api": API_TARGET,
    },
  },
});
