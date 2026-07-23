# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Commands

Run `npm install` after cloning. Use `npm run dev` for the Vite development server, `npm run build` for the TypeScript check plus production build, `npm run preview` to serve the built output locally, and `npm run lint` for ESLint. Run all tests once with `npm run test:run`; run `npm test` to keep Vitest in watch mode. `npm run data:fetch` requires `GH_USERNAME` and `GH_TOKEN` already exported in the environment; `npm run data:fetch:local` loads the same variables from `.env`.

For a local refresh, copy `.env.example` to `.env`, fill in both values, and run `npm run data:fetch:local`. The production workflow does not use `.env`; GitHub Actions injects variables through secrets.

## Architecture

This is a React 18 + TypeScript single-page dashboard built with Vite. `src/main.tsx` mounts `App`, and `src/App.tsx` owns the page composition and in-memory UI state for repository search, language filtering, and sorting. The UI is intentionally snapshot-driven: it imports `src/data/github-stats.json` and never calls GitHub from the browser.

`src/types.ts` defines the contract between the data pipeline and the UI. `src/lib/stats.ts` contains formatting, language distribution, repository sorting, and repository-language helpers; `src/lib/stats.test.ts` tests those pure helpers. Charts are rendered with Recharts and the visual system is in `src/App.css`.

`scripts/fetch-github-stats.mjs` is the data pipeline. It reads `GH_USERNAME` and `GH_TOKEN`, calls the public user/repository endpoints and each repository's languages endpoint, then writes a normalized snapshot containing profile metadata, totals, language byte ratios, and repository rows. It uses bounded concurrency for language requests and never writes credentials to disk.

`.github/workflows/update-github-stats.yml` runs manually, daily, and on changes to `main` other than the generated snapshot. It supplies `secrets.GH_USERNAME` and `secrets.GH_PAT` (the latter is mapped to the `GH_TOKEN` environment variable), allows `contents: write`, and commits an updated `src/data/github-stats.json`. The generated snapshot is public display data; secrets must remain workflow/environment inputs and must not be imported by frontend code. Secret names must not begin with `GITHUB_`.

`README.md` documents the setup, required repository secrets, and the intended data flow. `.env.example` is only a template and `.gitignore` excludes real environment files.
