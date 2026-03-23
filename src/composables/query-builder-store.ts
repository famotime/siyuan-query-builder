import { computed, inject, proxyRefs, reactive, ref } from "vue"
import type { InjectionKey } from "vue"

import { createDocWithMd, getChildBlocks, getNotebookConf, lsNotebooks, setBlockAttrs } from "@/api"
import {
  buildDailyNoteExamplePath,
  buildPresetExampleDocument,
  formatExampleDocumentTitle,
  pickExampleNotebookId,
} from "@/core/example-document"
import type { ActiveDocumentTarget, EmbedTargetPreview } from "@/core/embed-target"
import { AGGREGATE_VALUE_FIELD, NUMERIC_FIELD_IDS, TAG_COUNT_FIELD, createFieldOptions, createPresets } from "@/core/query/catalog"
import { validateSnapshot } from "@/core/query/validation"
import { showMessage } from "@/external/siyuan"
import type { QueryBuilderSnapshot, QueryHistoryEntry, ResultSet, SavedTemplateSummary, ViewConfig } from "@/core/query/types"
import { kernelAdapter } from "@/core/runtime/kernel-adapter"
import { createQueryRuntime } from "@/core/runtime/query-runtime"
import { createMetricsStore } from "@/core/storage/metrics-store"
import { createQueryHistoryStore } from "@/core/storage/query-history-store"
import { buildBoardColumns } from "@/core/view/board"
import { buildCardsSummary, buildListItems } from "@/inline/view-models"
import { usePlugin } from "@/main"

import { createEmbedTargetController } from "./query-builder-store/embed-target-controller"
import { createQueryExecutionController } from "./query-builder-store/query-execution-controller"
import { createTemplateViewController } from "./query-builder-store/template-view-controller"
import {
  createDraft,
  createSnapshot,
  dateRangeValue,
  defaultAggregationFieldResult,
  displayValue as formatDisplayValue,
  makeFilter,
  mappingKeys,
  mappingLabels,
  mergeFieldOptions,
  nextAggregationField,
  normalizeCustomField,
  requiresValue,
  resolveFieldLabel,
  resolveEditableField,
  syncAggregateTemplate,
  updateDateRange,
} from "./query-builder-store/shared"

export type QueryBuilderStore = ReturnType<typeof createQueryBuilderStore>
export const queryBuilderStoreKey: InjectionKey<QueryBuilderStore> = Symbol("query-builder-store")

export function useQueryBuilderStore() {
  const store = inject(queryBuilderStoreKey)
  if (!store) {
    throw new Error("Query builder store is not available")
  }
  return store
}

export function createQueryBuilderStore() {
  const plugin = usePlugin()
  const metricsStore = createMetricsStore(plugin)
  const queryHistoryStore = createQueryHistoryStore(plugin)
  const runtime = createQueryRuntime(kernelAdapter)

  const draft = reactive<QueryBuilderSnapshot>(createDraft())
  const notebooks = ref<Notebook[]>([])
  const recentQueryHistory = ref<QueryHistoryEntry[]>([])
  const savedTemplateSummaries = ref<SavedTemplateSummary[]>([])
  const savedViews = ref<ViewConfig[]>([])
  const resultSet = ref<ResultSet | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const advancedMode = ref(false)
  const advancedSql = ref("")
  const error = ref("")
  const customFieldName = ref("")
  const embedParentId = ref("")
  const embedTargetHint = ref("可输入父块或文档 ID，或下拉选择当前打开文档")
  const embedTargetPreview = ref<EmbedTargetPreview | null>(null)
  const currentDocumentTarget = ref<ActiveDocumentTarget | null>(null)
  const openDocumentTargets = ref<ActiveDocumentTarget[]>([])
  const recentEmbedTargets = ref<EmbedTargetPreview[]>([])
  const draggingRowId = ref("")

  function recordMetric(metric: "queryRuns" | "templateSaves" | "viewSaves" | "embedInsertions" | "quickEdits" | "boardDrags", amount = 1) {
    void metricsStore.increment(metric, amount).catch(() => { })
  }

  function recordViewSwitch(type: ViewConfig["type"]) {
    void metricsStore.incrementViewSwitch(type).catch(() => { })
  }

  function resetResultState() {
    resultSet.value = null
    advancedSql.value = ""
    error.value = ""
  }

  function historyScopeLabel(snapshot: QueryBuilderSnapshot) {
    switch (snapshot.template.scope.type) {
      case "notebook":
        return "笔记本"
      case "document":
        return "文档"
      case "block_type":
        return "块类型"
      case "tag":
        return "标签"
      case "attribute":
        return "属性"
      default:
        return "全部内容"
    }
  }

  function historyViewLabel(type: ViewConfig["type"]) {
    switch (type) {
      case "board":
        return "看板"
      case "list":
        return "列表"
      case "cards":
        return "统计卡片"
      default:
        return "表格"
    }
  }

  function buildQueryHistorySummary(snapshot: QueryBuilderSnapshot) {
    return `${historyScopeLabel(snapshot)} · ${snapshot.template.filters.length} 个条件 · ${historyViewLabel(snapshot.view.type)}`
  }

  async function refreshQueryHistory() {
    recentQueryHistory.value = await queryHistoryStore.list()
  }

  async function rememberQueryHistory(executedAt: string) {
    try {
      const snapshot = createSnapshot(draft)
      recentQueryHistory.value = await queryHistoryStore.prepend({
        id: `history-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        templateName: snapshot.template.name || "未命名查询",
        summary: buildQueryHistorySummary(snapshot),
        executedAt: executedAt || new Date().toISOString(),
        snapshot,
      })
    } catch {
      // Query history is best-effort and should not block successful query execution.
    }
  }

  const templateViews = createTemplateViewController({
    plugin,
    draft,
    savedTemplateSummaries,
    savedViews,
    saving,
    resetResultState,
    recordMetric,
  })

  const embedTargets = createEmbedTargetController({
    plugin,
    embedParentId,
    embedTargetHint,
    embedTargetPreview,
    currentDocumentTarget,
    openDocumentTargets,
    recentEmbedTargets,
  })

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
  const selectableFieldOptions = computed(() => fieldOptions.value.filter(option => option.value !== AGGREGATE_VALUE_FIELD))
  const sortFieldOptions = computed(() => fieldOptions.value.filter(option => option.value !== AGGREGATE_VALUE_FIELD || Boolean(draft.template.aggregation)))
  const statisticalFieldOptions = computed(() => fieldOptions.value.filter(option => NUMERIC_FIELD_IDS.includes(option.value)))
  const resultFields = computed(() => defaultAggregationFieldResult(draft.template))
  const boardColumns = computed(() => {
    if (!resultSet.value?.rows.length || !draft.template.groupBy) {
      return []
    }
    return buildBoardColumns(resultSet.value.rows, draft.template.groupBy)
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
    return buildCardsSummary(resultSet.value.rows, draft.template.groupBy || `attr:${draft.view.fieldMappings.status}`)
  })
  const listItems = computed(() => {
    if (!resultSet.value?.rows.length) {
      return []
    }
    return buildListItems(resultSet.value.rows, [
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

  const queryExecution = createQueryExecutionController({
    draft,
    resultSet,
    loading,
    advancedSql,
    error,
    embedParentId,
    draggingRowId,
    blockingValidationIssues,
    runtime,
    recordMetric,
    persistCurrentTemplateAndView: templateViews.persistCurrentTemplateAndView,
    refreshSavedTemplateSummaries: templateViews.refreshSavedTemplateSummaries,
    rememberEmbedTarget: embedTargets.rememberEmbedTarget,
    rememberQueryHistory,
  })

  function fieldLabel(field: string) {
    return resolveFieldLabel(field, {
      knownLabels: fieldOptionMap.value,
      fieldMappings: draft.view.fieldMappings,
    })
  }

  function displayValue(row: ResultSet["rows"][number], field: string) {
    return formatDisplayValue(row, field, {
      notebookNameById: notebookNameById.value,
    })
  }

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
    }
    customFieldName.value = ""
  }

  function applySnapshot(snapshot: QueryBuilderSnapshot) {
    templateViews.applyTemplateAndView(snapshot.template, snapshot.view)
    void templateViews.refreshSavedViews(snapshot.template.id)
  }

  async function restoreQueryHistory(entryId: string) {
    const entry = recentQueryHistory.value.find(item => item.id === entryId)
    if (!entry) {
      return false
    }
    applySnapshot(entry.snapshot)
    return true
  }

  function editableField(field: string) {
    return resolveEditableField(draft.template, draft.view, field)
  }

  async function initialize() {
    const notebookResult = await lsNotebooks()
    notebooks.value = notebookResult?.notebooks || []
    await embedTargets.initializeEmbedTargets()
    await refreshQueryHistory()
    await templateViews.refreshSavedTemplateSummaries()
    await templateViews.refreshSavedViews(draft.template.id)
  }

  async function generateExampleDocument() {
    try {
      if (!notebooks.value.length) {
        const notebookResult = await lsNotebooks()
        notebooks.value = notebookResult?.notebooks || []
      }

      const notebookId = pickExampleNotebookId(notebooks.value, draft.template.scope)
      if (!notebookId) {
        showMessage("未找到可用笔记本", 4000, "error")
        return false
      }

      const notebookConf = await getNotebookConf(notebookId)
      const now = new Date()
      const title = formatExampleDocumentTitle(now)
      const path = buildDailyNoteExamplePath(notebookConf?.dailyNoteSavePath, now)
      const example = buildPresetExampleDocument(now, draft.view.fieldMappings)

      const documentId = await createDocWithMd(notebookId, path, example.markdown)
      const childBlocks = await getChildBlocks(documentId)
      const paragraphBlocks = childBlocks.filter(block => block.type === "p")

      await Promise.all(paragraphBlocks.map((block, index) => {
        const attrs = example.blockAttrs[index]
        if (!attrs || !block.id) {
          return Promise.resolve()
        }
        return setBlockAttrs(block.id, attrs)
      }))
      showMessage(`已生成预设示例文档：${title}`, 3500, "info")
      return true
    } catch (generationError) {
      showMessage(generationError instanceof Error ? generationError.message : "生成示例文档失败", 5000, "error")
      return false
    }
  }

  return proxyRefs({
    advancedMode,
    advancedSql,
    addCustomField,
    addFilter,
    addSort,
    aggregationEnabled,
    aggregationFieldProxy,
    aggregationFunctionProxy,
    applySnapshot,
    boardColumns,
    boardDragCapability,
    canOpenRow: queryExecution.canOpenRow,
    cardsSummary,
    currentDocumentTarget,
    currentTemplateId,
    currentViewId,
    customFieldName,
    dateRangeValue,
    deleteSavedView: templateViews.deleteSavedView,
    deleteTemplate: templateViews.deleteTemplate,
    displayValue,
    draft,
    draggingRowId,
    dropToColumn: queryExecution.dropToColumn,
    editableField,
    embedParentId,
    embedTargetHint,
    embedTargetPreview,
    error,
    exportTemplateBundle: templateViews.exportTemplateBundle,
    fieldLabel,
    fieldOptions,
    groupByProxy,
    generateExampleDocument,
    importTemplateBundle: templateViews.importTemplateBundle,
    initialize,
    insertEmbed: queryExecution.insertEmbed,
    limitProxy,
    listItems,
    loading,
    loadSavedView: templateViews.loadSavedView,
    loadTemplate: templateViews.loadTemplate,
    mappingKeys,
    mappingLabels,
    moveFilter,
    notebooks,
    openBlock: queryExecution.openBlock,
    openDocumentTargets,
    presets,
    quickEdit: queryExecution.quickEdit,
    recentEmbedTargets,
    recentQueryHistory,
    refreshCurrentDocumentTarget: embedTargets.refreshCurrentDocumentTarget,
    restoreQueryHistory,
    refreshSavedTemplateSummaries: templateViews.refreshSavedTemplateSummaries,
    refreshSavedViews: templateViews.refreshSavedViews,
    removeFilter,
    removeSort,
    requiresValue,
    resultFields,
    resultSet,
    resultSummary,
    resetDraft: templateViews.resetDraft,
    runQuery: queryExecution.runQuery,
    saveTemplate: templateViews.saveTemplate,
    savedTemplateSummaries,
    savedViews,
    saving,
    saveViewAs: templateViews.saveViewAs,
    scopeLabel,
    scopePlaceholder,
    selectableFieldOptions,
    selectCurrentDocumentTarget: embedTargets.selectCurrentDocumentTarget,
    selectEmbedTarget: embedTargets.selectEmbedTarget,
    setDefaultSavedView: templateViews.setDefaultSavedView,
    setViewType,
    sortFieldOptions,
    statisticalFieldOptions,
    toggleField,
    updateDateRange,
    validationIssues,
  })
}
