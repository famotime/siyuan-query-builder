import { describe, expect, it } from "vitest"

import { createResultPresentation } from "@/core/view/presentation"
import type { ResultRow } from "@/core/query/types"

describe("createResultPresentation", () => {
  it("shares field labels, display formatting, and view-model builders across result surfaces", () => {
    const rows: ResultRow[] = [
      {
        id: "block-1",
        content: "Design dashboard",
        attrs: {
          status: "Todo",
          priority: "P1",
          dueDate: "2026-03-24",
        },
        updated: "20260324120000",
        box: "box-1",
        hpath: "/工作台/Design dashboard",
        type: "d",
      },
      {
        id: "block-2",
        content: "Ship package",
        attrs: {
          status: "Doing",
        },
        updated: "20260325153000",
        box: "box-1",
        hpath: "/工作台/Ship package",
        type: "l",
      },
    ]

    const presentation = createResultPresentation({
      fieldMappings: {
        status: "status",
        dueDate: "dueDate",
        priority: "priority",
        project: "project",
        owner: "owner",
      },
      notebookNameById: {
        "box-1": "工作笔记",
      },
    })

    expect(presentation.fieldLabel("attr:status")).toBe("状态")
    expect(presentation.displayValue(rows[0]!, "updated")).toBe("2026-03-24 12:00:00")
    expect(presentation.displayValue(rows[0]!, "box")).toBe("工作笔记")
    expect(presentation.displayValue(rows[0]!, "path")).toBe("/工作台/Design dashboard")
    expect(presentation.displayValue(rows[0]!, "type")).toBe("文档")

    expect(presentation.buildCardsSummary(rows, "attr:status")).toEqual([
      { label: "总结果", value: "2" },
      { label: "Todo", value: "1" },
      { label: "Doing", value: "1" },
    ])
    expect(presentation.buildCardsSummary(rows, "box")).toEqual([
      { label: "总结果", value: "2" },
      { label: "工作笔记", value: "2" },
    ])
    expect(presentation.buildListItems(rows, ["attr:priority", "attr:status"])).toEqual([
      {
        id: "block-1",
        title: "Design dashboard",
        meta: ["P1", "Todo"],
      },
      {
        id: "block-2",
        title: "Ship package",
        meta: ["Doing"],
      },
    ])
    expect(presentation.buildListItems(rows, ["box", "type"])).toEqual([
      {
        id: "block-1",
        title: "Design dashboard",
        meta: ["工作笔记", "文档"],
      },
      {
        id: "block-2",
        title: "Ship package",
        meta: ["工作笔记", "列表"],
      },
    ])
    expect(presentation.buildBoardColumns(rows, "attr:status").map(column => column.title)).toEqual(["Todo", "Doing"])
    expect(presentation.buildBoardColumns(rows, "box")).toEqual([
      expect.objectContaining({
        id: "box-1",
        title: "工作笔记",
      }),
    ])
  })
})
