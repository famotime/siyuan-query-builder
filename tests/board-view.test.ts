import { describe, expect, it } from "vitest"

import { buildBoardColumns } from "@/core/view/board"
import type { ResultRow } from "@/core/query/types"

describe("buildBoardColumns", () => {
  it("groups rows by field value and collects ungrouped rows", () => {
    const rows: ResultRow[] = [
      {
        id: "1",
        content: "Design PRD",
        attrs: {
          status: "Todo",
        },
      },
      {
        id: "2",
        content: "Implement compiler",
        attrs: {
          status: "Doing",
        },
      },
      {
        id: "3",
        content: "Write changelog",
        attrs: {},
      },
    ]

    const columns = buildBoardColumns(rows, "attr:status")

    expect(columns.map(column => column.id)).toEqual(["Todo", "Doing", "__ungrouped__"])
    expect(columns[2].rows[0]?.id).toBe("3")
  })
})
