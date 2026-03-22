# Repository Guidelines

## Project Structure & Module Organization
Core plugin code lives in `src/`. Use `src/core/` for query, runtime, storage, and embed logic; `src/components/` for Vue UI; `src/inline/` for inline rendering; `src/ui/` for host styling and shell layers; and `src/i18n/` for locale files. Tests live in `tests/` and mirror feature areas, for example `tests/query-compiler.test.ts`. Build output goes to `dist/`. Reference material lives in `docs/` and `developer_docs/`. `plugin-sample-vite-vue/` is an upstream sample, not the main implementation target.

## Build, Test, and Development Commands
Install dependencies with `npm install --legacy-peer-deps`.

- `npm run dev`: Vite build in watch mode for local plugin development.
- `npm run build`: production build into `dist/`.
- `npm run test`: run Vitest in watch mode.
- `npm run test:run`: run the full test suite once.
- `npm run release` or `npm run release:patch|minor|major`: package the plugin with `release.js`.

## Coding Style & Naming Conventions
This repo uses TypeScript and Vue 3 with 2-space indentation, UTF-8, and final newlines from `.editorconfig`. ESLint is configured in `eslint.config.mjs` with the Antfu preset: prefer single quotes, trailing commas in multiline objects, and one attribute per line in Vue templates. Use PascalCase for Vue components such as `QueryBuilderSidebar.vue`, camelCase for composables and utilities, and kebab-free test filenames ending in `.test.ts`. Prefer the `@/` alias for imports from `src/`.

## Testing Guidelines
Vitest runs in `jsdom` with shared setup from `tests/setup.ts`. Add tests beside the feature area they cover and keep filenames descriptive, such as `embed-target.test.ts` or `template-store.test.ts`. No coverage gate is defined in the repo, so contributors should add or update tests for every behavior change and run `npm run test:run` before opening a PR.

## Commit & Pull Request Guidelines
Recent history uses short imperative commit subjects, for example `Fix embed block rendering...` and `Implement query builder plugin...`. Follow that pattern: start with a verb, keep the subject focused, and avoid mixed-purpose commits. PRs should include a clear summary, linked issue or task when available, test results, and screenshots or GIFs for UI changes involving the builder, inline widgets, or rendered views.
