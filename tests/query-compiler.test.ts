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
    expect(compiled.sql).toContain("date(blocks.updated) BETWEEN date('now', '-7 day') AND date('now'))")
  })
})
