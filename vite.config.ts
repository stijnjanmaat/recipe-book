import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { nitro } from 'nitro/vite';

// TanStack Start configuration
// Reference: https://tanstack.com/start/latest/docs/framework/react/build-from-scratch
export default defineConfig({
  plugins: [
    devtools(),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    nitro(),
    tailwindcss(),
    tanstackStart(), // TanStack Start plugin - must come before viteReact
    viteReact(), // React plugin - must come after tanstackStart
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
})
