import { describe, expect, it } from "vitest"
import { buildMonthCalendarGrid } from "@/core/view/calendar"
import type { CalendarTaskItem } from "@/core/dashboard/types"

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
