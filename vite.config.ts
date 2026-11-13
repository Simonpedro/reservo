import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import adonisjs from '@adonisjs/vite/client'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    adonisjs({ entryPoints: ['inertia/app.tsx'], reload: ['resources/views/**/*.edge'] }),
  ],

  /**
   * Define aliases for importing modules from
   * your frontend code
   */
  resolve: {
    alias: {
      '~/': `${import.meta.dirname}/inertia/`,
      '@generated': `${import.meta.dirname}/.adonisjs/client/`,
    },
  },

  server: {
    /**
     * Tenant hosts reach the Vite dev middleware too (dev and tests).
     * localhost subdomains are allowed by default.
     */
    allowedHosts: ['.reservo.fit', '.fly.dev'],
    watch: {
      ignored: ['**/storage/**', '**/tmp/**'],
    },
  },
})
