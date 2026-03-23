import { computed, type Ref } from "vue"

import { AGGREGATE_VALUE_FIELD, NUMERIC_FIELD_IDS, TAG_COUNT_FIELD, createFieldOptions, createPresets } from "@/core/query/catalog"
import type { QueryBuilderSnapshot, ResultSet } from "@/core/query/types"
import { validateSnapshot } from "@/core/query/validation"
import { createResultPresentation } from "@/core/view/presentation"

import {
  createSnapshot,
  defaultAggregationFieldResult,
  mergeFieldOptions,
  nextAggregationField,
  resolveEditableField,
  syncAggregateTemplate,
} from "./shared"

interface QueryBuilderSelectorsOptions {
  draft: QueryBuilderSnapshot
  notebooks: Ref<Notebook[]>
  resultSet: Ref<ResultSet | null>
}

export function createQueryBuilderSelectors(options: QueryBuilderSelectorsOptions) {
  const { draft, notebooks, resultSet } = options

  const presets = computed(() => createPresets(draft.view.fieldMappings))
  const fieldOptions = computed(() => mergeFieldOptions(
    createFieldOptions(draft.view.fieldMappings),
    draft.template,
  ))
  const fieldOptionMap = computed(() => new Map(
    fieldOptions.value.map(option => [option.value, option.label]),
  ))
  const notebookNameById = computed(() => Object.fromEntries(
    notebooks.value.map(notebook => [notebook.id, notebook.name]),
  ))
  const presentation = computed(() => createResultPresentation({
    fieldMappings: draft.view.fieldMappings,
    notebookNameById: notebookNameById.value,
  }))
  const selectableFieldOptions = computed(() => fieldOptions.value.filter(option => option.value !== AGGREGATE_VALUE_FIELD))
  const sortFieldOptions = computed(() => fieldOptions.value.filter(option => option.value !== AGGREGATE_VALUE_FIELD || Boolean(draft.template.aggregation)))
  const statisticalFieldOptions = computed(() => fieldOptions.value.filter(option => NUMERIC_FIELD_IDS.includes(option.value)))
  const resultFields = computed(() => defaultAggregationFieldResult(draft.template))
  const boardColumns = computed(() => {
    if (!resultSet.value?.rows.length || !draft.template.groupBy) {
      return []
    }
    return presentation.value.buildBoardColumns(resultSet.value.rows, draft.template.groupBy)
  })
  const boardDragCapability = computed(() => {
    if (draft.view.type !== "board") {
      return {
        enabled: false,
        reason: "",
      }
    }

    if (!draft.template.groupBy) {
      return {
        enabled: false,
        reason: "看板视图需要先设置分组字段。",
      }
    }

    if (draft.template.groupBy !== `attr:${draft.view.fieldMappings.status}`) {
      return {
        enabled: false,
        reason: "当前分组不支持拖拽回写，只有按状态分组时才能拖拽改状态。",
      }
    }

    return {
      enabled: true,
      reason: "",
    }
  })
  const cardsSummary = computed(() => {
    if (!resultSet.value?.rows.length) {
      return []
    }
    return presentation.value.buildCardsSummary(resultSet.value.rows, draft.template.groupBy || `attr:${draft.view.fieldMappings.status}`)
  })
  const listItems = computed(() => {
    if (!resultSet.value?.rows.length) {
      return []
    }
    return presentation.value.buildListItems(resultSet.value.rows, [
      `attr:${draft.view.fieldMappings.priority}`,
      `attr:${draft.view.fieldMappings.status}`,
      `attr:${draft.view.fieldMappings.dueDate}`,
    ])
  })
  const groupByProxy = computed({
    get: () => draft.template.groupBy || "",
    set: (value: string) => {
      draft.template.groupBy = value || undefined
      syncAggregateTemplate(draft.template, resultFields.value)
    },
  })
  const aggregationEnabled = computed({
    get: () => Boolean(draft.template.aggregation),
    set: (value: boolean) => {
      if (!value) {
        draft.template.aggregation = undefined
        return
      }

      draft.template.aggregation = {
        function: "count",
      }
      syncAggregateTemplate(draft.template, resultFields.value)
    },
  })
  const aggregationFunctionProxy = computed({
    get: () => draft.template.aggregation?.function || "count",
    set: (value: "count" | "sum" | "avg" | "min" | "max") => {
      draft.template.aggregation = {
        function: value,
        field: nextAggregationField(value, draft.template.aggregation?.field),
      }
      syncAggregateTemplate(draft.template, resultFields.value)
    },
  })
  const aggregationFieldProxy = computed({
    get: () => draft.template.aggregation?.field || TAG_COUNT_FIELD,
    set: (value: string) => {
      if (!draft.template.aggregation) {
        draft.template.aggregation = {
          function: "sum",
          field: value,
        }
      } else {
        draft.template.aggregation.field = value
      }
    },
  })
  const limitProxy = computed({
    get: () => String(draft.template.limit ?? 100),
    set: (value: string) => {
      const normalized = Math.trunc(Number(value))
      draft.template.limit = Number.isFinite(normalized) && normalized > 0 ? normalized : 100
    },
  })
  const resultSummary = computed(() => {
    if (!resultSet.value) {
      return "还没有执行查询。"
    }
    if (draft.template.aggregation) {
      return `返回 ${resultSet.value.total} 组统计结果`
    }
    return `返回 ${resultSet.value.total} 条结果`
  })
  const validationIssues = computed(() => validateSnapshot(createSnapshot(draft)))
  const blockingValidationIssues = computed(() => validationIssues.value.filter(issue => issue.level === "error"))
  const currentTemplateId = computed(() => draft.template.id)
  const currentViewId = computed(() => draft.view.id)
  const scopeLabel = computed(() => {
    switch (draft.template.scope.type) {
      case "notebook":
        return "笔记本"
      case "document":
        return "文档 ID"
      case "block_type":
        return "块类型"
      case "tag":
        return "标签"
      case "attribute":
        return "属性键"
      default:
        return "范围值"
    }
  })
  const scopePlaceholder = computed(() => {
    switch (draft.template.scope.type) {
      case "document":
        return "例如 20260322094501-abc1234"
      case "tag":
        return "例如 #project#"
      case "attribute":
        return "例如 status"
      default:
        return "输入范围值"
    }
  })

  function fieldLabel(field: string) {
    return presentation.value.fieldLabel(field)
  }

  function displayValue(row: ResultSet["rows"][number], field: string) {
    return presentation.value.displayValue(row, field)
  }

  function editableField(field: string) {
    return resolveEditableField(draft.template, draft.view, field)
  }

  return {
    aggregationEnabled,
    aggregationFieldProxy,
    aggregationFunctionProxy,
    blockingValidationIssues,
    boardColumns,
    boardDragCapability,
    cardsSummary,
    currentTemplateId,
    currentViewId,
    displayValue,
    editableField,
    fieldLabel,
    fieldOptions,
    groupByProxy,
    limitProxy,
    listItems,
    presets,
    resultFields,
    resultSummary,
    scopeLabel,
    scopePlaceholder,
    selectableFieldOptions,
    sortFieldOptions,
    statisticalFieldOptions,
    validationIssues,
  }
}
