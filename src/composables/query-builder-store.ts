import { computed, inject, proxyRefs, reactive, ref, toRaw, watch } from "vue"
import type { InjectionKey } from "vue"
import { showMessage } from "siyuan"

import { getBlockByID, lsNotebooks } from "@/api"
import {
  createEmbedTargetPreview,
  formatEmbedTargetHint,
  getActiveDocumentTarget,
  getOpenDocumentTargets,
  isLikelyBlockId,
  normalizeRecentEmbedTargetIds,
  summarizeBlockLabel,
  type ActiveDocumentTarget,
  type EmbedTargetPreview,
} from "@/core/embed-target"
import {
  AGGREGATE_VALUE_FIELD,
  TAG_COUNT_FIELD,
  cloneSnapshot,
  createDefaultViewConfig,
  createEmptyTemplate,
  createFieldOptions,
  createId,
  createPresets,
} from "@/core/query/catalog"
import { buildQuery } from "@/core/query/compiler"
import { validateSnapshot } from "@/core/query/validation"
import type {
  FieldMappings,
  FilterOperator,
  QueryBuilderSnapshot,
  QueryFilter,
  ResultRow,
  ViewConfig,
} from "@/core/query/types"
import { kernelAdapter } from "@/core/runtime/kernel-adapter"
import { createQueryRuntime } from "@/core/runtime/query-runtime"
import { createQueryTemplateStore } from "@/core/storage/query-template-store"
import { createTemplateStore } from "@/core/storage/template-store"
import { createViewConfigStore } from "@/core/storage/view-config-store"
import { buildBoardColumns } from "@/core/view/board"
import { buildCardsSummary, buildListItems } from "@/inline/view-models"
import { usePlugin } from "@/main"

type EditableField = keyof FieldMappings
const EMBED_TARGET_PREFS_KEY = "query-builder.embed-target.v1"

interface EmbedTargetPrefs {
  lastParentId?: string
  recentParentIds?: string[]
}

function createDraft(): QueryBuilderSnapshot {
  const template = createEmptyTemplate()
  return {
    template,
    view: createDefaultViewConfig(template.id),
  }
}

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
  const templateStore = createTemplateStore(plugin)
  const queryTemplateStore = createQueryTemplateStore(plugin)
  const viewConfigStore = createViewConfigStore(plugin)
  const runtime = createQueryRuntime(kernelAdapter)

  const draft = reactive<QueryBuilderSnapshot>(createDraft())
  const notebooks = ref<Notebook[]>([])
  const savedTemplates = ref<QueryBuilderSnapshot[]>([])
  const savedViews = ref<ViewConfig[]>([])
  const resultSet = ref<{ rows: ResultRow[], total: number, executedAt: string } | null>(null)
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
  const recentEmbedTargetIds = ref<string[]>([])
  const recentEmbedTargets = ref<EmbedTargetPreview[]>([])
  const draggingRowId = ref("")
  let embedTargetResolveToken = 0

  const mappingKeys: EditableField[] = ["status", "dueDate", "priority", "project", "owner"]
  const mappingLabels: Record<EditableField, string> = {
    status: "状态属性名",
    dueDate: "日期属性名",
    priority: "优先级属性名",
    project: "项目属性名",
    owner: "负责人属性名",
  }

  const presets = computed(() => createPresets(draft.view.fieldMappings))
  const fieldOptions = computed(() => createFieldOptions(draft.view.fieldMappings))
  const selectableFieldOptions = computed(() => fieldOptions.value.filter(option => option.value !== AGGREGATE_VALUE_FIELD))
  const sortFieldOptions = computed(() => fieldOptions.value.filter(option => option.value !== AGGREGATE_VALUE_FIELD || Boolean(draft.template.aggregation)))
  const statisticalFieldOptions = computed(() => fieldOptions.value.filter(option => option.value === TAG_COUNT_FIELD))
  const resultFields = computed(() => {
    if (!draft.template.aggregation) {
      return draft.template.fields
    }

    return [
      ...(draft.template.groupBy ? [draft.template.groupBy] : []),
      AGGREGATE_VALUE_FIELD,
    ]
  })
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
      syncAggregateFields()
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
      syncAggregateFields()
    },
  })
  const aggregationFunctionProxy = computed({
    get: () => draft.template.aggregation?.function || "count",
    set: (value: "count" | "sum" | "avg" | "min" | "max") => {
      draft.template.aggregation = {
        function: value,
        field: value === "count" ? undefined : (draft.template.aggregation?.field || TAG_COUNT_FIELD),
      }
      syncAggregateFields()
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
    get: () => String(draft.template.limit ?? 200),
    set: (value: string) => {
      const normalized = Math.trunc(Number(value))
      draft.template.limit = Number.isFinite(normalized) && normalized > 0 ? normalized : 200
    },
  })
  const resultSummary = computed(() => {
    if (!resultSet.value) {
      return "还没有执行查询。"
    }
    const viewNameMap = {
      table: "表格",
      board: "看板",
      list: "列表",
      cards: "统计卡片",
    }
    if (draft.template.aggregation) {
      return `最近一次运行返回 ${resultSet.value.total} 组统计结果，当前为${viewNameMap[draft.view.type]}视图。`
    }
    return `最近一次运行返回 ${resultSet.value.total} 条结果，当前为${viewNameMap[draft.view.type]}视图。`
  })
  const validationIssues = computed(() => validateSnapshot(createSnapshot()))
  const blockingValidationIssues = computed(() => validationIssues.value.filter(issue => issue.level === "error"))
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

  function makeFilter(field = "content", operator: FilterOperator = "contains"): QueryFilter {
    return {
      id: createId("filter"),
      field,
      operator,
      value: "",
    }
  }

  function fieldLabel(field: string) {
    return fieldOptions.value.find(option => option.value === field)?.label || field
  }

  function setViewType(type: QueryBuilderSnapshot["view"]["type"]) {
    draft.view.type = type
    draft.template.viewType = type
  }

  function syncAggregateFields() {
    if (!draft.template.aggregation) {
      return
    }

    draft.template.fields = resultFields.value
    const allowedSortFields = new Set([
      AGGREGATE_VALUE_FIELD,
      ...(draft.template.groupBy ? [draft.template.groupBy] : []),
    ])
    const nextSorts = draft.template.sorts.filter(sort => allowedSortFields.has(sort.field))

    draft.template.sorts = nextSorts.length
      ? nextSorts
      : [
          {
            field: AGGREGATE_VALUE_FIELD,
            direction: "desc",
          },
        ]
  }

  function requiresValue(operator: FilterOperator) {
    return !["empty", "not_empty"].includes(operator)
  }

  function dateRangeValue(filter: QueryFilter, index: 0 | 1) {
    return Array.isArray(filter.value) ? filter.value[index] || "" : ""
  }

  function updateDateRange(filter: QueryFilter, index: 0 | 1, value: string) {
    const range = Array.isArray(filter.value) ? [...filter.value] : ["", ""]
    range[index] = value
    filter.value = range
  }

  function addFilter() {
    draft.template.filters.push(makeFilter())
  }

  function removeFilter(filterId: string) {
    draft.template.filters = draft.template.filters.filter(filter => filter.id !== filterId)
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
    const value = customFieldName.value.trim()
    if (!value) {
      return
    }
    const field = value.startsWith("attr:") ? value : `attr:${value}`
    if (!draft.template.fields.includes(field)) {
      draft.template.fields.push(field)
    }
    customFieldName.value = ""
  }

  function createSnapshot() {
    return cloneSnapshot({
      template: toRaw(draft.template),
      view: toRaw(draft.view),
    })
  }

  function applySnapshot(snapshot: QueryBuilderSnapshot) {
    const next = cloneSnapshot(snapshot)
    draft.template = next.template
    draft.view = next.view
    resultSet.value = null
    advancedSql.value = ""
    error.value = ""
    void refreshSavedViews(next.template.id)
  }

  function resetDraft() {
    const next = createDraft()
    draft.template = next.template
    draft.view = next.view
    resultSet.value = null
    advancedSql.value = ""
    error.value = ""
    savedViews.value = []
  }

  function displayValue(row: ResultRow, field: string) {
    if (field === AGGREGATE_VALUE_FIELD) {
      return String(row.agg_value ?? "")
    }
    if (field.startsWith("attr:")) {
      return row.attrs[field.slice("attr:".length)] || ""
    }
    return String(row[field] ?? "")
  }

  function editableField(field: string): EditableField | null {
    if (draft.template.aggregation) {
      return null
    }
    if (field === `attr:${draft.view.fieldMappings.status}`) {
      return "status"
    }
    if (field === `attr:${draft.view.fieldMappings.dueDate}`) {
      return "dueDate"
    }
    if (field === `attr:${draft.view.fieldMappings.priority}`) {
      return "priority"
    }
    return null
  }

  async function loadTemplates() {
    savedTemplates.value = await templateStore.list()
  }

  async function refreshSavedViews(templateId = draft.template.id) {
    if (!templateId) {
      savedViews.value = []
      return
    }
    savedViews.value = await viewConfigStore.listByTemplate(templateId)
  }

  async function runQuery() {
    error.value = ""
    if (blockingValidationIssues.value.length) {
      error.value = blockingValidationIssues.value.map(issue => issue.message).join("；")
      showMessage(error.value, 5000, "error")
      return
    }
    loading.value = true
    try {
      const compiled = buildQuery(draft.template)
      advancedSql.value = compiled.sql
      resultSet.value = await runtime.execute(compiled)
      showMessage(`查询完成：${resultSet.value.total} 条结果`, 3500, "info")
    } catch (runtimeError) {
      error.value = runtimeError instanceof Error ? runtimeError.message : "查询失败"
      showMessage(error.value, 5000, "error")
    } finally {
      loading.value = false
    }
  }

  async function saveTemplate() {
    saving.value = true
    try {
      draft.template.viewType = draft.view.type
      draft.view.queryTemplateId = draft.template.id
      await templateStore.save(createSnapshot())
      await loadTemplates()
      await refreshSavedViews(draft.template.id)
      showMessage(`已保存模板：${draft.template.name}`, 3500, "info")
    } catch (saveError) {
      showMessage(saveError instanceof Error ? saveError.message : "保存失败", 5000, "error")
    } finally {
      saving.value = false
    }
  }

  async function deleteTemplate(templateId: string) {
    try {
      await templateStore.remove(templateId)
      await loadTemplates()
      await refreshSavedViews(draft.template.id)
      showMessage("已删除模板", 3000, "info")
    } catch (deleteError) {
      showMessage(deleteError instanceof Error ? deleteError.message : "删除模板失败", 5000, "error")
    }
  }

  async function quickEdit(rowId: string, field: EditableField, value: string) {
    try {
      await runtime.updateField(rowId, field, value, draft.view.fieldMappings)
      const row = resultSet.value?.rows.find(item => item.id === rowId)
      if (row) {
        row.attrs[draft.view.fieldMappings[field]] = value
      }
      showMessage("已回写原始块属性", 2500, "info")
    } catch (editError) {
      showMessage(editError instanceof Error ? editError.message : "写回失败", 5000, "error")
    }
  }

  async function insertEmbed() {
    if (!embedParentId.value.trim()) {
      showMessage("请输入父块或文档 ID", 4000, "error")
      return
    }
    try {
      draft.view.queryTemplateId = draft.template.id
      await templateStore.save(createSnapshot())
      await loadTemplates()
      await runtime.insertEmbedBlock({
        parentID: embedParentId.value.trim(),
        templateId: draft.template.id,
        title: draft.template.name,
        viewType: draft.view.type,
      })
      await rememberEmbedTarget(embedParentId.value)
      showMessage("已插入嵌入描述块", 3500, "info")
    } catch (insertError) {
      showMessage(insertError instanceof Error ? insertError.message : "插入嵌入块失败", 5000, "error")
    }
  }

  function openBlock(blockId: string) {
    window.open(`siyuan://blocks/${blockId}`)
  }

  function canOpenRow(row: ResultRow) {
    return !draft.template.aggregation && isLikelyBlockId(row.id)
  }

  async function dropToColumn(columnId: string) {
    if (!draggingRowId.value) {
      return
    }
    if (draft.template.groupBy !== `attr:${draft.view.fieldMappings.status}`) {
      showMessage("只有按状态分组时才支持拖拽回写", 3500, "error")
      draggingRowId.value = ""
      return
    }
    await quickEdit(draggingRowId.value, "status", columnId === "__ungrouped__" ? "" : columnId)
    draggingRowId.value = ""
  }

  async function refreshCurrentDocumentTarget() {
    const targets = getOpenDocumentTargets(window)
    openDocumentTargets.value = await Promise.all(targets.map(resolveDocumentTarget))
    currentDocumentTarget.value = openDocumentTargets.value[0] || null
  }

  async function resolveDocumentTarget(target: ActiveDocumentTarget) {
    if (target.title !== target.id) {
      return target
    }

    try {
      const block = await getBlockByID(target.id)
      return {
        id: target.id,
        title: summarizeBlockLabel(String(block?.content || block?.name || target.id), 40) || target.id,
      } satisfies ActiveDocumentTarget
    } catch {
      return target
    }
  }

  async function lookupEmbedTargetPreview(id: string) {
    if (!isLikelyBlockId(id)) {
      return null
    }

    try {
      const block = await getBlockByID(id)
      return createEmbedTargetPreview(block, id)
    } catch {
      return null
    }
  }

  async function refreshRecentEmbedTargets(ids = recentEmbedTargetIds.value) {
    const normalized = normalizeRecentEmbedTargetIds(ids)
    recentEmbedTargetIds.value = normalized
    recentEmbedTargets.value = await Promise.all(normalized.map(async (id) => {
      const preview = await lookupEmbedTargetPreview(id)
      if (preview) {
        return preview
      }
      return {
        id,
        type: "block",
        title: id,
        content: "未找到对应块或文档",
      } satisfies EmbedTargetPreview
    }))
  }

  async function initialize() {
    const notebookResult = await lsNotebooks()
    notebooks.value = notebookResult?.notebooks || []
    await refreshCurrentDocumentTarget()
    const prefs = await plugin.loadData(EMBED_TARGET_PREFS_KEY) as EmbedTargetPrefs | null
    embedParentId.value = typeof prefs?.lastParentId === "string" ? prefs.lastParentId : ""
    recentEmbedTargetIds.value = normalizeRecentEmbedTargetIds(prefs?.recentParentIds || [])
    await loadTemplates()
    await refreshSavedViews(draft.template.id)
    await refreshRecentEmbedTargets(recentEmbedTargetIds.value)
    await resolveEmbedTargetPreview(embedParentId.value)
  }

  async function persistEmbedTargetPrefs() {
    await plugin.saveData(EMBED_TARGET_PREFS_KEY, {
      lastParentId: embedParentId.value.trim(),
      recentParentIds: recentEmbedTargetIds.value,
    })
  }

  async function rememberEmbedTarget(value: string) {
    const id = value.trim()
    const next = normalizeRecentEmbedTargetIds([id, ...recentEmbedTargetIds.value])
    const changed = next.join("|") !== recentEmbedTargetIds.value.join("|")
    recentEmbedTargetIds.value = next
    await persistEmbedTargetPrefs()
    if (changed) {
      await refreshRecentEmbedTargets(next)
    }
  }

  async function resolveEmbedTargetPreview(value: string) {
    const id = value.trim()
    const token = ++embedTargetResolveToken
    embedTargetPreview.value = null

    if (!id) {
      embedTargetHint.value = currentDocumentTarget.value
        ? `当前文档：${currentDocumentTarget.value.title}`
        : "可输入父块或文档 ID，或下拉选择当前打开文档"
      return
    }

    if (!isLikelyBlockId(id)) {
      embedTargetHint.value = "输入完整 ID 后显示文档标题或块内容"
      return
    }

    try {
      const preview = await lookupEmbedTargetPreview(id)
      if (token !== embedTargetResolveToken || embedParentId.value.trim() !== id) {
        return
      }

      if (!preview) {
        embedTargetHint.value = "未找到该 ID 对应的块或文档"
        return
      }

      embedTargetPreview.value = preview
      embedTargetHint.value = formatEmbedTargetHint(preview)
    } catch {
      if (token !== embedTargetResolveToken || embedParentId.value.trim() !== id) {
        return
      }
      embedTargetHint.value = "未找到该 ID 对应的块或文档"
    }
  }

  async function selectEmbedTarget(targetId: string) {
    const id = targetId.trim()
    if (!id) {
      return false
    }
    embedParentId.value = id
    await rememberEmbedTarget(id)
    return true
  }

  async function selectCurrentDocumentTarget() {
    await refreshCurrentDocumentTarget()
    if (!currentDocumentTarget.value) {
      showMessage("未找到当前打开的文档", 3500, "error")
      return false
    }
    await selectEmbedTarget(currentDocumentTarget.value.id)
    return true
  }

  async function saveViewAs() {
    try {
      const snapshot = createSnapshot()
      snapshot.template.viewType = snapshot.view.type
      await queryTemplateStore.save(snapshot.template)
      const nextView = {
        ...snapshot.view,
        id: createId("view"),
        queryTemplateId: snapshot.template.id,
        defaultView: false,
        type: snapshot.view.type,
      } satisfies ViewConfig
      await viewConfigStore.save(nextView)
      draft.view = nextView
      draft.template.viewType = nextView.type
      await refreshSavedViews(draft.template.id)
      await loadTemplates()
      showMessage("已另存当前视图", 3000, "info")
      return true
    } catch (saveError) {
      showMessage(saveError instanceof Error ? saveError.message : "另存视图失败", 5000, "error")
      return false
    }
  }

  async function loadSavedView(viewId: string) {
    const view = savedViews.value.find(item => item.id === viewId)
    if (!view) {
      return false
    }
    draft.view = cloneSnapshot({
      template: toRaw(draft.template),
      view,
    }).view
    draft.template.viewType = view.type
    resultSet.value = null
    return true
  }

  async function setDefaultSavedView(viewId: string) {
    const view = savedViews.value.find(item => item.id === viewId)
    if (!view) {
      return false
    }
    try {
      await viewConfigStore.save({
        ...view,
        defaultView: true,
      })
      if (draft.view.id === viewId) {
        draft.view.defaultView = true
      }
      await refreshSavedViews(draft.template.id)
      await loadTemplates()
      showMessage("已更新默认视图", 3000, "info")
      return true
    } catch (saveError) {
      showMessage(saveError instanceof Error ? saveError.message : "设置默认视图失败", 5000, "error")
      return false
    }
  }

  async function deleteSavedView(viewId: string) {
    if (savedViews.value.length <= 1) {
      showMessage("至少保留一个视图配置", 3500, "error")
      return false
    }
    try {
      await viewConfigStore.remove(viewId)
      await refreshSavedViews(draft.template.id)
      await loadTemplates()

      if (draft.view.id === viewId) {
        const replacement = savedViews.value.find(item => item.defaultView) || savedViews.value[0]
        if (replacement) {
          draft.view = cloneSnapshot({
            template: toRaw(draft.template),
            view: replacement,
          }).view
          draft.template.viewType = replacement.type
          resultSet.value = null
        }
      }

      showMessage("已删除视图配置", 3000, "info")
      return true
    } catch (deleteError) {
      showMessage(deleteError instanceof Error ? deleteError.message : "删除视图配置失败", 5000, "error")
      return false
    }
  }

  watch(embedParentId, async value => {
    await persistEmbedTargetPrefs()
    await resolveEmbedTargetPreview(value)
  })

  return proxyRefs({
    advancedMode,
    advancedSql,
    addCustomField,
    addFilter,
    addSort,
    applySnapshot,
    boardDragCapability,
    boardColumns,
    cardsSummary,
    customFieldName,
    dateRangeValue,
    deleteSavedView,
    displayValue,
    draft,
    draggingRowId,
    dropToColumn,
    editableField,
    embedParentId,
    embedTargetHint,
    embedTargetPreview,
    error,
    fieldLabel,
    fieldOptions,
    selectableFieldOptions,
    sortFieldOptions,
    statisticalFieldOptions,
    validationIssues,
    groupByProxy,
    aggregationEnabled,
    aggregationFunctionProxy,
    aggregationFieldProxy,
    initialize,
    insertEmbed,
    limitProxy,
    loading,
    listItems,
    mappingKeys,
    mappingLabels,
    notebooks,
    currentDocumentTarget,
    deleteTemplate,
    loadSavedView,
    openBlock,
    openDocumentTargets,
    presets,
    quickEdit,
    recentEmbedTargets,
    refreshCurrentDocumentTarget,
    refreshSavedViews,
    removeFilter,
    removeSort,
    requiresValue,
    resultFields,
    resetDraft,
    resultSet,
    resultSummary,
    runQuery,
    saveTemplate,
    saveViewAs,
    setViewType,
    setDefaultSavedView,
    selectCurrentDocumentTarget,
    savedTemplates,
    savedViews,
    saving,
    selectEmbedTarget,
    scopeLabel,
    scopePlaceholder,
    toggleField,
    updateDateRange,
    canOpenRow,
  })
}
