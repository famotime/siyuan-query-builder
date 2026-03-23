import type { ComputedRef, Ref } from "vue"

import { AGGREGATE_VALUE_FIELD } from "@/core/query/catalog"
import type { FieldId, QueryBuilderSnapshot, ViewConfig } from "@/core/query/types"

import { makeFilter, normalizeCustomField } from "./shared"

interface QueryBuilderDraftActionsOptions {
  draft: QueryBuilderSnapshot
  customFieldName: Ref<string>
  resultFields: ComputedRef<FieldId[]>
  recordViewSwitch: (type: ViewConfig["type"]) => void
  syncAggregateTemplate: (template: QueryBuilderSnapshot["template"], resultFields: FieldId[]) => void
}

export function createQueryBuilderDraftActions(options: QueryBuilderDraftActionsOptions) {
  const {
    draft,
    customFieldName,
    resultFields,
    recordViewSwitch,
    syncAggregateTemplate,
  } = options

  function setViewType(type: QueryBuilderSnapshot["view"]["type"]) {
    if (draft.view.type === type) {
      return
    }
    draft.view.type = type
    draft.template.viewType = type
    recordViewSwitch(type)
  }

  function addFilter() {
    draft.template.filters.push(makeFilter())
  }

  function removeFilter(filterId: string) {
    draft.template.filters = draft.template.filters.filter(filter => filter.id !== filterId)
    if (draft.template.filters[0]) {
      draft.template.filters[0].condition = "and"
    }
  }

  function moveFilter(filterId: string, targetFilterId: string, placement: "before" | "after" = "before") {
    if (filterId === targetFilterId) {
      return
    }

    const currentIndex = draft.template.filters.findIndex(filter => filter.id === filterId)
    const targetIndex = draft.template.filters.findIndex(filter => filter.id === targetFilterId)

    if (currentIndex < 0 || targetIndex < 0) {
      return
    }

    const nextFilters = [...draft.template.filters]
    const [movedFilter] = nextFilters.splice(currentIndex, 1)
    if (!movedFilter) {
      return
    }

    const adjustedTargetIndex = nextFilters.findIndex(filter => filter.id === targetFilterId)
    if (adjustedTargetIndex < 0) {
      return
    }

    nextFilters.splice(placement === "after" ? adjustedTargetIndex + 1 : adjustedTargetIndex, 0, movedFilter)

    draft.template.filters = nextFilters.map((filter, index) => ({
      ...filter,
      condition: index === 0 ? "and" : filter.condition || "and",
    }))
  }

  function addSort() {
    draft.template.sorts.push({
      field: draft.template.aggregation ? AGGREGATE_VALUE_FIELD : "updated",
      direction: "desc",
    })
  }

  function removeSort(index: number) {
    draft.template.sorts.splice(index, 1)
  }

  function toggleField(field: string) {
    if (draft.template.aggregation) {
      return
    }
    if (draft.template.fields.includes(field)) {
      draft.template.fields = draft.template.fields.filter(item => item !== field)
      return
    }
    draft.template.fields.push(field)
  }

  function addCustomField() {
    if (draft.template.aggregation) {
      return
    }
    const field = normalizeCustomField(customFieldName.value)
    if (field && !draft.template.fields.includes(field)) {
      draft.template.fields.push(field)
      syncAggregateTemplate(draft.template, resultFields.value)
    }
    customFieldName.value = ""
  }

  return {
    addCustomField,
    addFilter,
    addSort,
    moveFilter,
    removeFilter,
    removeSort,
    setViewType,
    toggleField,
  }
}
