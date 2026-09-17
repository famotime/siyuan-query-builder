import type { CalendarTaskItem, TaskStatus } from "@/core/dashboard/types"
import { formatIsoDate } from "@/core/dashboard/calculator"

export interface CalendarDayCell {
  iso: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  hasPending: boolean
  totalTasks: number
  visibleTasks: CalendarTaskItem[]
  overflowCount: number
}

export interface CalendarGridModel {
  yearMonth: string // YYYY-MM
  monthTitle: string // e.g. 2026年9月
  weekLabels: string[]
  weeks: CalendarDayCell[][]
  totalTasks: number
  openTasks: number
  doneTasks: number
}

export function buildMonthCalendarGrid(
  yearMonth: string,
  tasks: CalendarTaskItem[],
  options?: {
    weekStart?: 0 | 1 // 1=周一, 0=周日, default 1
    maxPerDay?: number
    statusFilter?: "all" | "open" | TaskStatus
    todayIso?: string
  },
): CalendarGridModel {
  const weekStart = options?.weekStart ?? 1
  const maxPerDay = options?.maxPerDay ?? 3
  const statusFilter = options?.statusFilter ?? "all"
  const today = options?.todayIso ?? formatIsoDate(new Date())

  const [yearStr, monthStr] = yearMonth.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr) // 1 - 12

  // 过滤任务
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === "all") return true
    if (statusFilter === "open") {
      return task.status === "todo" || task.status === "doing" || task.status === "deferred"
    }
    return task.status === statusFilter
  })

  // 按日期归类任务
  const tasksByDay = new Map<string, CalendarTaskItem[]>()
  for (const t of filteredTasks) {
    if (!t.date) continue
    const list = tasksByDay.get(t.date) || []
    list.push(t)
    tasksByDay.set(t.date, list)
  }

  // 星期标题
  const weekLabels = weekStart === 1
    ? ["一", "二", "三", "四", "五", "六", "日"]
    : ["日", "一", "二", "三", "四", "五", "六"]

  // 当月第一天与最后一天
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()

  // 计算第一天前面的 padding
  let startDayOfWeek = firstDay.getDay() // 0=周日, 1=周一
  if (weekStart === 1) {
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1
  }

  const cells: CalendarDayCell[] = []

  // 补充上月日期
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 2, prevMonthLastDay - i)
    const iso = formatIsoDate(prevDate)
    const dayTasks = tasksByDay.get(iso) || []
    const hasPending = dayTasks.some(t => t.status === "todo" || t.status === "doing")
    cells.push({
      iso,
      dayNumber: prevDate.getDate(),
      isCurrentMonth: false,
      isToday: iso === today,
      hasPending,
      totalTasks: dayTasks.length,
      visibleTasks: dayTasks.slice(0, maxPerDay),
      overflowCount: Math.max(0, dayTasks.length - maxPerDay),
    })
  }

  // 当月日期
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month - 1, d)
    const iso = formatIsoDate(curDate)
    const dayTasks = tasksByDay.get(iso) || []
    const hasPending = dayTasks.some(t => t.status === "todo" || t.status === "doing")
    cells.push({
      iso,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: iso === today,
      hasPending,
      totalTasks: dayTasks.length,
      visibleTasks: dayTasks.slice(0, maxPerDay),
      overflowCount: Math.max(0, dayTasks.length - maxPerDay),
    })
  }

  // 补充下月日期直到填满整周 (7 的倍数)
  let nextDay = 1
  while (cells.length % 7 !== 0) {
    const nextDate = new Date(year, month, nextDay++)
    const iso = formatIsoDate(nextDate)
    const dayTasks = tasksByDay.get(iso) || []
    const hasPending = dayTasks.some(t => t.status === "todo" || t.status === "doing")
    cells.push({
      iso,
      dayNumber: nextDate.getDate(),
      isCurrentMonth: false,
      isToday: iso === today,
      hasPending,
      totalTasks: dayTasks.length,
      visibleTasks: dayTasks.slice(0, maxPerDay),
      overflowCount: Math.max(0, dayTasks.length - maxPerDay),
    })
  }

  // 拆分为每周
  const weeks: CalendarDayCell[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  const openCount = tasks.filter(t => t.status === "todo" || t.status === "doing" || t.status === "deferred").length
  const doneCount = tasks.filter(t => t.status === "done").length

  return {
    yearMonth,
    monthTitle: `${year}年${month}月`,
    weekLabels,
    weeks,
    totalTasks: tasks.length,
    openTasks: openCount,
    doneTasks: doneCount,
  }
}
