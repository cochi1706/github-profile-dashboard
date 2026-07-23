/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const githubPagesBase = process.env.GITHUB_PAGES_BASE ?? '/github-profile-dashboard/'

export default defineConfig({
  base: githubPagesBase,
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
})
