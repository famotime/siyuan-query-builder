import { describe, expect, it } from "vitest"

import { buildQuery } from "@/core/query/compiler"
import type { QueryTemplate } from "@/core/query/types"

describe("buildQuery", () => {
  it("builds SQL for notebook scope, filters, grouping, sorting, and fields", () => {
    const template: QueryTemplate = {
      id: "template-1",
      version: 1,
      name: "This Week Tasks",
      scope: {
        type: "notebook",
        value: "box-1",
      },
      filters: [
        {
          id: "filter-status",
          field: "attr:status",
          operator: "neq",
          value: "Done",
        },
        {
          id: "filter-due",
          field: "attr:dueDate",
          operator: "next_days",
          value: "7",
        },
      ],
      sorts: [
        {
          field: "attr:dueDate",
          direction: "asc",
        },
      ],
      groupBy: "attr:status",
      fields: ["content", "attr:project", "attr:status", "attr:dueDate"],
      viewType: "table",
    }

    const compiled = buildQuery(template)

    expect(compiled.meta.selectedFields).toEqual([
      "content",
      "attr:project",
      "attr:status",
      "attr:dueDate",
    ])
    expect(compiled.sql).toContain("FROM blocks")
    expect(compiled.sql).toContain("blocks.box = 'box-1'")
    expect(compiled.sql).toContain("attr_status")
    expect(compiled.sql).toContain("attr_dueDate")
    expect(compiled.sql).toContain("attributes.name = 'custom-status'")
    expect(compiled.sql).toContain("attributes.name = 'custom-dueDate'")
    expect(compiled.sql).toContain("date('now', '+7 day')")
    expect(compiled.sql).toContain("ORDER BY")
  })

  it("rejects unsupported filter combinations before runtime", () => {
    const template: QueryTemplate = {
      id: "template-2",
      version: 1,
      name: "Broken",
      scope: {
        type: "all_blocks",
      },
      filters: [
        {
          id: "broken-filter",
          field: "content",
          operator: "date_between",
          value: "2026-03-01",
        },
      ],
      sorts: [],
      fields: ["content"],
      viewType: "table",
    }

    expect(() => buildQuery(template)).toThrow(/requires a date range/i)
  })

  it("builds aggregate SQL with a common statistical function and custom limit", () => {
    const template: QueryTemplate = {
      id: "template-3",
      version: 1,
      name: "Notebook Tag Totals",
      scope: {
        type: "all_blocks",
      },
      filters: [],
      sorts: [
        {
          field: "agg:value",
          direction: "desc",
        },
      ],
      groupBy: "box",
      fields: ["box", "agg:value"],
      aggregation: {
        function: "sum",
        field: "tagCount",
      },
      limit: 10,
      viewType: "table",
    }

    const compiled = buildQuery(template)

    expect(compiled.meta.selectedFields).toEqual(["box", "agg:value"])
    expect(compiled.meta.aggregation).toEqual({
      function: "sum",
      field: "tagCount",
    })
    expect(compiled.sql).toContain("SUM(")
    expect(compiled.sql).toContain("AS agg_value")
    expect(compiled.sql).toContain("GROUP BY")
    expect(compiled.sql).toContain("blocks.box")
    expect(compiled.sql).toContain("ORDER BY agg_value DESC")
    expect(compiled.sql).toContain("LIMIT 10")
  })

  it("supports counting tags as a numeric statistical field", () => {
    const template: QueryTemplate = {
      id: "template-4",
      version: 1,
      name: "Document Tag Count",
      scope: {
        type: "block_type",
        value: "d",
      },
      filters: [],
      sorts: [
        {
          field: "tagCount",
          direction: "desc",
        },
      ],
      fields: ["content", "tagCount"],
      limit: 10,
      viewType: "table",
    }

    const compiled = buildQuery(template)

    expect(compiled.sql).toContain("length(COALESCE(blocks.tag, ''))")
    expect(compiled.sql).toContain("replace(COALESCE(blocks.tag, ''), '#', '')")
    expect(compiled.sql).toContain("AS tagCount")
    expect(compiled.sql).toContain("ORDER BY")
    expect(compiled.sql).toContain("tagCount DESC")
  })

  it("builds document link count fields from refs and supports numeric comparisons", () => {
    const template: QueryTemplate = {
      id: "template-6",
      version: 1,
      name: "Linked Documents",
      scope: {
        type: "block_type",
        value: "d",
      },
      filters: [
        {
          id: "filter-link-count",
          field: "linkCount",
          operator: "gt",
          value: "0",
        },
      ],
      sorts: [
        {
          field: "backlinkCount",
          direction: "desc",
        },
      ],
      fields: ["content", "backlinkCount", "outLinkCount", "linkCount", "updated", "box"],
      viewType: "table",
    }

    const compiled = buildQuery(template)

    expect(compiled.sql).toContain("SELECT COUNT(DISTINCT refs.root_id)")
    expect(compiled.sql).toContain("SELECT COUNT(DISTINCT refs.def_block_root_id)")
    expect(compiled.sql).toContain("AS backlinkCount")
    expect(compiled.sql).toContain("AS outLinkCount")
    expect(compiled.sql).toContain("AS linkCount")
    expect(compiled.sql).toContain("> 0")
    expect(compiled.sql).toContain("ORDER BY")
  })

  it("compiles lt operator for numeric values", () => {
    const template: QueryTemplate = {
      id: "template-lt",
      version: 1,
      name: "LT Test",
      scope: { type: "all_blocks" },
      filters: [
        {
          id: "filter-lt",
          field: "tagCount",
          operator: "lt",
          value: "5",
        },
      ],
      sorts: [],
      fields: ["content"],
      viewType: "table",
    }

    const compiled = buildQuery(template)
    expect(compiled.sql).toContain("< 5")
  })

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

  it("builds textLength field from blocks.length and supports numeric filtering and sorting", () => {
    const template: QueryTemplate = {
      id: "template-text-length",
      version: 1,
      name: "Top Blocks By Text Length",
      scope: {
        type: "all_blocks",
      },
      filters: [
        {
          id: "filter-text-length",
          field: "textLength",
          operator: "gt",
          value: "0",
        },
      ],
      sorts: [
        {
          field: "textLength",
          direction: "desc",
        },
      ],
      fields: ["content", "textLength", "type", "box", "updated"],
      limit: 10,
      viewType: "table",
    }

    const compiled = buildQuery(template)

    expect(compiled.sql).toContain("blocks.length AS textLength")
    expect(compiled.sql).toContain("CAST(COALESCE(blocks.length, 0) AS REAL) > 0")
    expect(compiled.sql).toContain("ORDER BY textLength DESC")
    expect(compiled.sql).toContain("LIMIT 10")
  })

  it("builds relative date filters for SiYuan timestamp strings", () => {
    const template: QueryTemplate = {
      id: "template-7",
      version: 1,
      name: "Recent Documents",
      scope: {
        type: "block_type",
        value: "d",
      },
      filters: [
        {
          id: "filter-created",
          field: "created",
          operator: "last_days",
          value: "30",
        },
      ],
      sorts: [
        {
          field: "created",
          direction: "desc",
        },
      ],
      fields: ["content", "created", "updated"],
      viewType: "table",
    }

    const compiled = buildQuery(template)

    expect(compiled.sql).toContain("substr(blocks.created, 1, 8)")
    expect(compiled.sql).toContain("strftime('%Y%m%d', 'now', '-30 day')")
    expect(compiled.sql).toContain("strftime('%Y%m%d', 'now')")
    expect(compiled.sql).not.toContain("date(blocks.created)")
  })

  it("uses the human-readable path field when selecting paths", () => {
    const template: QueryTemplate = {
      id: "template-8",
      version: 1,
      name: "Readable Paths",
      scope: {
        type: "block_type",
        value: "d",
      },
      filters: [],
      sorts: [],
      fields: ["content", "path"],
      viewType: "table",
    }

    const compiled = buildQuery(template)

    expect(compiled.sql).toContain("COALESCE(blocks.hpath, blocks.path) AS path")
  })

  it("builds nested filter clauses with mixed and/or relations in row order", () => {
    const template = {
      id: "template-5",
      version: 1,
      name: "Mixed Relations",
      scope: {
        type: "all_blocks",
      },
      filters: [
        {
          id: "filter-content",
          field: "content",
          operator: "contains",
          value: "任务",
        },
        {
          id: "filter-status",
          field: "attr:status",
          operator: "eq",
          value: "Doing",
          condition: "or",
        },
        {
          id: "filter-updated",
          field: "updated",
          operator: "last_days",
          value: "7",
          condition: "and",
        },
      ],
      sorts: [],
      fields: ["content", "updated", "attr:status"],
      viewType: "table",
    } as QueryTemplate

    const compiled = buildQuery(template)

    expect(compiled.sql).toContain(" OR ")
    expect(compiled.sql).toContain(" AND ")
    expect(compiled.sql).toContain("((instr(COALESCE(blocks.content, ''), '任务') > 0")
    expect(compiled.sql).toContain("= 'Doing')")
    expect(compiled.sql).toContain("substr(blocks.updated, 1, 8) BETWEEN strftime('%Y%m%d', 'now', '-7 day') AND strftime('%Y%m%d', 'now'))")
  })

  it("builds filter clauses in the same order as the filter array", () => {
    const template: QueryTemplate = {
      id: "template-order",
      version: 1,
      name: "Ordered Filters",
      scope: {
        type: "all_blocks",
      },
      filters: [
        {
          id: "filter-priority",
          field: "attr:priority",
          operator: "eq",
          value: "P0",
        },
        {
          id: "filter-status",
          field: "attr:status",
          operator: "eq",
          value: "Doing",
          condition: "and",
        },
        {
          id: "filter-content",
          field: "content",
          operator: "contains",
          value: "发布",
          condition: "or",
        },
      ],
      sorts: [],
      fields: ["content", "attr:priority", "attr:status"],
      viewType: "table",
    }

    const compiled = buildQuery(template)
    const priorityIndex = compiled.sql.indexOf("= 'P0'")
    const statusIndex = compiled.sql.indexOf("= 'Doing'")
    const contentIndex = compiled.sql.indexOf("发布")

    expect(priorityIndex).toBeGreaterThan(-1)
    expect(statusIndex).toBeGreaterThan(priorityIndex)
    expect(contentIndex).toBeGreaterThan(statusIndex)
  })

  it("uses RANDOM() for the random sort field and includes tag in select", () => {
    const template: QueryTemplate = {
      id: "template-random",
      version: 1,
      name: "Random Documents",
      scope: {
        type: "block_type",
        value: "d",
      },
      filters: [],
      sorts: [
        {
          field: "random",
          direction: "asc",
        },
      ],
      fields: ["content", "updated", "created", "box", "tag"],
      limit: 10,
      viewType: "table",
    }

    const compiled = buildQuery(template)

    expect(compiled.sql).toContain("ORDER BY RANDOM() ASC")
    expect(compiled.sql).toContain("blocks.tag AS tag")
    expect(compiled.sql).toContain("LIMIT 10")
  })

  it("treats empty attribute scope as any custom attribute", () => {
    const template: QueryTemplate = {
      id: "template-any-attribute",
      version: 1,
      name: "Recent Custom Attribute Blocks",
      scope: {
        type: "attribute",
      },
      filters: [
        {
          id: "filter-created",
          field: "created",
          operator: "last_days",
          value: "7",
        },
      ],
      sorts: [
        {
          field: "created",
          direction: "desc",
        },
      ],
      fields: ["content", "created", "attr:status"],
      viewType: "table",
    }

    const compiled = buildQuery(template)

    expect(compiled.sql).toContain("EXISTS (SELECT 1 FROM attributes WHERE attributes.block_id = blocks.id AND attributes.name LIKE 'custom-%')")
    expect(compiled.sql).toContain("substr(blocks.created, 1, 8) BETWEEN strftime('%Y%m%d', 'now', '-7 day') AND strftime('%Y%m%d', 'now')")
  })

  it("builds SQL with random sorting when sort direction is random", () => {
    const template: QueryTemplate = {
      id: "template-random-sort",
      version: 1,
      name: "Random Blocks",
      scope: {
        type: "all_blocks",
      },
      filters: [],
      sorts: [
        {
          field: "updated",
          direction: "random",
        },
      ],
      fields: ["content", "updated"],
      viewType: "table",
    }

    const compiled = buildQuery(template)

    expect(compiled.sql).toContain("ORDER BY RANDOM()")
  })
})
