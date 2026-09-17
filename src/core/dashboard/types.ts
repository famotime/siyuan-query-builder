import type { FieldMappings, ResultRow, ViewType } from "@/core/query/types"

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
  defaultValue: string | number
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
  buildSql: (params: Record<string, any>, mappings: FieldMappings) => string | string[]
  computeViewModel: (
    rawRows: ResultRow[] | ResultRow[][],
    params: Record<string, any>,
    mappings: FieldMappings,
  ) => DashboardViewModel
}
