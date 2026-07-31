import type { ComputedRef, Ref } from "vue"

import { buildQuery } from "@/core/query/compiler"
import type { QueryBuilderSnapshot, ResultRow, ResultSet } from "@/core/query/types"
import { showMessage } from "@/external/siyuan"
import type { I18nHelper } from "@/utils/i18n"

import { type EditableField } from "./shared"

interface QueryRuntime {
  execute: (compiled: ReturnType<typeof buildQuery>) => Promise<ResultSet>
  updateField: (rowId: string, field: EditableField, value: string, mappings: QueryBuilderSnapshot["view"]["fieldMappings"]) => Promise<void>
  insertEmbedBlock: (payload: {
    parentID: string
    templateId: string
    viewId?: string
    title: string
    viewType: QueryBuilderSnapshot["view"]["type"]
  }) => Promise<void>
}

interface ValidationIssue {
  level: "error" | "warning"
  message: string
}

interface QueryExecutionControllerOptions {
  draft: QueryBuilderSnapshot
  resultSet: Ref<ResultSet | null>
  loading: Ref<boolean>
  advancedSql: Ref<string>
  error: Ref<string>
  embedParentId: Ref<string>
  draggingRowId: Ref<string>
  blockingValidationIssues: ComputedRef<ValidationIssue[]>
  runtime: QueryRuntime
  recordMetric: (metric: "queryRuns" | "embedInsertions" | "quickEdits" | "boardDrags", amount?: number) => void
  persistCurrentTemplateAndView: () => Promise<QueryBuilderSnapshot>
  refreshSavedTemplateSummaries: () => Promise<void>
  rememberEmbedTarget: (value: string) => Promise<void>
  rememberQueryHistory: (executedAt: string) => Promise<void>
  t: I18nHelper
}

export function createQueryExecutionController(options: QueryExecutionControllerOptions) {
  const {
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
    persistCurrentTemplateAndView,
    refreshSavedTemplateSummaries,
    rememberEmbedTarget,
    rememberQueryHistory,
    t,
  } = options

  function resetResultState() {
    resultSet.value = null
    advancedSql.value = ""
    error.value = ""
  }

  async function runQuery() {
    error.value = ""
    if (blockingValidationIssues.value.length) {
      const message = blockingValidationIssues.value.map(issue => issue.message).join("；")
      error.value = message
      showMessage(t("queryValidationBlocked", { message }), 5000, "error")
      return
    }
    loading.value = true
    try {
      const compiled = buildQuery(draft.template)
      advancedSql.value = compiled.sql
      resultSet.value = await runtime.execute(compiled)
      await rememberQueryHistory(resultSet.value.executedAt)
      recordMetric("queryRuns")
    } catch (runtimeError) {
      error.value = runtimeError instanceof Error ? runtimeError.message : t("errorUnknown")
      showMessage(t("queryFailed", { error: error.value }), 5000, "error")
    } finally {
      loading.value = false
    }
  }

  async function quickEdit(rowId: string, field: EditableField, value: string) {
    try {
      await runtime.updateField(rowId, field, value, draft.view.fieldMappings)
      const row = resultSet.value?.rows.find(item => item.id === rowId)
      if (row) {
        const attrName = field.startsWith("attr:")
          ? field.slice("attr:".length).trim()
          : draft.view.fieldMappings[field]
        row.attrs[attrName] = value
      }
      recordMetric("quickEdits")
    } catch (editError) {
      showMessage(t("quickEditFailed", { error: editError instanceof Error ? editError.message : t("errorUnknown") }), 5000, "error")
    }
  }

  async function insertEmbed() {
    if (!embedParentId.value.trim()) {
      showMessage(t("embedParentIdRequired"), 4000, "error")
      return
    }
    try {
      await persistCurrentTemplateAndView()
      await refreshSavedTemplateSummaries()
      await runtime.insertEmbedBlock({
        parentID: embedParentId.value.trim(),
        templateId: draft.template.id,
        viewId: draft.view.id,
        title: draft.template.name,
        viewType: draft.view.type,
      })
      await rememberEmbedTarget(embedParentId.value)
      recordMetric("embedInsertions")
    } catch (insertError) {
      showMessage(t("insertEmbedBlockFailed", { error: insertError instanceof Error ? insertError.message : t("errorUnknown") }), 5000, "error")
    }
  }

  function openBlock(blockId: string) {
    window.open(`siyuan://blocks/${blockId}`)
  }

  function canOpenRow(row: ResultRow) {
    return !draft.template.aggregation && /^\d{14}-[a-z0-9]{7,}$/i.test(row.id.trim())
  }

  async function dropToColumn(columnId: string) {
    if (!draggingRowId.value) {
      return
    }
    if (draft.template.groupBy !== `attr:${draft.view.fieldMappings.status}`) {
      showMessage(t("boardDragWritebackUnsupported"), 3500, "error")
      draggingRowId.value = ""
      return
    }
    await quickEdit(draggingRowId.value, "status", columnId === "__ungrouped__" ? "" : columnId)
    recordMetric("boardDrags")
    draggingRowId.value = ""
  }

  return {
    canOpenRow,
    dropToColumn,
    insertEmbed,
    openBlock,
    quickEdit,
    resetResultState,
    runQuery,
  }
}
