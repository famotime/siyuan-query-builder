import type { FieldOption } from "@/core/query/catalog"

import type {
  FieldId,
  FieldMappings,
  FilterOperator,
  QueryBuilderSnapshot,
  QueryFilter,
  QueryTemplate,
  ViewConfig,
} from "@/core/query/types"
import { toRaw } from "vue"
import {
  AGGREGATE_VALUE_FIELD,
  cloneSnapshot,
  createDefaultViewConfig,
  createEmptyTemplate,
  createId,

  TAG_COUNT_FIELD,
} from "@/core/query/catalog"

export type EditableField = keyof FieldMappings | `attr:${string}`

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

export type ScopeLabelVariant = "editor" | "history"

/**
 * 范围类型的展示文案。编辑器与历史摘要两处的措辞历史上略有差异,
 * 通过 variant 保持各自原语义。
 */
export function buildScopeLabel(
  scopeType: QueryBuilderSnapshot["template"]["scope"]["type"],
  variant: ScopeLabelVariant,
) {
  switch (scopeType) {
    case "notebook":
      return "笔记本"
    case "document":
      return variant === "editor" ? "文档 ID" : "文档"
    case "block_type":
      return "块类型"
    case "tag":
      return "标签"
    case "attribute":
      return variant === "editor" ? "属性键" : "属性"
    default:
      return variant === "editor" ? "范围值" : "全部内容"
  }
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
  const seen = new Set(baseOptions.map((option) => option.value))
  const extraFields = new Set<string>([
    ...template.fields,
    ...template.filters.map((filter) => filter.field),
    ...template.sorts.map((sort) => sort.field),
    template.groupBy || "",
    template.aggregation?.field || "",
  ].filter(Boolean))

  return [
    ...baseOptions,
    ...Array.from(extraFields)
      .filter((field) => !seen.has(field))
      .map(createDynamicFieldOption),
  ]
}

export function makeFilter(field = "content", operator: FilterOperator = "contains"): QueryFilter {
  return {
    id: createId("filter"),
    field,
    operator,
    condition: "and",
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
  const nextSorts = template.sorts.filter((sort) => sort.direction === "random" || allowedSortFields.has(sort.field))

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
    sorts: template.sorts.map((sort) => ({ ...sort })),
    groupBy: template.groupBy || null,
    aggregation: template.aggregation ? { ...template.aggregation } : null,
  } satisfies ViewConfig

  return cloneSnapshot({
    template,
    view: nextView,
  })
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
  if (field.startsWith("attr:") && field.slice("attr:".length).trim()) {
    return field as EditableField
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
