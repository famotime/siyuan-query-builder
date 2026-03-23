# Refactor Plan

## 1. Project Snapshot

- Generated on: 2026-03-24
- Scope: `/home/quincyzou/projects/siyuan-query-builder`
- Goal: reduce the remaining high-coupling UI and store orchestration points without changing user-visible plugin behavior
- Baseline repository state:
  - `git status --short`: clean
  - `npm run test:run`: pass
  - Baseline test count: 29 files, 135 tests passing

## 2. Architecture and Module Analysis

| Module | Key Files | Current Responsibility | Main Pain Points | Test Coverage Status |
| --- | --- | --- | --- | --- |
| Entry and lifecycle | `src/index.ts`, `src/main.ts`, `src/App.vue` | Plugin bootstrap, dialog mount/unmount, Vue error fallback, inline renderer startup | Lifecycle is understandable, but `src/main.ts` still mixes mount lifecycle, debug-log persistence, and DOM fallback rendering in one file | Covered indirectly by component tests; no focused tests for mount/error persistence paths |
| Query builder store orchestration | `src/composables/query-builder-store.ts`, `src/composables/query-builder-store/*` | Composes controllers, owns draft state, exposes UI-facing computed values and actions, coordinates notebooks/history/example document generation | `createQueryBuilderStore()` remains the main coordination hotspot at 600+ lines; domain derivation, draft mutations, initialization, and UI-only helpers still live together behind one public facade | Strong regression coverage in `tests/query-builder-store-views.test.ts`; weaker coverage around initialization failures, metrics side effects, and example-document error branches |
| Result rendering surface | `src/components/query-builder/QueryBuilderResults.vue`, `src/components/query-builder/ResultsSavedViewsPanel.vue` | Saved-view switching, SQL preview, table/board/list/cards rendering, quick edits, drag guidance | One large SFC mixes four result surfaces plus SQL-preview behavior and saved-view orchestration; large template makes behavior-preserving edits harder | Good interaction coverage in `tests/query-builder-results.test.ts` and `tests/query-builder-results-advanced-mode.test.ts`; per-view rendering details are only partially isolated |
| Editor composition | `src/components/query-builder/QueryBuilderEditor.vue`, `src/components/query-builder/EditorFieldPicker.vue`, `src/components/query-builder/EditorViewSettingsSection.vue` | Scope editing, field mappings, filters, aggregation, sort/output-field controls, filter drag-drop | `QueryBuilderEditor.vue` still owns section-collapse state, filter operator normalization, drag-drop geometry, and multiple form areas; the file is large and sensitive to small UI regressions | Good interactive coverage in `tests/query-builder-editor.test.ts`; drag/drop edge cases and watcher-driven normalization are not deeply covered |
| Sidebar/template workflows | `src/components/query-builder/QueryBuilderSidebar.vue` | Preset grouping, saved-template list, import/export triggers, recent-history restore, hero shell | Component mixes browser file APIs, date formatting, category expansion state, and store actions; medium coupling with DOM APIs | Good user-path coverage in `tests/query-builder-sidebar.test.ts`; import/export failure states and formatting helpers are thinly tested |
| Shared result/view models | `src/composables/query-builder-store/shared.ts`, `src/inline/InlineQueryWidget.vue`, `src/inline/view-models.ts`, `src/core/view/board.ts` | Field labels, result display formatting, cards/list/board summaries, inline rendering surface | Result presentation logic is split across the store facade, shared helpers, and inline widget; display rules are reusable but not consistently organized around a single presentation layer | Focused helper coverage exists in `tests/result-display.test.ts`, `tests/inline-view-model.test.ts`, and `tests/inline-widget.test.ts`; parity between panel and inline surfaces is mostly implicit |
| Query domain, runtime, and storage | `src/core/query/*`, `src/core/runtime/*`, `src/core/storage/*` | Query compilation/validation, runtime execution, persistence/migrations | These modules are relatively cohesive after earlier splits; current issues are lower-value than store/UI refactors | Strong targeted coverage across compiler, validation, runtime, storage, migrations, and embed tests |

## 3. Prioritized Refactor Backlog

| ID | Priority | Module/Scenario | Files in Scope | Refactor Objective | Risk Level | Pre-Refactor Test Checklist | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RF-101 | P0 | Split `createQueryBuilderStore()` into smaller store-facing modules | `src/composables/query-builder-store.ts`, `src/composables/query-builder-store/*.ts`, `tests/query-builder-store-views.test.ts`, `tests/query-builder-editor.test.ts`, `tests/query-builder-results.test.ts` | Keep the public store API stable while moving draft mutations, derived selectors, and initialization/session flows into focused modules with explicit boundaries | High | - [x] `initialize()` still loads notebooks, embed targets, history, template summaries, and saved views in the same order-sensitive way; - [x] `applySnapshot()` and `restoreQueryHistory()` still refresh saved views and preserve/reset result state correctly; - [x] aggregation, grouping, field toggles, and limit proxies keep the same invariants; - [x] existing consumer components can keep using the same store properties and methods | done |
| RF-102 | P0 | Decompose results rendering into focused view subcomponents | `src/components/query-builder/QueryBuilderResults.vue`, `src/components/query-builder/ResultsSavedViewsPanel.vue`, new result subcomponents under `src/components/query-builder/`, `tests/query-builder-results.test.ts`, `tests/query-builder-results-advanced-mode.test.ts` | Split table, board, list, cards, and SQL-preview rendering into smaller components without changing view switching, quick-edit behavior, or saved-view orchestration | High | - [x] switching result tabs still prefers matching saved views before falling back to `setViewType()`; - [x] SQL preview expand/copy behavior remains unchanged; - [x] board drag guidance and drag-writeback affordances render identically; - [x] empty state and quick-edit controls still appear only in the same cases as before | done |
| RF-103 | P1 | Extract editor sections and filter-row interaction logic | `src/components/query-builder/QueryBuilderEditor.vue`, `src/components/query-builder/EditorFieldPicker.vue`, `src/components/query-builder/EditorViewSettingsSection.vue`, new editor section helpers/components, `tests/query-builder-editor.test.ts` | Reduce the size of `QueryBuilderEditor.vue` by moving section-specific UI and filter drag/normalization logic into isolated units while keeping the current form behavior | Medium | - [x] section collapse toggles preserve visibility state; - [x] aggregation controls keep the same default and enabled behavior; - [x] mapping hints and output-field picker behavior stay unchanged; - [x] filter relation toggles, operator normalization, and drag-drop reordering still behave the same | done |
| RF-104 | P1 | Consolidate result presentation helpers shared by panel and inline widget | `src/composables/query-builder-store/shared.ts`, `src/inline/InlineQueryWidget.vue`, `src/inline/view-models.ts`, `src/core/view/board.ts`, `tests/result-display.test.ts`, `tests/inline-widget.test.ts`, `tests/query-builder-results.test.ts` | Create a clearer presentation-layer boundary for field labels, display values, and list/cards/board view models so panel and inline surfaces rely on the same reusable rules | Medium | - [x] field labels for built-in, mapped, and custom attribute fields remain unchanged; - [x] notebook/path/date/aggregate display formatting remains unchanged; - [x] list/cards/board summaries use the same grouping and metadata rules after extraction; - [x] inline widget output remains visually and behaviorally equivalent for all view types | done |
| RF-105 | P2 | Isolate sidebar browser-API utilities and section models | `src/components/query-builder/QueryBuilderSidebar.vue`, new sidebar helper files/components, `tests/query-builder-sidebar.test.ts` | Move import/export file handling, date formatting, and preset grouping into helpers so the sidebar component is mostly presentational | Low | - [x] preset categories still group and collapse independently; - [x] template load/delete/export actions still dispatch the same store calls; - [x] history restore and template import still use the same payload format; - [x] hero icon and saved-template metadata remain unchanged | done |

Priority definition:
- `P0`: highest value and regression risk, execute first
- `P1`: medium value or medium risk, execute after `P0`
- `P2`: low-risk cleanup, execute last

Status definition:
- `pending`
- `in_progress`
- `done`
- `blocked`

## 4. Execution Log

| ID | Start Date | End Date | Test Commands | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| BASELINE | 2026-03-24 | 2026-03-24 | `npm run test:run` | pass | Baseline before any new refactor work: 29 test files and 135 tests passing |
| RF-101 | 2026-03-24 | 2026-03-24 | `npm run test:run -- tests/query-builder-store-views.test.ts`; `npm run test:run -- tests/query-builder-store-views.test.ts tests/query-builder-editor.test.ts tests/query-builder-results.test.ts`; `npm run test:run` | pass | Split store assembly into `selectors`, `draft-actions`, and `session-controller` helpers; added regression coverage for `initialize()` hydration and `applySnapshot()` result reset/target-view refresh |
| RF-102 | 2026-03-24 | 2026-03-24 | `npm run test:run -- tests/query-builder-results.test.ts tests/query-builder-results-advanced-mode.test.ts`; `npm run test:run` | pass | Extracted SQL preview and table/board/list/cards result surfaces into dedicated subcomponents while keeping existing data hooks and event behavior; added table quick-edit regression coverage |
| RF-103 | 2026-03-24 | 2026-03-24 | `npm run test:run -- tests/query-builder-editor.test.ts`; `npm run test:run` | pass | Extracted scope/mapping/filter sections and moved filter drag/normalization logic into `editor-state.ts`; added UI regression coverage for lower-half drag-drop placement |
| RF-104 | 2026-03-24 | 2026-03-24 | `npm run test:run -- tests/result-presentation.test.ts tests/result-display.test.ts tests/inline-widget.test.ts tests/query-builder-results.test.ts`; `npm run test:run` | pass | Added unified `createResultPresentation()` helper and routed store selectors plus inline widget through it; added dedicated cross-surface presentation regression coverage |
| RF-105 | 2026-03-24 | 2026-03-24 | `npm run test:run -- tests/query-builder-sidebar.test.ts`; `npm run test:run` | pass | Moved preset grouping, timestamp formatting, import payload reading, and template download logic into `sidebar-utils.ts`; added browser download-path regression coverage |

## 5. Decision and Confirmation

- User approved items: `RF-101`, `RF-102`, `RF-103`, `RF-104`, `RF-105`
- Deferred items:
- Blocked items and reasons:

## 6. Next Actions

1. All approved refactor items are complete.
2. Final verification passed with `npm run test:run` on 30 test files / 140 tests.
3. Summarize completed changes, added regression coverage, and residual risks for the user.
