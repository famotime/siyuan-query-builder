import { reactive, ref, watch } from "vue"

import type { QueryBuilderStore } from "@/composables/query-builder-store"
import type { FilterOperator, QueryFilter } from "@/core/query/types"

const COMMON_FILTER_OPERATORS: Array<{ value: FilterOperator, label: string }> = [
  { value: "eq", label: "等于" },
  { value: "neq", label: "不等于" },
  { value: "gt", label: "大于" },
  { value: "lt", label: "小于" },
  { value: "contains", label: "包含" },
  { value: "not_contains", label: "不包含" },
  { value: "empty", label: "为空" },
  { value: "not_empty", label: "非空" },
]
const DATE_COMPATIBLE_FILTER_OPERATORS: Array<{ value: FilterOperator, label: string }> = [
  { value: "eq", label: "等于" },
  { value: "neq", label: "不等于" },
  { value: "gt", label: "大于" },
  { value: "lt", label: "小于" },
  { value: "empty", label: "为空" },
  { value: "not_empty", label: "非空" },
]
const DATE_FILTER_OPERATORS: Array<{ value: FilterOperator, label: string }> = [
  { value: "date_between", label: "日期区间" },
  { value: "next_days", label: "未来 N 天" },
  { value: "last_days", label: "最近 N 天" },
]
const DATE_ONLY_OPERATORS = new Set<FilterOperator>(DATE_FILTER_OPERATORS.map(option => option.value))
const DATE_COMPATIBLE_OPERATOR_VALUES = new Set<FilterOperator>([
  ...DATE_COMPATIBLE_FILTER_OPERATORS.map(option => option.value),
  ...DATE_FILTER_OPERATORS.map(option => option.value),
])

export const mappingHints: Record<"status" | "dueDate" | "priority" | "project" | "owner", string> = {
  status: "预设值：Todo / Doing / Done",
  dueDate: "预设值：YYYY-MM-DD，例如 2026-03-23",
  priority: "预设值：P0 / P1 / P2 / P3",
  project: "示例：项目周报、知识库整理",
  owner: "示例：张三、Alice",
}

export function useQueryBuilderEditorState(store: QueryBuilderStore) {
  const collapsedSections = reactive({
    filters: false,
    mappings: true,
    scope: true,
    view: false,
  })
  const draggingFilterId = ref("")
  const dragOverFilterId = ref("")
  const dragOverPlacement = ref<"before" | "after" | "">("")

  function toggleSection(section: keyof typeof collapsedSections) {
    collapsedSections[section] = !collapsedSections[section]
  }

  function isDateField(field: string) {
    return field === "created"
      || field === "updated"
      || field === `attr:${store.draft.view.fieldMappings.dueDate}`
  }

  function filterOperatorOptions(field: string) {
    return isDateField(field)
      ? [...DATE_COMPATIBLE_FILTER_OPERATORS, ...DATE_FILTER_OPERATORS]
      : COMMON_FILTER_OPERATORS
  }

  function normalizeFilterOperator(filter: QueryFilter) {
    if (isDateField(filter.field) && !DATE_COMPATIBLE_OPERATOR_VALUES.has(filter.operator)) {
      filter.operator = "eq"
      filter.value = ""
      return
    }

    if (DATE_ONLY_OPERATORS.has(filter.operator) && !isDateField(filter.field)) {
      filter.operator = "contains"
      filter.value = ""
    }
  }

  function onFilterDragStart(filterId: string) {
    draggingFilterId.value = filterId
  }

  function displayFilterCondition(condition?: "and" | "or") {
    return condition === "or" ? "OR" : "AND"
  }

  function toggleFilterCondition(index: number) {
    const filter = store.draft.template.filters[index]
    if (!filter) {
      return
    }

    filter.condition = (filter.condition || "and") === "and" ? "or" : "and"
  }

  function onFilterDragOver(targetFilterId: string, event: DragEvent) {
    if (!draggingFilterId.value || draggingFilterId.value === targetFilterId) {
      dragOverFilterId.value = ""
      dragOverPlacement.value = ""
      return
    }

    const target = event.currentTarget as HTMLElement | null
    if (!target) {
      return
    }

    const rect = target.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2

    dragOverFilterId.value = targetFilterId
    dragOverPlacement.value = event.clientY <= midpoint ? "before" : "after"
  }

  function onFilterDrop(targetFilterId: string) {
    if (!draggingFilterId.value) {
      return
    }
    store.moveFilter(draggingFilterId.value, targetFilterId, dragOverPlacement.value || "before")
    clearFilterDrag()
  }

  function clearFilterDrag() {
    draggingFilterId.value = ""
    dragOverFilterId.value = ""
    dragOverPlacement.value = ""
  }

  watch(
    () => store.draft.template.filters.map(filter => `${filter.id}:${filter.field}:${filter.operator}`),
    () => {
      store.draft.template.filters.forEach(normalizeFilterOperator)
    },
    { immediate: true },
  )

  return {
    clearFilterDrag,
    collapsedSections,
    displayFilterCondition,
    draggingFilterId,
    dragOverFilterId,
    dragOverPlacement,
    filterOperatorOptions,
    normalizeFilterOperator,
    onFilterDragOver,
    onFilterDragStart,
    onFilterDrop,
    toggleFilterCondition,
    toggleSection,
  }
}
