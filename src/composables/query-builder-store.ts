import { inject, proxyRefs, reactive, ref, watch } from "vue"
import type { InjectionKey } from "vue"

import type { ActiveDocumentTarget, EmbedTargetPreview } from "@/core/embed-target"
import { cloneSnapshot } from "@/core/query/catalog"
import type { QueryBuilderSnapshot, QueryHistoryEntry, ResultSet, SavedTemplateSummary, ViewConfig } from "@/core/query/types"
import { kernelAdapter } from "@/core/runtime/kernel-adapter"
import { createQueryRuntime } from "@/core/runtime/query-runtime"
import { createMetricsStore } from "@/core/storage/metrics-store"
import { createQueryHistoryStore } from "@/core/storage/query-history-store"
import { SCENARIO_DASHBOARDS, getDashboardDefinition } from "@/core/dashboard/catalog"
import { executeDashboard } from "@/core/dashboard/runtime"
import type { DashboardViewModel } from "@/core/dashboard/types"
import { usePlugin } from "@/main"
import { createI18nHelper } from "@/utils/i18n"

import { createQueryBuilderDraftActions } from "./query-builder-store/draft-actions"
import { createEmbedTargetController } from "./query-builder-store/embed-target-controller"
import { createQueryExecutionController } from "./query-builder-store/query-execution-controller"
import { createQueryBuilderSelectors } from "./query-builder-store/selectors"
import { createQueryBuilderSessionController } from "./query-builder-store/session-controller"
import { createTemplateViewController } from "./query-builder-store/template-view-controller"
import {
  createDraft,
  dateRangeValue,
  mappingKeys,
  mappingLabels,
  requiresValue,
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
  const t = createI18nHelper(plugin)
  const metricsStore = createMetricsStore(plugin)
  const queryHistoryStore = createQueryHistoryStore(plugin)
  const runtime = createQueryRuntime(kernelAdapter)

  const draft = reactive<QueryBuilderSnapshot>(createDraft())
  const isDirty = ref(false)
  let cleanSnapshot = cloneSnapshot(draft)

  function markClean() {
    cleanSnapshot = cloneSnapshot(draft)
    isDirty.value = false
  }

  watch(
    draft,
    () => {
      isDirty.value = JSON.stringify(draft) !== JSON.stringify(cleanSnapshot)
    },
    { deep: true, flush: "sync" },
  )
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

  const templateViews = createTemplateViewController({
    plugin,
    draft,
    savedTemplateSummaries,
    savedViews,
    saving,
    resetResultState,
    recordMetric,
    markClean,
    t,
  })

  const embedTargets = createEmbedTargetController({
    plugin,
    embedParentId,
    embedTargetHint,
    embedTargetPreview,
    currentDocumentTarget,
    openDocumentTargets,
    recentEmbedTargets,
    t,
  })

  const selectors = createQueryBuilderSelectors({
    draft,
    notebooks,
    resultSet,
    t,
  })
  const session = createQueryBuilderSessionController({
    draft,
    notebooks,
    recentQueryHistory,
    queryHistoryStore,
    templateViews,
    embedTargets,
    resetResultState,
    t,
  })

  const queryExecution = createQueryExecutionController({
    draft,
    resultSet,
    loading,
    advancedSql,
    error,
    embedParentId,
    draggingRowId,
    blockingValidationIssues: selectors.blockingValidationIssues,
    runtime,
    recordMetric,
    rememberEmbedTarget: embedTargets.rememberEmbedTarget,
    rememberQueryHistory: session.rememberQueryHistory,
    t,
  })
  const dashboards = ref(SCENARIO_DASHBOARDS)
  const activeDashboardId = ref<string | null>(null)
  const activeDashboardParams = reactive<Record<string, any>>({})
  const activeDashboardViewModel = ref<DashboardViewModel | null>(null)
  const activeDashboardLoading = ref(false)

  async function runActiveDashboard() {
    if (!activeDashboardId.value) return
    activeDashboardLoading.value = true
    try {
      const vm = await executeDashboard(activeDashboardId.value, activeDashboardParams, {
        kernelAdapter,
        fieldMappings: draft.view.fieldMappings,
      })
      activeDashboardViewModel.value = vm
    } catch (err) {
      console.error("[SQB] execute dashboard failed", err)
    } finally {
      activeDashboardLoading.value = false
    }
  }

  async function loadDashboard(id: string) {
    const def = getDashboardDefinition(id)
    if (!def) return
    activeDashboardId.value = id
    for (const k of Object.keys(activeDashboardParams)) {
      delete activeDashboardParams[k]
    }
    for (const p of def.parameters) {
      activeDashboardParams[p.id] = p.defaultValue
    }
    await runActiveDashboard()
  }

  function updateDashboardParam(key: string, val: any) {
    activeDashboardParams[key] = val
    void runActiveDashboard()
  }

  function closeDashboard() {
    activeDashboardId.value = null
    activeDashboardViewModel.value = null
  }

  async function saveDashboardAsTemplate() {
    if (!activeDashboardViewModel.value || !activeDashboardId.value) return
    const def = getDashboardDefinition(activeDashboardId.value)
    if (!def) return
    const sql = def.buildSql(activeDashboardParams, draft.view.fieldMappings)
    const sqlStr = typeof sql === "string" ? sql : sql[0]
    activeDashboardId.value = null
    activeDashboardViewModel.value = null
    advancedMode.value = true
    advancedSql.value = sqlStr
    draft.template.name = `${def.title} (定制)`
    draft.template.viewType = "dashboard"
    await templateViews.saveTemplate()
  }

  function applySnapshotWithDashboard(snapshot: QueryBuilderSnapshot) {
    closeDashboard()
    session.applySnapshot(snapshot)
  }

  async function loadTemplateWithDashboard(id: string) {
    closeDashboard()
    await templateViews.loadTemplate(id)
  }

  function resetDraftWithDashboard() {
    closeDashboard()
    templateViews.resetDraft()
  }

  const draftActions = createQueryBuilderDraftActions({
    draft,
    customFieldName,
    resultFields: selectors.resultFields,
    recordViewSwitch,
    syncAggregateTemplate,
  })

  return proxyRefs({
    dashboards,
    activeDashboardId,
    activeDashboardParams,
    activeDashboardViewModel,
    activeDashboardLoading,
    loadDashboard,
    runActiveDashboard,
    updateDashboardParam,
    closeDashboard,
    saveDashboardAsTemplate,
    advancedMode,
    advancedSql,
    addCustomField: draftActions.addCustomField,
    addFilter: draftActions.addFilter,
    addSort: draftActions.addSort,
    aggregationEnabled: selectors.aggregationEnabled,
    aggregationFieldProxy: selectors.aggregationFieldProxy,
    aggregationFunctionProxy: selectors.aggregationFunctionProxy,
    applySnapshot: applySnapshotWithDashboard,
    boardColumns: selectors.boardColumns,
    boardDragCapability: selectors.boardDragCapability,
    canOpenRow: queryExecution.canOpenRow,
    cardsSummary: selectors.cardsSummary,
    currentDocumentTarget,
    currentTemplateId: selectors.currentTemplateId,
    currentViewId: selectors.currentViewId,
    customFieldName,
    dateRangeValue,
    deleteSavedView: templateViews.deleteSavedView,
    deleteTemplate: templateViews.deleteTemplate,
    displayValue: selectors.displayValue,
    draft,
    draggingRowId,
    dropToColumn: queryExecution.dropToColumn,
    editableField: selectors.editableField,
    embedParentId,
    embedTargetHint,
    embedTargetPreview,
    error,
    exportTemplateBundle: templateViews.exportTemplateBundle,
    fieldLabel: selectors.fieldLabel,
    fieldOptions: selectors.fieldOptions,
    groupByProxy: selectors.groupByProxy,
    generateExampleDocument: session.generateExampleDocument,
    importTemplateBundle: templateViews.importTemplateBundle,
    initialize: session.initialize,
    insertEmbed: queryExecution.insertEmbed,
    isDirty,
    limitProxy: selectors.limitProxy,
    listItems: selectors.listItems,
    loading,
    loadSavedView: templateViews.loadSavedView,
    loadTemplate: loadTemplateWithDashboard,
    markClean,
    mappingKeys,
    mappingLabels,
    moveFilter: draftActions.moveFilter,
    notebooks,
    openBlock: queryExecution.openBlock,
    openDocumentTargets,
    presets: selectors.presets,
    quickEdit: queryExecution.quickEdit,
    recentEmbedTargets,
    recentQueryHistory,
    refreshCurrentDocumentTarget: embedTargets.refreshCurrentDocumentTarget,
    restoreQueryHistory: session.restoreQueryHistory,
    clearQueryHistory: session.clearQueryHistory,
    refreshSavedTemplateSummaries: templateViews.refreshSavedTemplateSummaries,
    refreshSavedViews: templateViews.refreshSavedViews,
    removeFilter: draftActions.removeFilter,
    removeSort: draftActions.removeSort,
    requiresValue,
    resultFields: selectors.resultFields,
    resultSet,
    resultSummary: selectors.resultSummary,
    resetDraft: resetDraftWithDashboard,
    runQuery: queryExecution.runQuery,
    saveTemplate: templateViews.saveTemplate,
    savedTemplateSummaries,
    savedViews,
    saving,
    saveViewAs: templateViews.saveViewAs,
    scopeLabel: selectors.scopeLabel,
    scopePlaceholder: selectors.scopePlaceholder,
    selectableFieldOptions: selectors.selectableFieldOptions,
    selectCurrentDocumentTarget: embedTargets.selectCurrentDocumentTarget,
    selectEmbedTarget: embedTargets.selectEmbedTarget,
    setDefaultSavedView: templateViews.setDefaultSavedView,
    setViewType: draftActions.setViewType,
    sortFieldOptions: selectors.sortFieldOptions,
    statisticalFieldOptions: selectors.statisticalFieldOptions,
    toggleField: draftActions.toggleField,
    updateDateRange,
    validationIssues: selectors.validationIssues,
    t,
  })
}
