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
  cloneSnapshot,
  createDefaultViewConfig,
  createEmptyTemplate,
  createFieldOptions,
  createId,
  createPresets,
} from "@/core/query/catalog"
import { buildQuery } from "@/core/query/compiler"
import type {
  FieldMappings,
  FilterOperator,
  QueryBuilderSnapshot,
  QueryFilter,
  ResultRow,
} from "@/core/query/types"
import { kernelAdapter } from "@/core/runtime/kernel-adapter"
import { createQueryRuntime } from "@/core/runtime/query-runtime"
import { createTemplateStore } from "@/core/storage/template-store"
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
  const runtime = createQueryRuntime(kernelAdapter)

  const draft = reactive<QueryBuilderSnapshot>(createDraft())
  const notebooks = ref<Notebook[]>([])
  const savedTemplates = ref<QueryBuilderSnapshot[]>([])
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
  const boardColumns = computed(() => {
    if (!resultSet.value?.rows.length || !draft.template.groupBy) {
      return []
    }
    return buildBoardColumns(resultSet.value.rows, draft.template.groupBy)
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
    return `最近一次运行返回 ${resultSet.value.total} 条结果，当前为${viewNameMap[draft.view.type]}视图。`
  })
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
      field: "updated",
      direction: "desc",
    })
  }

  function removeSort(index: number) {
    draft.template.sorts.splice(index, 1)
  }

  function toggleField(field: string) {
    if (draft.template.fields.includes(field)) {
      draft.template.fields = draft.template.fields.filter(item => item !== field)
      return
    }
    draft.template.fields.push(field)
  }

  function addCustomField() {
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
  }

  function resetDraft() {
    const next = createDraft()
    draft.template = next.template
    draft.view = next.view
    resultSet.value = null
    advancedSql.value = ""
    error.value = ""
  }

  function displayValue(row: ResultRow, field: string) {
    if (field.startsWith("attr:")) {
      return row.attrs[field.slice("attr:".length)] || ""
    }
    return String(row[field] || "")
  }

  function editableField(field: string): EditableField | null {
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

  async function runQuery() {
    error.value = ""
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
      draft.view.queryTemplateId = draft.template.id
      await templateStore.save(createSnapshot())
      await loadTemplates()
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
    boardColumns,
    cardsSummary,
    customFieldName,
    dateRangeValue,
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
    groupByProxy,
    initialize,
    insertEmbed,
    loading,
    listItems,
    mappingKeys,
    mappingLabels,
    notebooks,
    currentDocumentTarget,
    deleteTemplate,
    openBlock,
    openDocumentTargets,
    presets,
    quickEdit,
    recentEmbedTargets,
    refreshCurrentDocumentTarget,
    removeFilter,
    removeSort,
    requiresValue,
    resetDraft,
    resultSet,
    resultSummary,
    runQuery,
    saveTemplate,
    selectCurrentDocumentTarget,
    savedTemplates,
    saving,
    selectEmbedTarget,
    scopeLabel,
    scopePlaceholder,
    toggleField,
    updateDateRange,
  })
}
