import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/auth': 'http://localhost:3000',
      '/vehicles': 'http://localhost:3000',
      '/routes': 'http://localhost:3000',
      '/deliveries': 'http://localhost:3000',
      '/warehouses': 'http://localhost:3000',
      '/optimizations': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
      '/analytics': 'http://localhost:3000',
      '/osrm': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/osrm/, ''),
      },
    },
  },
})
