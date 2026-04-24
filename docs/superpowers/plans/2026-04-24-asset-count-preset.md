# Asset Count Preset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `assetCount` computed field and a `内嵌资源最多文档(Top10)` daily preset that ranks documents by embedded resource count.

**Architecture:** Extend the existing query catalog and compiler with one new numeric computed field backed by the `assets` table, then expose it through field options and a preset. Keep the change inside the current `QueryTemplate -> buildQuery -> result presentation` flow so no custom SQL or post-processing path is introduced.

**Tech Stack:** TypeScript, Vue 3, Vitest, existing query catalog/compiler modules.

---

### Task 1: Add failing coverage for the new field and preset

**Files:**
- Modify: `tests/query-compiler.test.ts`
- Modify: `tests/query-catalog.test.ts`
- Test: `tests/query-compiler.test.ts`
- Test: `tests/query-catalog.test.ts`

- [ ] **Step 1: Write the failing compiler test**

```ts
it("builds document asset count fields from assets and supports numeric sorting", () => {
  const template: QueryTemplate = {
    id: "template-asset-count",
    version: 1,
    name: "Documents By Asset Count",
    scope: {
      type: "block_type",
      value: "d",
    },
    filters: [],
    sorts: [
      {
        field: "assetCount",
        direction: "desc",
      },
    ],
    fields: ["content", "assetCount", "updated", "path"],
    limit: 10,
    viewType: "table",
  }

  const compiled = buildQuery(template)

  expect(compiled.sql).toContain("FROM assets")
  expect(compiled.sql).toContain("assets.root_id = blocks.id")
  expect(compiled.sql).toContain("COUNT(DISTINCT assets.path)")
  expect(compiled.sql).toContain("AS assetCount")
  expect(compiled.sql).toContain("assetCount DESC")
})
```

- [ ] **Step 2: Write the failing catalog tests**

```ts
expect(options).toEqual(expect.arrayContaining([
  expect.objectContaining({
    value: "assetCount",
    label: "内嵌资源数量",
  }),
]))

const topAssets = presets.find(item => item.id === "preset-top-documents-by-assets")
expect(topAssets?.title).toBe("内嵌资源最多文档(Top10)")
expect(topAssets?.category).toBe("daily")
expect(topAssets?.snapshot.template.fields).toEqual(["content", "assetCount", "box", "updated", "path"])
expect(topAssets?.snapshot.template.sorts).toEqual([
  {
    field: "assetCount",
    direction: "desc",
  },
])
expect(topAssets?.snapshot.template.limit).toBe(10)
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test:run -- tests/query-compiler.test.ts tests/query-catalog.test.ts`

Expected: FAIL with unsupported `assetCount` field and missing preset/field option assertions.

### Task 2: Implement the minimal catalog and compiler support

**Files:**
- Modify: `src/core/query/catalog/constants.ts`
- Modify: `src/core/query/catalog/fields.ts`
- Modify: `src/core/query/compiler.ts`
- Modify: `src/core/query/catalog/presets.ts`

- [ ] **Step 1: Add the new field constant and numeric registration**

```ts
export const ASSET_COUNT_FIELD = "assetCount"
export const NUMERIC_FIELD_IDS = [
  TAG_COUNT_FIELD,
  BACKLINK_COUNT_FIELD,
  OUT_LINK_COUNT_FIELD,
  LINK_COUNT_FIELD,
  ASSET_COUNT_FIELD,
]
```

- [ ] **Step 2: Expose the field in catalog options**

```ts
{ value: ASSET_COUNT_FIELD, label: "内嵌资源数量" },
```

- [ ] **Step 3: Add the compiler expression**

```ts
if (field === ASSET_COUNT_FIELD) {
  return "(SELECT COUNT(DISTINCT assets.path) FROM assets WHERE assets.root_id = blocks.id)"
}
```

- [ ] **Step 4: Add the daily preset**

```ts
const topAssetDocumentsTemplate: QueryTemplate = {
  id: createId("preset"),
  version: 1,
  name: "内嵌资源最多文档(Top10)",
  scope: {
    type: "block_type",
    value: "d",
  },
  filters: [
    {
      id: createId("filter"),
      field: ASSET_COUNT_FIELD,
      operator: "gt",
      value: "0",
    },
  ],
  sorts: [
    {
      field: ASSET_COUNT_FIELD,
      direction: "desc",
    },
  ],
  fields: ["content", ASSET_COUNT_FIELD, "box", "updated", "path"],
  limit: 10,
  viewType: "table",
}
```

- [ ] **Step 5: Re-run targeted tests**

Run: `npm run test:run -- tests/query-compiler.test.ts tests/query-catalog.test.ts`

Expected: PASS

### Task 3: Verify presentation labels stay correct

**Files:**
- Modify: `tests/inline-widget.test.ts`
- Test: `tests/inline-widget.test.ts`

- [ ] **Step 1: Extend the table-header test**

```ts
fields: ["content", "updated", "assetCount", "tagCount", "attr:status", "box"]
expect(headers).toEqual(["标题 / 内容", "更新时间", "内嵌资源数量", "标签数量", "状态", "笔记本"])
```

- [ ] **Step 2: Run the focused UI presentation test**

Run: `npm run test:run -- tests/inline-widget.test.ts`

Expected: PASS

### Task 4: Run final verification for touched areas

**Files:**
- Test: `tests/query-compiler.test.ts`
- Test: `tests/query-catalog.test.ts`
- Test: `tests/inline-widget.test.ts`

- [ ] **Step 1: Run the touched test set together**

Run: `npm run test:run -- tests/query-compiler.test.ts tests/query-catalog.test.ts tests/inline-widget.test.ts`

Expected: PASS with 0 failures.
