# Refactor Plan

## 1. Project Snapshot

- Generated on: 2026-03-23
- Scope: `/home/quincyzou/projects/siyuan-query-builder`
- Goal: reduce the remaining high-complexity orchestration points without changing user-visible plugin behavior
- Baseline repository state:
  - `git status --short`: clean
  - `npm run test:run`: blocked, local dependencies are not installed (`sh: 1: vitest: not found`)

## 2. Architecture and Module Analysis

| Module | Key Files | Current Responsibility | Main Pain Points | Test Coverage Status |
| --- | --- | --- | --- | --- |
| Entry and lifecycle | `src/index.ts`, `src/main.ts`, `src/App.vue` | Plugin bootstrap, dialog mount, runtime error fallback, inline renderer startup | Lifecycle is compact, but `src/main.ts` still mixes mount lifecycle, runtime error persistence, and DOM fallback rendering | Covered indirectly by UI tests; no focused tests for `main.ts` error handling |
| Query builder orchestration | `src/composables/query-builder-store.ts` | Composes controllers, exposes reactive state, UI-facing computed state and actions | File is still large at 504 lines and carries many UI-specific derived states; behavior is stable but future changes will continue to centralize here unless more boundaries are introduced | Covered mainly by `tests/query-builder-store-views.test.ts`; good happy-path coverage, weaker initialization and error-path coverage |
| Template and view persistence orchestration | `src/composables/query-builder-store/template-view-controller.ts` | Migration gating, template/view CRUD, import/export, draft application, confirmation prompts, user messages | Highest remaining orchestration hotspot: persistence rules, bundle normalization, state mutation, and UI side effects are all mixed into one 390-line module | Covered indirectly through store tests, but import/export normalization, default-view invariants, and negative branches are only partially exercised |
| Query domain catalog | `src/core/query/catalog.ts` | Template/view defaults, cloning, field options, default view hydration, preset definitions | 549-line “domain grab bag” with unrelated concerns in one file; low locality makes changes to presets or view hydration riskier than necessary | `tests/query-catalog.test.ts` only covers preset presence; clone/hydrate/apply invariants are under-tested |
| Query compiler and validation | `src/core/query/compiler.ts`, `src/core/query/validation.ts`, `src/core/query/types.ts` | SQL generation, aggregate behavior, filter validation, field semantics | Compiler is branch-heavy but cohesive; risk is in accidental SQL regressions if expression builders are touched without deeper scenario tests | Good direct coverage in `tests/query-compiler.test.ts` and `tests/query-validation.test.ts` |
| Inline rendering | `src/inline/service.ts`, `src/inline/render-controller.ts`, `src/core/embed.ts`, `src/core/storage/template-store.ts` | Parse inline payloads, resolve snapshots, execute queries, mount Vue widget, manage bridge lifecycle and rescan scheduling | `src/inline/service.ts` mixes mounting, scheduling, bridge state, and event wiring; current tests focus more on the scanner than the service lifecycle | `tests/inline-renderer.test.ts` and `tests/inline-embed.test.ts` cover parts of the flow, but service-level lifecycle/error behavior is thin |
| Storage adapters | `src/core/storage/query-template-store.ts`, `src/core/storage/view-config-store.ts`, `src/core/storage/template-store.ts`, `src/core/storage/migrations.ts` | Collection persistence, template/view joins, legacy migration gate | Behavior is mostly clear, but migration readiness is duplicated and template/view composition logic is split across several callers | Solid targeted coverage in storage tests; duplication is low-risk cleanup rather than urgent refactor work |

## 3. Prioritized Refactor Backlog

| ID | Priority | Module/Scenario | Files in Scope | Refactor Objective | Risk Level | Pre-Refactor Test Checklist | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RF-001 | P0 | Split template/view orchestration into smaller persistence and bundle services | `src/composables/query-builder-store/template-view-controller.ts`, `src/composables/query-builder-store.ts`, `tests/query-builder-store-views.test.ts` | Preserve the public store API while separating draft-application logic, template/view persistence, and bundle import/export normalization into smaller units with explicit invariants | High | - [x] Exported bundle contains hydrated view state for every saved view<br>- [x] Imported bundle regenerates template/view IDs and restores one default view<br>- [x] Deleting the active template resets draft state without leaving stale saved views<br>- [x] Setting a default saved view keeps default-view exclusivity and syncs the template snapshot | done |
| RF-002 | P1 | Decompose query catalog into focused domain modules | `src/core/query/catalog.ts`, `tests/query-catalog.test.ts`, `tests/query-builder-editor.test.ts`, `tests/query-builder-results.test.ts` | Split view-state hydration/apply logic, field option definitions, and preset catalog construction into smaller pure modules without changing existing exports | Medium | - [x] `hydrateViewConfig()` and `applyViewConfigToTemplate()` remain symmetrical for missing optional fields<br>- [x] `cloneSnapshot()` remains a deep clone for template and view branches<br>- [x] `createFieldOptions()` still reflects custom field mappings correctly<br>- [x] Existing presets keep IDs, titles, default view types, and core filters/sorts | done |
| RF-003 | P1 | Isolate inline renderer lifecycle from mount logic | `src/inline/service.ts`, `src/inline/render-controller.ts`, `tests/inline-renderer.test.ts`, `tests/inline-embed.test.ts` | Extract scheduling/bridge lifecycle from snapshot execution and Vue mounting so inline rendering errors and cleanup behavior can be tested directly | Medium | - [x] `start()` is idempotent and registers bridge/event handlers once<br>- [x] `destroy()` removes handlers, bridge state, and mounted disposers reliably<br>- [x] Missing templates render inline error state without breaking later scans<br>- [x] Bridge re-render disposes previous mount before replacing it | done |
| RF-004 | P2 | Deduplicate migration readiness and joined template-view loading | `src/core/storage/template-store.ts`, `src/composables/query-builder-store/template-view-controller.ts`, `src/core/storage/migrations.ts`, `tests/template-store.test.ts`, `tests/query-builder-store-views.test.ts` | Introduce a shared migration gate/helper so template-view callers stop re-implementing the same readiness pattern | Low | - [x] Legacy migration still runs once before template/view operations<br>- [x] `template-store` list/get/save/remove behavior remains unchanged<br>- [x] Store initialization still loads saved template summaries and views after migration | done |

Priority definition:
- `P0`: highest value and risk, execute first
- `P1`: medium value or risk, execute after `P0`
- `P2`: low-risk cleanup, execute last

Status definition:
- `pending`
- `in_progress`
- `done`
- `blocked`

## 4. Execution Log

| ID | Start Date | End Date | Test Commands | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| BASELINE | 2026-03-23 | 2026-03-23 | `npm run test:run` | blocked | Local dependencies are missing; `vitest` is not installed yet in this checkout |
| BASELINE-UPDATED | 2026-03-23 | 2026-03-23 | `npm install --legacy-peer-deps`; `npm run test:run` | pass | Dependencies installed locally; baseline is now 27 passing test files / 93 passing tests before refactor execution |
| RF-001 | 2026-03-23 | 2026-03-23 | `npm run test:run -- tests/query-builder-store-views.test.ts`; `npm run test:run` | pass | Split `template-view-controller` into bundle, draft-state, and storage helpers; added regression coverage for hydrated bundle export, active-template deletion, and default-view synchronization |
| RF-002 | 2026-03-23 | 2026-03-23 | `npm run test:run -- tests/query-catalog.test.ts tests/query-builder-editor.test.ts tests/query-builder-results.test.ts`; `npm run test:run` | pass | Split catalog concerns into constants, fields, presets, and view-state modules while keeping `@/core/query/catalog` as the public import surface; added invariant tests for hydration, deep cloning, and mapped field options |
| RF-003 | 2026-03-23 | 2026-03-23 | `npm run test:run -- tests/inline-service.test.ts tests/inline-renderer.test.ts tests/inline-embed.test.ts`; `npm run test:run` | pass | Switched inline service to the local SiYuan boundary and extracted bridge lifecycle plus scan scheduling helpers; added service-level tests for idempotent startup, bridge replacement, missing-template fallback, and destroy cleanup |
| RF-004 | 2026-03-23 | 2026-03-23 | `npm run test:run -- tests/template-store.test.ts tests/query-builder-store-views.test.ts`; `npm run test:run` | pass | Added shared migration gate and joined template/view snapshot loader helpers; verified legacy migration runs once per store instance and that migrated summaries still surface through the query-builder store |

## 5. Decision and Confirmation

- User approved items: `RF-001`, `RF-002`, `RF-003`, `RF-004`
- Deferred items:
- Blocked items and reasons:
  - None at the moment

## 6. Next Actions

1. Final full-suite verification is complete.
2. Summarize completed refactor items and residual risks for the user.
3. Defer any further cleanup unless a new approved refactor item is opened.
