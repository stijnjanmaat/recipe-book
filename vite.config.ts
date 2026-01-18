import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// TanStack Start configuration
// Reference: https://tanstack.com/start/latest/docs/framework/react/build-from-scratch
export default defineConfig({
  plugins: [
    tsConfigPaths(), // Handles path aliases from tsconfig.json
    tanstackStart(), // TanStack Start plugin - must come before viteReact
    viteReact(), // React plugin - must come after tanstackStart
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
})
