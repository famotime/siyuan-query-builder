import { describe, expect, it } from "vitest"
import { getDashboardDefinition, SCENARIO_DASHBOARDS } from "@/core/dashboard/catalog"
import { DEFAULT_FIELD_MAPPINGS } from "@/core/query/catalog/constants"

describe("dashboard catalog & scenario presets", () => {
  it("contains all 5 scenario dashboards", () => {
    expect(SCENARIO_DASHBOARDS.length).toBe(5)
    const ids = SCENARIO_DASHBOARDS.map(d => d.id)
    expect(ids).toContain("daily-cockpit")
    expect(ids).toContain("habit-tracker")
    expect(ids).toContain("kb-health")
    expect(ids).toContain("writing-flow")
    expect(ids).toContain("project-delivery")
  })

  it("builds SQL and computes ViewModel for daily-cockpit", () => {
    const def = getDashboardDefinition("daily-cockpit")
    expect(def).toBeDefined()
    const sql = def!.buildSql({ notebook: "box123", statusFilter: "open", month: "2026-09" }, DEFAULT_FIELD_MAPPINGS)
    expect(sql).toContain("b.box = 'box123'")

    const mockRows = [
      { id: "b1", content: "- [ ] Write docs", markdown: "- [ ] Write docs", hpath: "/Daily/2026-09-17", created: "20260917100000" },
      { id: "b2", content: "- [x] Done task", markdown: "- [x] Done task", hpath: "/Daily/2026-09-17", created: "20260917110000" },
      { id: "b3", content: "- [ ] Overdue task", markdown: "- [ ] Overdue task", hpath: "/Daily/2026-09-10", created: "20260910100000" },
    ]
    const vm = def!.computeViewModel(mockRows as any, { month: "2026-09" }, DEFAULT_FIELD_MAPPINGS)
    expect(vm.id).toBe("daily-cockpit")
    expect(vm.metrics.length).toBeGreaterThanOrEqual(3)
    expect(vm.calendar?.tasks.length).toBe(3)
    expect(vm.listItems?.length).toBeGreaterThanOrEqual(1)
  })

  it("builds SQL and computes ViewModel for habit-tracker", () => {
    const def = getDashboardDefinition("habit-tracker")
    expect(def).toBeDefined()
    const sql = def!.buildSql({ keyword: "喝水", goal: 8, days: "30" }, DEFAULT_FIELD_MAPPINGS)
    expect(sql).toContain("LIKE '%喝水%'")

    const mockRows = [
      { id: "h1", day: "20260917", hpath: "/2026-09-17" },
      { id: "h2", day: "20260917", hpath: "/2026-09-17" },
    ]
    const vm = def!.computeViewModel(mockRows as any, { keyword: "喝水", goal: 2, days: "30" }, DEFAULT_FIELD_MAPPINGS)
    expect(vm.id).toBe("habit-tracker")
    expect(vm.metrics.length).toBe(4)
    expect(vm.charts.length).toBe(3) // line, bar, heatmap
  })

  it("builds SQL and computes ViewModel for kb-health", () => {
    const def = getDashboardDefinition("kb-health")
    expect(def).toBeDefined()
    const mockRows = [
      { id: "doc1", content: "Core Architecture", backlinkCount: 25 },
      { id: "doc2", content: "Product Design", backlinkCount: 15 },
    ]
    const vm = def!.computeViewModel(mockRows as any, { hubLimit: 10 }, DEFAULT_FIELD_MAPPINGS)
    expect(vm.metrics.length).toBe(3)
    expect(vm.charts[0].type).toBe("bar")
  })

  it("builds SQL and computes ViewModel for writing-flow and project-delivery", () => {
    const writingDef = getDashboardDefinition("writing-flow")
    const writingVm = writingDef!.computeViewModel([], { year: "2026" }, DEFAULT_FIELD_MAPPINGS)
    expect(writingVm.boardColumns?.length).toBe(4)

    const projectDef = getDashboardDefinition("project-delivery")
    const projectVm = projectDef!.computeViewModel([], {}, DEFAULT_FIELD_MAPPINGS)
    expect(projectVm.boardColumns?.length).toBe(4)
  })
})
