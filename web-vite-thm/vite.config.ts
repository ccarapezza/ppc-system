import { AliasOptions, defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": "/src",
      "@components": "/src/components",
      "@page": "/src/page",
      "@api": "/src/api",
    } as AliasOptions
  },
  plugins: [preact()],
})
