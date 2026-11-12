import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
import { sanctum } from './server/sanctum/plugin.ts'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sanctum(),
  ],
  server: {
    allowedHosts: ['evoview-library.said.bet']
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
