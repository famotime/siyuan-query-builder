import { toRaw } from "vue"

import {
  AGGREGATE_VALUE_FIELD,
  TAG_COUNT_FIELD,
  cloneSnapshot,
  createId,
  createDefaultViewConfig,
  createEmptyTemplate,
  type FieldOption,
} from "@/core/query/catalog"
import type { FieldId, FieldMappings, FilterOperator, QueryBuilderSnapshot, QueryFilter, QueryTemplate, ResultRow, ViewConfig } from "@/core/query/types"

export type EditableField = keyof FieldMappings

export const EMBED_TARGET_PREFS_KEY = "query-builder.embed-target.v1"
export const mappingKeys: EditableField[] = ["status", "dueDate", "priority", "project", "owner"]
export const mappingLabels: Record<EditableField, string> = {
  status: "状态属性名",
  dueDate: "日期属性名",
  priority: "优先级属性名",
  project: "项目属性名",
  owner: "负责人属性名",
}

export interface EmbedTargetPrefs {
  lastParentId?: string
  recentParentIds?: string[]
}

export function createDraft(): QueryBuilderSnapshot {
  const template = createEmptyTemplate()
  return {
    template,
    view: createDefaultViewConfig(template.id, "table", template),
  }
}

function createDynamicFieldOption(field: string): FieldOption {
  if (field.startsWith("attr:")) {
    const attrName = field.slice("attr:".length)
    return {
      value: field,
      label: attrName,
      hint: attrName,
    }
  }

  return {
    value: field,
    label: field,
  }
}

export function mergeFieldOptions(baseOptions: FieldOption[], template: QueryTemplate): FieldOption[] {
  const seen = new Set(baseOptions.map(option => option.value))
  const extraFields = new Set<string>([
    ...template.fields,
    ...template.filters.map(filter => filter.field),
    ...template.sorts.map(sort => sort.field),
    template.groupBy || "",
    template.aggregation?.field || "",
  ].filter(Boolean))

  return [
    ...baseOptions,
    ...Array.from(extraFields)
      .filter(field => !seen.has(field))
      .map(createDynamicFieldOption),
  ]
}

export function makeFilter(field = "content", operator: FilterOperator = "contains"): QueryFilter {
  return {
    id: createId("filter"),
    field,
    operator,
    value: "",
  }
}

export function syncAggregateTemplate(template: QueryTemplate, resultFields: FieldId[]) {
  if (!template.aggregation) {
    return
  }

  template.fields = resultFields
  const allowedSortFields = new Set([
    AGGREGATE_VALUE_FIELD,
    ...(template.groupBy ? [template.groupBy] : []),
  ])
  const nextSorts = template.sorts.filter(sort => allowedSortFields.has(sort.field))

  template.sorts = nextSorts.length
    ? nextSorts
    : [
        {
          field: AGGREGATE_VALUE_FIELD,
          direction: "desc",
        },
      ]
}

export function requiresValue(operator: FilterOperator) {
  return !["empty", "not_empty"].includes(operator)
}

export function dateRangeValue(filter: QueryFilter, index: 0 | 1) {
  return Array.isArray(filter.value) ? filter.value[index] || "" : ""
}

export function updateDateRange(filter: QueryFilter, index: 0 | 1, value: string) {
  const range = Array.isArray(filter.value) ? [...filter.value] : ["", ""]
  range[index] = value
  filter.value = range
}

export function createSnapshot(draft: QueryBuilderSnapshot) {
  const template = toRaw(draft.template)
  const nextView = {
    ...toRaw(draft.view),
    type: template.viewType,
    fields: [...template.fields],
    sorts: template.sorts.map(sort => ({ ...sort })),
    groupBy: template.groupBy || null,
    aggregation: template.aggregation ? { ...template.aggregation } : null,
  } satisfies ViewConfig

  return cloneSnapshot({
    template,
    view: nextView,
  })
}

export function displayValue(row: ResultRow, field: string) {
  if (field === AGGREGATE_VALUE_FIELD) {
    return String(row.agg_value ?? "")
  }
  if (field.startsWith("attr:")) {
    return row.attrs[field.slice("attr:".length)] || ""
  }
  return String(row[field] ?? "")
}

export function resolveEditableField(template: QueryTemplate, view: ViewConfig, field: string): EditableField | null {
  if (template.aggregation) {
    return null
  }
  if (field === `attr:${view.fieldMappings.status}`) {
    return "status"
  }
  if (field === `attr:${view.fieldMappings.dueDate}`) {
    return "dueDate"
  }
  if (field === `attr:${view.fieldMappings.priority}`) {
    return "priority"
  }
  return null
}

export function normalizeCustomField(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }
  return trimmed.startsWith("attr:") ? trimmed : `attr:${trimmed}`
}

export function defaultAggregationFieldResult(template: QueryTemplate) {
  if (!template.aggregation) {
    return template.fields
  }

  return [
    ...(template.groupBy ? [template.groupBy] : []),
    AGGREGATE_VALUE_FIELD,
  ]
}

export function nextAggregationField(functionName: "count" | "sum" | "avg" | "min" | "max", currentField?: string) {
  return functionName === "count" ? undefined : (currentField || TAG_COUNT_FIELD)
}
