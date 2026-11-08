import { describe, expect, it } from "vitest"

import {
  buildCalendarTaskItems,
  buildGroupDistributionChartOption,
} from "@/core/view/result-view-model"
import type { ResultRow } from "@/core/query/types"

function makeRow(overrides: Partial<ResultRow> = {}): ResultRow {
  return {
    id: "block-1",
    parent_id: "",
    root_id: "doc-1",
    content: "",
    markdown: "",
    created: "",
    ...overrides,
  } as ResultRow
}

describe("buildCalendarTaskItems", () => {
  it("strips the status prefix from markdown and derives fields from the row", () => {
    const items = buildCalendarTaskItems([
      makeRow({
        id: "block-1",
        root_id: "doc-9",
        markdown: "[_] 2026/11/08 完成周报",
        hpath: "/projects/_daily/工作日志",
      }),
    ])

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      id: "block-1",
      content: "2026/11/08 完成周报",
      docTitle: "工作日志",
      docId: "doc-9",
    })
  })

  it("prefers the hpath date and falls back to the created timestamp", () => {
    const withHPath = buildCalendarTaskItems([
      makeRow({ hpath: "2026-11-01 每日笔记", created: "20261102093000" }),
    ])
    expect(withHPath[0].date).toBe("2026-11-01")

    const withCreatedOnly = buildCalendarTaskItems([
      makeRow({ hpath: "", created: "20261102093000" }),
    ])
    expect(withCreatedOnly[0].date).toBe("2026-11-02")
  })

  it("falls back to the unnamed-block content and todo status for plain rows", () => {
    const items = buildCalendarTaskItems([
      makeRow({ content: "纯文本块", created: "20261102093000" }),
    ])

    expect(items[0].content).toBe("纯文本块")
    expect(items[0].date).toBe("2026-11-02")
    expect(items[0].status).toBe("todo")
  })

  it("returns an empty list for missing rows", () => {
    expect(buildCalendarTaskItems(undefined)).toEqual([])
    expect(buildCalendarTaskItems([])).toEqual([])
  })
})

describe("buildGroupDistributionChartOption", () => {
  it("builds a grouped bar chart from the summary entries beyond the total card", () => {
    const option = buildGroupDistributionOptionForTest({
      title: "项目看板",
      summary: [
        { label: "总结果数", value: 10 },
        { label: "进行中", value: 3 },
        { label: "已完成", value: "7" },
      ],
      totalRows: 10,
    })

    expect(option.title.text).toContain("项目看板 - 分组统计")
    const categories = option.xAxis?.data || option.yAxis?.data
    expect(categories).toEqual(["进行中", "已完成"])
    expect(option.series[0].data).toEqual([3, 7])
  })

  it("falls back to a total-only chart when the summary has no group entries", () => {
    const option = buildGroupDistributionOptionForTest({
      title: "",
      summary: [],
      totalRows: 6,
    })

    expect(option.title.text).toBe("统计图表")
    const categories = option.xAxis?.data || option.yAxis?.data
    expect(categories).toEqual(["总结果数"])
    expect(option.series[0].data).toEqual([6])
  })

  it("uses the unified title when a base title exists", () => {
    const grouped = buildGroupDistributionOptionForTest({
      title: "我的查询",
      summary: [
        { label: "总结果数", value: 5 },
        { label: "待办", value: 2 },
      ],
      totalRows: 5,
    })
    expect(grouped.title.text).toBe("我的查询 - 分组统计")

    const fallback = buildGroupDistributionOptionForTest({
      title: "我的查询",
      summary: [],
      totalRows: 5,
    })
    expect(fallback.title.text).toBe("我的查询 - 分组统计")
  })

  it("treats a single summary card as the fallback case", () => {
    const option = buildGroupDistributionOptionForTest({
      title: "项目看板",
      summary: [{ label: "总结果数", value: 4 }],
      totalRows: 4,
    })

    const categories = option.xAxis?.data || option.yAxis?.data
    expect(categories).toEqual(["总结果数"])
    expect(option.series[0].data).toEqual([4])
  })
})

function buildGroupDistributionOptionForTest(input: {
  title: string
  summary: Array<{ label: string, value: string | number }>
  totalRows: number
}) {
  return buildGroupDistributionChartOption(input)
}
