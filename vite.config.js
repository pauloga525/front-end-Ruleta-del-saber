import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite acceso desde la red local
    port: 5173,
    strictPort: false, // Si el puerto está ocupado, usa otro
  },
  build: {
    // Optimizar el bundle
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    // Aumentar el límite de advertencia de chunk
    chunkSizeWarningLimit: 1000,
    // Minificar con terser para mejor optimización
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.logs en producción
        drop_debugger: true,
      },
    },
  },
  // Optimizar dependencias
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
