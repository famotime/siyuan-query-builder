import { describe, expect, it } from "vitest"
import { formatIsoDate } from "@/core/dashboard/calculator"
import { getDashboardDefinition } from "@/core/dashboard/catalog"
import type { ResultRow } from "@/core/query/types"

function compactDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}093000`
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

describe("daily-cockpit computeViewModel branches", () => {
  const def = getDashboardDefinition("daily-cockpit")!

  it("counts today's open/done tasks, overdue items and month totals", () => {
    const today = formatIsoDate(new Date())
    const month = today.slice(0, 7)
    const rows = [
      { id: "r1", markdown: "[_] 今日待办", hpath: `/Daily/${today}`, created: compactDate(new Date()) },
      { id: "r2", markdown: "[x] 今日完成", hpath: `/Daily/${today}`, created: compactDate(new Date()) },
      { id: "r3", markdown: "[_] 逾期任务", hpath: "/Daily/2026-01-01", created: "20260101093000" },
      { id: "r4", markdown: "[+] 已延期", hpath: `/Daily/${today}`, created: compactDate(new Date()) },
    ] as unknown as ResultRow[]

    const vm = def.computeViewModel(rows, { month })

    // 指标卡
    const metric = (id: string) => vm.metrics.find(m => m.id === id)!
    expect(metric("today_open").value).toBe("1 项") // 仅 todo/doing,deferred 不计入
    expect(metric("today_rate").value).toBe("33%") // 1 done / 今日共 3 项(含 deferred)
    expect(metric("overdue").value).toBe("1 项")
    expect(metric("month_total").value).toBe("3 项") // 本月事项含 deferred
    expect(metric("today_open").subText).toBe("进行中 0 项")

    // 任务解析:markdown 前缀剥离、日期来自 hpath、deferred 状态保留
    expect(vm.calendar?.tasks).toHaveLength(4)
    expect(vm.calendar?.tasks[0]).toMatchObject({ id: "r1", content: "今日待办", status: "todo", date: today })
    expect(vm.calendar?.tasks[3].status).toBe("deferred")

    // 清单 = 今日待办 + 逾期
    expect(vm.listItems).toHaveLength(4)
    expect(vm.listItems?.[0].meta).toContain("今日")
    expect(vm.listItems?.[3].meta[0]).toContain("逾期")

    // 选中月份回显
    expect(vm.calendar?.selectedMonth).toBe(month)
  })

  it("falls back to the current month and today rate 100% for empty rows", () => {
    const month = formatIsoDate(new Date()).slice(0, 7)
    const vm = def.computeViewModel([], {})

    expect(vm.calendar?.selectedMonth).toBe(month)
    expect(vm.calendar?.tasks).toHaveLength(0)
    expect(vm.metrics.find(m => m.id === "today_rate")?.value).toBe("100%")
    expect(vm.metrics.find(m => m.id === "overdue")?.value).toBe("0 项")
  })

  it("keeps the notebook clause out of the SQL when notebook is 'all'", () => {
    const sqlAll = def.buildSql({ notebook: "all", statusFilter: "open", month: "2026-11" })
    expect(sqlAll).not.toContain("AND b.box = ")
    expect(sqlAll).toContain("LIMIT 600")

    const sqlBox = def.buildSql({ notebook: "box123", statusFilter: "open", month: "2026-11" })
    expect(sqlBox).toContain("AND b.box = 'box123'")
  })
})

describe("habit-tracker computeViewModel branches", () => {
  const def = getDashboardDefinition("habit-tracker")!

  it("aggregates daily counts, computes streak and reach rate", () => {
    const today = daysAgo(0)
    const yesterday = daysAgo(1)
    const rows = [
      { id: "h1", day: compactDate(today).slice(0, 8), hpath: "" },
      { id: "h2", day: compactDate(today).slice(0, 8), hpath: "" },
      { id: "h3", day: compactDate(yesterday).slice(0, 8), hpath: "" },
    ] as unknown as ResultRow[]

    const vm = def.computeViewModel(rows, { keyword: "跑步", goal: 2, days: "30" })

    const metric = (id: string) => vm.metrics.find(m => m.id === id)!
    expect(metric("today_progress").value).toBe("2 / 2 次")
    expect(metric("today_progress").progress).toBe(100)
    expect(metric("today_progress").subText).toContain("已达标")
    expect(metric("streak").value).toBe("🔥 1 天") // 昨日未达标,连续从今天起算
    expect(metric("total_times").value).toBe("3 次")
    // 30 天中 2 天有记录,达标 1 天 → 达标率 50%
    expect(metric("reach_rate").value).toBe("50%")
    expect(vm.charts[0].title).toContain("跑步")
    expect(vm.charts[0].title).toContain("近 30 天")
    expect(vm.tableRows).toHaveLength(3)
  })

  it("falls back to the hpath date when the day column is missing", () => {
    const today = daysAgo(0)
    const rows = [
      { id: "h1", day: "", hpath: `/${formatIsoDate(today)}` },
    ] as unknown as ResultRow[]

    const vm = def.computeViewModel(rows, { keyword: "喝水", goal: 1, days: "30" })

    expect(vm.metrics.find(m => m.id === "today_progress")?.value).toBe("1 / 1 次")
  })

  it("embeds the keyword into the SQL LIKE clause with default fallback", () => {
    expect(def.buildSql({ keyword: "阅读", goal: 3, days: "90" })).toContain("LIKE '%阅读%'")
    expect(def.buildSql({}, ) as string).toContain("LIKE '%喝水%'")
  })
})

describe("kb-health computeViewModel branches", () => {
  const def = getDashboardDefinition("kb-health")!

  it("computes hub metrics and reverses the horizontal bar categories", () => {
    const rows = [
      { id: "d1", content: "核心架构文档", backlinkCount: 25, hpath: "/docs/arch" },
      { id: "d2", content: "产品设计笔记", backlinkCount: 15, hpath: "/docs/design" },
    ] as unknown as ResultRow[]

    const vm = def.computeViewModel(rows, { hubLimit: 10 })

    const metric = (id: string) => vm.metrics.find(m => m.id === id)!
    expect(metric("docs_count").value).toBe("已接入")
    expect(metric("top_hub_refs").value).toBe("25 次")
    expect(metric("avg_hub_refs").value).toBe("20 次")

    // 横向柱状图:yAxis 为类目轴,且倒序(最少在前)
    expect(vm.charts[0].option.yAxis.data).toEqual(["产品设计笔记", "核心架构文档"])
    expect(vm.charts[0].option.series[0].data).toEqual([15, 25])

    expect(vm.listItems?.[0].title).toBe("1. 核心架构文档")
    expect(vm.listItems?.[0].meta[0]).toBe("25 次反链引用")
  })

  it("handles empty rows and applies the hub limit to the SQL", () => {
    const vm = def.computeViewModel([], { hubLimit: 10 })
    expect(vm.metrics.find(m => m.id === "docs_count")?.value).toBe("0")
    expect(vm.metrics.find(m => m.id === "top_hub_refs")?.subText).toBe("暂无")
    expect(vm.charts[0].option.series[0].data).toEqual([])

    expect(def.buildSql({ hubLimit: 25 })).toContain("LIMIT 25")
    expect(def.buildSql({})).toContain("LIMIT 10")
  })
})

describe("writing-flow computeViewModel branches", () => {
  const def = getDashboardDefinition("writing-flow")!

  it("buckets documents by English and Chinese custom status values", () => {
    const rows = [
      { id: "w1", created: "20260315093000", status: "Reading" },
      { id: "w2", created: "20260316093000", status: "待读" },
      { id: "w3", created: "20260401093000", status: "Output" },
    ] as unknown as ResultRow[]

    const vm = def.computeViewModel(rows, { year: "2026" })

    const metric = (id: string) => vm.metrics.find(m => m.id === id)!
    expect(metric("year_docs").value).toBe("3 篇")
    expect(metric("year_docs").subText).toContain("活跃写作天数: 3 天")
    expect(metric("active_rate").value).toBe(`${Math.round((3 / 365) * 100)}%`)

    const board = vm.boardColumns!
    expect(board.find(c => c.id === "reading")?.count).toBe(1)
    expect(board.find(c => c.id === "in_progress")?.count).toBe(1)
    expect(board.find(c => c.id === "output")?.count).toBe(1)
    expect(board.find(c => c.id === "archived")?.count).toBe(0)

    expect(vm.charts[0].title).toContain("2026")
    expect(vm.charts[0].option.series[0].data).toBeDefined()
  })

  it("treats missing status as unread and filters SQL by year", () => {
    const rows = [
      { id: "w1", created: "20260315093000", status: undefined },
    ] as unknown as ResultRow[]
    const vm = def.computeViewModel(rows, { year: "2026" })
    expect(vm.boardColumns!.find(c => c.id === "reading")?.count).toBe(1)

    expect(def.buildSql({ year: "2025" })).toContain("b.created LIKE '2025%'")
  })
})

describe("project-delivery computeViewModel branches", () => {
  const def = getDashboardDefinition("project-delivery")!

  it("buckets project statuses and priorities in English and Chinese", () => {
    const rows = [
      { id: "p1", status: "Doing", priority: "P0" },
      { id: "p2", status: "规划中", priority: "紧急" },
      { id: "p3", status: "已完成", priority: "P2" },
      { id: "p4", status: undefined, priority: undefined },
      { id: "p5", status: "测试中", priority: "P1" },
    ] as unknown as ResultRow[]

    const vm = def.computeViewModel(rows, { scope: "" })

    const metric = (id: string) => vm.metrics.find(m => m.id === id)!
    expect(metric("active_projects").value).toBe("1 项")
    expect(metric("active_projects").subText).toBe("规划中 2 · 验收中 1")
    expect(metric("high_priority").value).toBe("2 项")
    expect(metric("delivered").value).toBe("1 项")
    expect(metric("delivered").subText).toBe("总计 5 项目标")

    const board = vm.boardColumns!
    expect(board.find(c => c.id === "col_planning")?.count).toBe(2)
    expect(board.find(c => c.id === "col_doing")?.count).toBe(1)
    expect(board.find(c => c.id === "col_testing")?.count).toBe(1)
    expect(board.find(c => c.id === "col_done")?.count).toBe(1)
    // 看板列最多展示 8 行
    expect(board.find(c => c.id === "col_planning")?.rows).toHaveLength(2)

    // 饼图分片与数值
    const pieData = vm.charts[0].option.series[0].data
    const slice = (name: string) => pieData.find((d: { name: string }) => d.name === name)?.value
    expect(slice("P0 紧急")).toBe(2)
    expect(slice("P1 重要")).toBe(1)
    expect(slice("P2 常规")).toBe(1)
    expect(slice("未设置")).toBe(1) // 5 - 2 - 1 - 1

    // 零值分片被过滤
    const emptyVm = def.computeViewModel(
      rows.map(r => ({ ...r, priority: r.id === "p1" ? "P0" : undefined })),
      { scope: "" },
    )
    const emptyNames = emptyVm.charts[0].option.series[0].data.map((d: { name: string }) => d.name)
    expect(emptyNames).not.toContain("P1 重要")
    expect(emptyNames).not.toContain("P2 常规")
  })

  it("adds the scope tag clause only when a scope is provided", () => {
    expect(def.buildSql({ scope: "#项目" })).toContain("AND b.tag LIKE '%#项目%'")
    expect(def.buildSql({ scope: "" })).not.toContain("b.tag")
  })
})
