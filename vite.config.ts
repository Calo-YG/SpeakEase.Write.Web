import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5184',
        changeOrigin: true,
      },
      '/ai': {
        target: 'http://localhost:5184',
        changeOrigin: true,
      },
    },
  },
})
