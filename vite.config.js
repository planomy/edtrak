import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project URL: https://<user>.github.io/<repo>/
  base: process.env.GITHUB_PAGES === 'true' ? '/edtrak/' : '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react()],
  server: {
    // Avoid fighting another Vite/app on 5173; if 5180 is busy, Vite tries 5181, 5182, …
    port: 5180,
    strictPort: false,
  },
})
