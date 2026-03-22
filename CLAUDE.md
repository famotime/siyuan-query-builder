# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install --legacy-peer-deps   # install deps
npm run dev                       # watch-mode build (deploys to SiYuan if VITE_SIYUAN_WORKSPACE_PATH is set)
npm run build                     # production build → dist/
npm run test:run                  # run full test suite once
npm run test                      # Vitest in watch mode
npm run release:patch             # bump patch version and package plugin.zip
```

## Architecture

This is a SiYuan Notes plugin (Vue 3 + TypeScript + Vite). The entry point is `src/index.ts`, which extends the SiYuan `Plugin` class. It registers a topbar icon and a keyboard shortcut (`⌘⇧Q`), both of which open a SiYuan `Dialog` that hosts the Vue app.

### Module layout

- `src/index.ts` — Plugin class, lifecycle hooks (`onload`/`onunload`), topbar and command registration
- `src/main.ts` — Vue app mount/unmount, Dialog management, error logging via `plugin.saveData`
- `src/composables/query-builder-store.ts` — The single reactive store (`createQueryBuilderStore`), provided to the component tree via Vue injection key. All query state, template CRUD, run/save actions, and embed logic live here.
- `src/core/query/types.ts` — All shared types: `QueryTemplate`, `QueryBuilderSnapshot`, `ResultSet`, etc.
- `src/core/query/compiler.ts` — Compiles a `QueryTemplate` to a `CompiledQuery` (SQL string). Fields prefixed `attr:` are resolved via SQLite subquery against the `attributes` table.
- `src/core/query/catalog.ts` — Factory functions (`createEmptyTemplate`, `createPresets`) and field option lists.
- `src/core/runtime/query-runtime.ts` — Executes a `CompiledQuery` via the kernel adapter.
- `src/core/runtime/kernel-adapter.ts` — Thin object wrapping `sql`, `setBlockAttrs`, `appendBlock` from `src/api.ts`.
- `src/core/storage/template-store.ts` — Persists `QueryBuilderSnapshot` objects using `plugin.loadData`/`plugin.saveData`.
- `src/core/embed.ts` — Encodes/decodes `InlineEmbedPayload` and generates the `//!js` embed block markdown that SiYuan evaluates.
- `src/inline/service.ts` — `createInlineBlockRenderer`: scans DOM for `data-sqb-inline` elements on `loaded-protyle-static/dynamic` events and mounts `InlineQueryWidget` Vue components into them.
- `src/components/query-builder/` — Main UI: `QueryBuilderSidebar.vue`, `QueryBuilderEditor.vue`, `QueryBuilderResults.vue`.
- `src/components/SiyuanTheme/` — Primitive wrapper components (`SyButton`, `SyInput`, `SySelect`, etc.) styled to match SiYuan's theme.
- `src/ui/` — Host root styles and shell layer helpers.
- `plugin-sample-vite-vue/` — Upstream SiYuan plugin sample for reference only; not part of the build.

### Key data flows

**Main workspace:** Plugin topbar click → `openPanel()` in `main.ts` → `Dialog` with `<div id="siyuan-query-builder-root">` → `createApp(App).mount(root)` → `App.vue` creates and provides `QueryBuilderStore`.

**Query execution:** `QueryBuilderStore.runQuery()` → `buildQuery(template)` (compiler) → `CompiledQuery.sql` → `kernelAdapter.sql()` → SiYuan kernel `/api/query/sql` → `ResultSet`.

**Inline embed blocks:** `insertEmbed()` in store → `createEmbedBlockMarkdown(payload)` → inserts a `//!js` embed block into the document. On protyle load, SiYuan evaluates the JS, which sets `data-sqb-inline` on a host div and calls `window.__siyuanQueryBuilderBridge.renderHost()`. The inline renderer in `service.ts` picks this up and mounts `InlineQueryWidget`.

**Template persistence:** All templates are stored as a JSON array under the key `query-builder.templates.v1` via `plugin.saveData`.

## Dev environment

Copy `.env.example` to `.env` and set `VITE_SIYUAN_WORKSPACE_PATH` to your SiYuan workspace root. `npm run dev` will then build directly into `<workspace>/data/plugins/siyuan-query-builder` for live testing inside SiYuan.

## Coding conventions

- 2-space indentation, single quotes, trailing commas in multiline structures (enforced by ESLint with `@antfu/eslint-config`).
- Import from `src/` using the `@/` alias.
- PascalCase for Vue SFCs, camelCase for composables and utilities.
- Tests live in `tests/`, mirror feature names (e.g. `tests/query-compiler.test.ts`), use Vitest + jsdom with shared setup from `tests/setup.ts`.
