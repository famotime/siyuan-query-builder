export type ViewType = "table" | "board" | "list" | "cards"

export type AggregationFunction = "count" | "sum" | "avg" | "min" | "max"

export type ScopeType =
  | "all_blocks"
  | "notebook"
  | "document"
  | "block_type"
  | "tag"
  | "attribute"

export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "contains"
  | "not_contains"
  | "empty"
  | "not_empty"
  | "date_between"
  | "next_days"
  | "last_days"

export type FilterCondition = "and" | "or"

export type FieldId = string

export interface QueryScope {
  type: ScopeType
  value?: string
}

export interface QueryFilter {
  id: string
  field: FieldId
  operator: FilterOperator
  condition?: FilterCondition
  value?: unknown
}

export interface QuerySort {
  field: FieldId
  direction: "asc" | "desc"
}

export interface QueryAggregation {
  function: AggregationFunction
  field?: FieldId
}

export interface QueryTemplate {
  id: string
  version: number
  name: string
  scope: QueryScope
  filters: QueryFilter[]
  sorts: QuerySort[]
  groupBy?: FieldId
  aggregation?: QueryAggregation
  limit?: number
  fields: FieldId[]
  viewType: ViewType
}

export interface FieldMappings {
  status: string
  dueDate: string
  priority: string
  project: string
  owner: string
}

export interface ViewConfig {
  id: string
  queryTemplateId: string
  type: ViewType
  defaultView: boolean
  fieldMappings: FieldMappings
  fields?: FieldId[]
  sorts?: QuerySort[]
  groupBy?: FieldId | null
  aggregation?: QueryAggregation | null
}

export interface SavedTemplateSummary {
  templateId: string
  templateName: string
  defaultViewId?: string
  defaultViewType: ViewType
  viewCount: number
}

export interface QueryBuilderSnapshot {
  template: QueryTemplate
  view: ViewConfig
}

export interface QueryHistoryEntry {
  id: string
  templateName: string
  summary: string
  executedAt: string
  snapshot: QueryBuilderSnapshot
}

export interface ResultRow {
  id: string
  content: string
  attrs: Record<string, string>
  [key: string]: unknown
}

export interface ResultSet {
  rows: ResultRow[]
  total: number
  executedAt: string
}

export interface CompiledQuery {
  sql: string
  meta: {
    selectedFields: FieldId[]
    groupBy?: FieldId
    aggregation?: QueryAggregation
  }
}
