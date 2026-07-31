import type { Ref } from "vue"

import { createDocWithMd, getBlockByID, getChildBlocks, getNotebookConf, lsNotebooks, renderSprig, setBlockAttrs } from "@/api"
import {
  buildDailyNoteExamplePath,
  buildPresetExampleDocument,
  pickExampleNotebookId,
} from "@/core/example-document"
import { getActiveDocumentTarget } from "@/core/embed-target"
import { showMessage } from "@/external/siyuan"
import type { QueryBuilderSnapshot, QueryHistoryEntry, ViewConfig } from "@/core/query/types"
import type { I18nHelper } from "@/utils/i18n"

import { createSnapshot } from "./shared"

interface QueryHistoryStore {
  list: () => Promise<QueryHistoryEntry[]>
  prepend: (entry: QueryHistoryEntry) => Promise<QueryHistoryEntry[]>
}

interface TemplateViewsController {
  applyTemplateAndView: (template: QueryBuilderSnapshot["template"], view: QueryBuilderSnapshot["view"]) => void
  refreshSavedTemplateSummaries: () => Promise<void>
  refreshSavedViews: (templateId?: string) => Promise<void>
}

interface EmbedTargetsController {
  initializeEmbedTargets: () => Promise<void>
}

interface QueryBuilderSessionControllerOptions {
  draft: QueryBuilderSnapshot
  notebooks: Ref<Notebook[]>
  recentQueryHistory: Ref<QueryHistoryEntry[]>
  queryHistoryStore: QueryHistoryStore
  templateViews: TemplateViewsController
  embedTargets: EmbedTargetsController
  resetResultState: () => void
  t: I18nHelper
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
      return "卡片"
    default:
      return "表格"
  }
}

function buildQueryHistorySummary(snapshot: QueryBuilderSnapshot) {
  return `${historyScopeLabel(snapshot)} · ${snapshot.template.filters.length} 个条件 · ${historyViewLabel(snapshot.view.type)}`
}

export function createQueryBuilderSessionController(options: QueryBuilderSessionControllerOptions) {
  const {
    draft,
    notebooks,
    recentQueryHistory,
    queryHistoryStore,
    templateViews,
    embedTargets,
    resetResultState,
    t,
  } = options

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

      let notebookId = ""
      const activeDocument = getActiveDocumentTarget(window)
      if (activeDocument?.id) {
        const currentBlock = await getBlockByID(activeDocument.id)
        const currentNotebookId = String(currentBlock?.box || "").trim()
        if (currentNotebookId) {
          notebookId = currentNotebookId
        }
      }

      if (!notebookId) {
        notebookId = pickExampleNotebookId(notebooks.value, draft.template.scope)
      }
      if (!notebookId) {
        showMessage(t("noAvailableNotebook"), 4000, "error")
        return false
      }

      const notebookConf = await getNotebookConf(notebookId)
      const now = new Date()
      const dailyNotePathTemplate = notebookConf?.conf?.dailyNoteSavePath
      const resolvedDailyNotePath = dailyNotePathTemplate
        ? await renderSprig(dailyNotePathTemplate)
        : undefined
      const path = buildDailyNoteExamplePath(resolvedDailyNotePath, now)
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
      return true
    } catch (generationError) {
      showMessage(t("generateExampleDocumentFailed", { error: generationError instanceof Error ? generationError.message : t("errorUnknown") }), 5000, "error")
      return false
    }
  }

  return {
    applySnapshot,
    generateExampleDocument,
    initialize,
    refreshQueryHistory,
    rememberQueryHistory,
    restoreQueryHistory,
  }
}
