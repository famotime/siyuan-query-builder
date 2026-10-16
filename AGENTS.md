# Repository Guidelines

## Project Structure & Module Organization
Core plugin code lives in `src/`. Keep query, runtime, storage, embed, and result-view logic in `src/core/`. Place builder-facing state orchestration in `src/composables/`, especially `src/composables/query-builder-store/` for controller splits. Put Vue UI in `src/components/`, with query builder screens under `src/components/query-builder/` and shared host-themed controls under `src/components/SiyuanTheme/`. Use `src/inline/` for inline widget rendering, `src/ui/` for host styling and shell layers, `src/external/` plus `src/api.ts` for SiYuan API boundaries, and `src/i18n/` for locale files. Tests live in `tests/` and mirror feature areas. Build output goes to `dist/`. Reference material lives in `docs/` and `developer_docs/`. Static plugin assets live in `asset/`. `plugin-sample-vite-vue/` is an upstream sample, not the main implementation target.

## Build, Test, and Development Commands
Install dependencies with `npm install --legacy-peer-deps`.

- `npm run dev`: Vite build in watch mode for local plugin development.
- `npm run build`: production build into `dist/`.
- `npm run test`: run Vitest in watch mode.
- `npm run test:run`: run the full test suite once.
- `npm run release`: package the plugin with the default release flow.
- `npm run release:manual`: package with manual version control.
- `npm run release:patch|minor|major`: package and bump the version with `release.js`.

## Coding Style & Naming Conventions
This repo uses TypeScript and Vue 3 with 2-space indentation, UTF-8, and final newlines from `.editorconfig`. ESLint is configured in `eslint.config.mjs` with the Antfu preset: prefer single quotes, trailing commas in multiline objects, and one attribute per line in Vue templates. Use PascalCase for Vue components such as `QueryBuilderSidebar.vue`, camelCase for composables, controllers, and utilities, and descriptive hyphenated test filenames ending in `.test.ts`. Prefer the `@/` alias for imports from `src/`. Keep new modules narrowly scoped: builder UI orchestration belongs in composables/controllers, while pure query, storage, runtime, and presentation logic should stay in `src/core/`.

## Testing Guidelines
Vitest runs in `jsdom` with shared setup from `tests/setup.ts`. Add or update tests for every behavior change and keep filenames descriptive, such as `embed-target.test.ts`, `query-builder-results.test.ts`, or `view-config-store.test.ts`. Mirror the source boundary you changed: query compiler and validation work should update the relevant core tests, while builder interactions should update the corresponding component or store tests. No coverage gate is defined in the repo, so run `npm run test:run` before opening a PR.

## Commit & Pull Request Guidelines
Recent history uses short imperative commit subjects such as `Fix workspace tab host styles`, `Add workspace open mode setting`, and `Refactor query builder store and UI modules`. Follow that pattern: start with a verb, keep the subject focused, and avoid mixed-purpose commits. PRs should include a clear summary, linked issue or task when available, test results, and screenshots or GIFs for UI changes involving the builder, inline widgets, rendered views, or workspace shell behavior.

## Reference Projects

重要：在涉及解析思源笔记文档块结构和内容、确认API时，务必查看developer_docs目录下开发者文档 和 siyuan-note 项目源码确认，不要凭猜测开发和测试。

路径按开发机器取用其一（两套路径指向同一批参考工程，不同机器布局不同）：

- siyuan-note（思源笔记源码项目）
  - Windows 开发机：`D:\MyCodingProjects\siyuan-note`
  - Linux 开发机：`/home/quincyzou/projects/siyuan-note`
- `developer_docs/`：思源笔记插件开发者文档
  - 仓库根目录，并已列入 `.gitignore`（仅本机参考，不入库、不推送）。
- 核对内核行为时以 siyuan-note 的 Go 源码为准（`kernel/server/serve.go`、`kernel/model/assets.go`），`app/src` 为前端实现参考；developer_docs 未覆盖的细节不要凭猜测推断。
