import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import { addMonths, buildMonthCalendarGrid, filterCalendarTasks } from "@/core/view/calendar"
import type { CalendarTaskItem } from "@/core/dashboard/types"
import ResultsCalendarView from "@/components/query-builder/ResultsCalendarView.vue"

describe("calendar view grid logic", () => {
  it("builds a full week-aligned month grid for September 2026", () => {
    // 2026-09-01 is Tuesday. With weekStart=1 (Monday), previous month padding should be 1 day (Aug 31).
    // September has 30 days. Total cells = 1 + 30 + 4 (Oct 1..4) = 35 cells (5 weeks).
    const grid = buildMonthCalendarGrid("2026-09", [], { weekStart: 1, todayIso: "2026-09-17" })

    expect(grid.yearMonth).toBe("2026-09")
    expect(grid.monthTitle).toBe("2026年9月")
    expect(grid.weekLabels).toEqual(["一", "二", "三", "四", "五", "六", "日"])
    expect(grid.weeks.length).toBe(5)

    // Check first week
    const firstWeek = grid.weeks[0]
    expect(firstWeek.length).toBe(7)
    expect(firstWeek[0].iso).toBe("2026-08-31")
    expect(firstWeek[0].isCurrentMonth).toBe(false)
    expect(firstWeek[1].iso).toBe("2026-09-01")
    expect(firstWeek[1].isCurrentMonth).toBe(true)

    // Check today flag
    const day17 = grid.weeks.flat().find(c => c.iso === "2026-09-17")
    expect(day17?.isToday).toBe(true)
  })

  it("assigns tasks and detects pending tasks with overflow limits", () => {
    const tasks: CalendarTaskItem[] = [
      { id: "1", content: "Task 1", status: "todo", date: "2026-09-17" },
      { id: "2", content: "Task 2", status: "doing", date: "2026-09-17" },
      { id: "3", content: "Task 3", status: "done", date: "2026-09-17" },
      { id: "4", content: "Task 4", status: "todo", date: "2026-09-17" },
      { id: "5", content: "Task 5 on another day", status: "done", date: "2026-09-18" },
    ]

    const grid = buildMonthCalendarGrid("2026-09", tasks, { maxPerDay: 2, todayIso: "2026-09-17" })
    const day17 = grid.weeks.flat().find(c => c.iso === "2026-09-17")

    expect(day17).toBeDefined()
    expect(day17?.hasPending).toBe(true)
    expect(day17?.totalTasks).toBe(4)
    expect(day17?.visibleTasks.length).toBe(2)
    expect(day17?.overflowCount).toBe(2)

    const day18 = grid.weeks.flat().find(c => c.iso === "2026-09-18")
    expect(day18?.hasPending).toBe(false) // all done
    expect(day18?.totalTasks).toBe(1)
  })

  it("filters tasks by status", () => {
    const tasks: CalendarTaskItem[] = [
      { id: "1", content: "Task 1", status: "todo", date: "2026-09-17" },
      { id: "2", content: "Task 2", status: "done", date: "2026-09-17" },
    ]

    const openGrid = buildMonthCalendarGrid("2026-09", tasks, { statusFilter: "open" })
    const day17 = openGrid.weeks.flat().find(c => c.iso === "2026-09-17")
    expect(day17?.visibleTasks.length).toBe(1)
    expect(day17?.visibleTasks[0].status).toBe("todo")
  })
})

describe("filterCalendarTasks", () => {
  const tasks: CalendarTaskItem[] = [
    { id: "1", content: "待办", status: "todo", date: "2026-09-17" },
    { id: "2", content: "进行中", status: "doing", date: "2026-09-17" },
    { id: "3", content: "已延期", status: "deferred", date: "2026-09-17" },
    { id: "4", content: "已完成", status: "done", date: "2026-09-17" },
  ]

  it("keeps todo, doing and deferred tasks under the open filter (grid and popover share the rule)", () => {
    const openTasks = filterCalendarTasks(tasks, "open")
    expect(openTasks.map(t => t.id)).toEqual(["1", "2", "3"])
  })

  it("returns everything for the all filter and exact matches for a specific status", () => {
    expect(filterCalendarTasks(tasks, "all")).toHaveLength(4)
    expect(filterCalendarTasks(tasks, "done").map(t => t.id)).toEqual(["4"])
    expect(filterCalendarTasks(tasks, "deferred").map(t => t.id)).toEqual(["3"])
  })
})

describe("addMonths", () => {
  it("advances within the same year with zero padding", () => {
    expect(addMonths("2026-03", 1)).toBe("2026-04")
    expect(addMonths("2026-03", -2)).toBe("2026-01")
  })

  it("rolls across year boundaries in both directions", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12")
    expect(addMonths("2025-12", 1)).toBe("2026-01")
  })

  it("handles multi-month jumps", () => {
    expect(addMonths("2026-06", 14)).toBe("2027-08")
    expect(addMonths("2026-06", -18)).toBe("2024-12")
  })
})

describe("ResultsCalendarView popover consistency", () => {
  function buildTasks(): CalendarTaskItem[] {
    return [
      { id: "t-1", content: "待办一", status: "todo", date: "2026-09-17" },
      { id: "t-2", content: "进行中", status: "doing", date: "2026-09-17" },
      { id: "t-3", content: "已延期", status: "deferred", date: "2026-09-17" },
      { id: "t-4", content: "已完成", status: "done", date: "2026-09-17" },
      { id: "t-5", content: "待办二", status: "todo", date: "2026-09-17" },
    ]
  }

  async function mountWithOpenFilter() {
    const wrapper = mount(ResultsCalendarView, {
      props: {
        tasks: buildTasks(),
        initialMonth: "2026-09",
      },
    })
    // 切到“未完成”(open)过滤
    const openChip = wrapper.findAll(".calendar-view__filter-chip")
      .find(node => node.text() === "未完成")
    await openChip!.trigger("click")
    return wrapper
  }

  it("keeps the day popover in sync with the grid filter, including deferred tasks", async () => {
    const wrapper = await mountWithOpenFilter()

    // open 过滤下该日共 4 项,每格最多展示 3 项,应出现 +1 溢出
    const day17Cell = wrapper.findAll(".calendar-view__cell")
      .find(node => node.text().includes("待办一"))!
    const moreBadge = day17Cell.find(".calendar-view__more-badge")
    expect(moreBadge.exists()).toBe(true)
    expect(moreBadge.text()).toBe("+1")

    // 点开溢出明细:4 项都应可见(含 deferred)
    await moreBadge.trigger("click")
    const popoverTexts = wrapper.findAll(".calendar-view__popover-text").map(node => node.text())
    expect(popoverTexts).toEqual(["待办一", "进行中", "已延期", "待办二"])
  })
})
