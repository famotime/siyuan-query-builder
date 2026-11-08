import type { ResultRow } from "@/core/query/types"

export type DashboardCategory = "daily" | "habit" | "assets" | "creative" | "project"

export type DashboardParamType = "notebook" | "text" | "number" | "select"

export interface DashboardParamOption {
  label: string
  value: string
}

export interface DashboardParameterDefinition {
  id: string
  label: string
  type: DashboardParamType
  /** 静态默认值,或返回默认值的惰性函数(用于随当前日期变化的月份/年份) */
  defaultValue: string | number | (() => string | number)
  options?: DashboardParamOption[]
  placeholder?: string
}

export interface MetricCardModel {
  id: string
  label: string
  value: string | number
  subText?: string
  progress?: number // 0 - 100 for progress ring/bar
  accentColor?: string
  icon?: string
}

export type TaskStatus = "todo" | "doing" | "done" | "canceled" | "deferred"

export interface CalendarTaskItem {
  id: string
  content: string
  status: TaskStatus
  date: string // YYYY-MM-DD
  docTitle?: string
  docId?: string
  priority?: string
}

export interface ChartViewModel {
  id: string
  type: "line" | "bar" | "pie" | "heatmap" | "gauge"
  title: string
  subtitle?: string
  height?: string
  option: Record<string, any>
}

export interface DashboardListItem {
  id: string
  title: string
  meta: string[]
  status?: TaskStatus | string
  created?: string
}

export interface DashboardBoardColumn {
  id: string
  title: string
  count: number
  rows: ResultRow[]
}

export interface DashboardViewModel {
  id: string
  title: string
  category: DashboardCategory
  description: string
  parameters: Record<string, any>
  metrics: MetricCardModel[]
  charts: ChartViewModel[]
  calendar?: {
    tasks: CalendarTaskItem[]
    selectedMonth: string
  }
  listItems?: DashboardListItem[]
  boardColumns?: DashboardBoardColumn[]
  tableRows?: ResultRow[]
}

export interface DashboardDefinition {
  id: string
  category: DashboardCategory
  title: string
  description: string
  parameters: DashboardParameterDefinition[]
  // 方法式声明:允许各场景以更窄的参数接口实现(参数由 runtime 层归一后传入)
  buildSql: (params: Record<string, any>) => string | string[]
  computeViewModel: (rows: ResultRow[], params: Record<string, any>) => DashboardViewModel
}
