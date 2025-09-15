import react from "@vitejs/plugin-react-swc"
import { resolve } from "path"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  root: ".", // Root directory
  publicDir: "public", // Static assets directory
  server: {
    open: false,
    port: 4173,
    allowedHosts: [
      "localhost",
      "clandestine-6513c595-d442-4d4d-a24f-c9fe7c27f4d1.fly.dev", // allows any *.fly.dev domain
      /.fly.dev$/, // allows any *.fly.dev domain
    ],
  },
  resolve: {
    alias: {
      src: resolve(__dirname, "./src"),
    },
    extensions: [".js", ".jsx", ".ts", ".tsx"], // Add extensions to resolve
  },
  build: {
    outDir: "dist",
  },
})