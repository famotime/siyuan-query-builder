import type { ComputedRef, Ref } from "vue"

import { buildQuery } from "@/core/query/compiler"
import type { QueryBuilderSnapshot, ResultRow, ResultSet } from "@/core/query/types"
import { showMessage } from "@/external/siyuan"

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
  } = options

  function resetResultState() {
    resultSet.value = null
    advancedSql.value = ""
    error.value = ""
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
      await rememberQueryHistory(resultSet.value.executedAt)
      recordMetric("queryRuns")
      showMessage(`查询完成：${resultSet.value.total} 条结果`, 3500, "info")
    } catch (runtimeError) {
      error.value = runtimeError instanceof Error ? runtimeError.message : "查询失败"
      showMessage(error.value, 5000, "error")
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
      showMessage("已插入嵌入描述块", 3500, "info")
    } catch (insertError) {
      showMessage(insertError instanceof Error ? insertError.message : "插入嵌入块失败", 5000, "error")
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
      showMessage("只有按状态分组时才支持拖拽回写", 3500, "error")
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
