import { describe, expect, it } from "vitest"

import { displayValue } from "@/composables/query-builder-store/shared"

describe("displayValue", () => {
  it("formats SiYuan timestamps, notebook names, and human-readable paths", () => {
    const row = {
      id: "20260322130128-abc1234",
      content: "项目周报",
      attrs: {},
      updated: "20260322130128",
      created: "20260322091500",
      box: "box-1",
      path: "/20260322130128-abc1234.sy",
      hpath: "/工作台/项目周报",
    }

    expect(displayValue(row, "updated")).toBe("2026-03-22 13:01:28")
    expect(displayValue(row, "created")).toBe("2026-03-22 09:15:00")
    expect(displayValue(row, "box", {
      notebookNameById: {
        "box-1": "工作笔记",
      },
    })).toBe("工作笔记")
    expect(displayValue(row, "path")).toBe("/工作台/项目周报")
  })
})
