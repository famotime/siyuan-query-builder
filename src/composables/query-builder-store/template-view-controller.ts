import type { Ref } from "vue"

import { applyViewConfigToTemplate, createId } from "@/core/query/catalog"
import type { QueryBuilderSnapshot, QueryTemplate, QueryTemplateBundle, SavedTemplateSummary, ViewConfig } from "@/core/query/types"
import { showMessage } from "@/external/siyuan"

import { createSnapshot } from "./shared"
import { createExportedTemplateBundle, createImportedTemplateBundle, isTemplateBundle } from "./template-view-controller/bundle"
import { applyTemplateAndViewState, resetDraftState } from "./template-view-controller/draft-state"
import { createTemplateViewStorage } from "./template-view-controller/storage"

interface StorageAdapter {
  loadData(key: string): Promise<unknown>
  saveData(key: string, value: unknown): Promise<void>
  removeData(key: string): Promise<void>
}

interface TemplateViewControllerOptions {
  plugin: StorageAdapter
  draft: QueryBuilderSnapshot
  savedTemplateSummaries: Ref<SavedTemplateSummary[]>
  savedViews: Ref<ViewConfig[]>
  saving: Ref<boolean>
  resetResultState: () => void
  recordMetric: (metric: "templateSaves" | "viewSaves", amount?: number) => void
}

export function createTemplateViewController(options: TemplateViewControllerOptions) {
  const {
    plugin,
    draft,
    savedTemplateSummaries,
    savedViews,
    saving,
    resetResultState,
    recordMetric,
  } = options

  const storage = createTemplateViewStorage({
    plugin,
    draft,
    savedTemplateSummaries,
    savedViews,
  })

  function applyTemplateAndView(
    template: QueryTemplate,
    view: ViewConfig,
    options: {
      preserveResultState?: boolean
    } = {},
  ) {
    applyTemplateAndViewState(draft, template, view, resetResultState, options)
  }

  function resetDraft() {
    resetDraftState(draft, savedViews, resetResultState)
  }

  async function savePersistedTemplate(template: QueryTemplate) {
    await storage.savePersistedTemplate(template)
  }

  async function savePersistedView(view: ViewConfig) {
    await storage.savePersistedView(view)
  }

  async function persistCurrentTemplateAndView() {
    return storage.persistCurrentTemplateAndView()
  }

  async function refreshSavedTemplateSummaries() {
    await storage.refreshSavedTemplateSummaries()
  }

  async function refreshSavedViews(templateId = draft.template.id) {
    await storage.refreshSavedViews(templateId)
  }

  async function exportTemplateBundle(templateId: string) {
    await storage.ensureStorageReady()
    const [template, views] = await Promise.all([
      storage.queryTemplateStore.get(templateId),
      storage.viewConfigStore.listByTemplate(templateId),
    ])

    if (!template) {
      throw new Error("模板不存在")
    }

    return createExportedTemplateBundle(template, views)
  }

  async function importTemplateBundle(payload: string | QueryTemplateBundle) {
    try {
      const parsed = typeof payload === "string"
        ? JSON.parse(payload) as unknown
        : payload

      if (!isTemplateBundle(parsed)) {
        throw new Error("导入文件格式不正确")
      }

      const importedBundle = createImportedTemplateBundle(parsed)
      const importedTemplate = importedBundle.template
      const importedViews = importedBundle.views

      await storage.ensureStorageReady()
      await storage.queryTemplateStore.save(importedTemplate)
      for (const view of importedViews) {
        await storage.viewConfigStore.save(view)
      }

      const defaultView = importedViews.find(view => view.defaultView) || importedViews[0]
      if (defaultView) {
        applyTemplateAndView(importedTemplate, defaultView)
      }
      await refreshSavedTemplateSummaries()
      await refreshSavedViews(importedTemplate.id)
      showMessage(`已导入模板：${importedTemplate.name}`, 3500, "info")
      return importedTemplate.id
    } catch (importError) {
      const message = importError instanceof Error ? importError.message : "导入模板失败"
      showMessage(message, 5000, "error")
      throw importError
    }
  }

  async function loadTemplate(templateId: string) {
    const snapshot = await storage.loadTemplateSnapshot(templateId)
    if (!snapshot) {
      return false
    }

    applyTemplateAndView(snapshot.template, snapshot.view)
    await refreshSavedViews(templateId)
    return true
  }

  async function saveTemplate() {
    saving.value = true
    try {
      await persistCurrentTemplateAndView()
      await refreshSavedTemplateSummaries()
      await refreshSavedViews(draft.template.id)
      recordMetric("templateSaves")
      showMessage(`已保存模板：${draft.template.name}`, 3500, "info")
    } catch (saveError) {
      showMessage(saveError instanceof Error ? saveError.message : "保存失败", 5000, "error")
    } finally {
      saving.value = false
    }
  }

  async function deleteTemplate(templateId: string) {
    try {
      await storage.ensureStorageReady()
      const template = await storage.queryTemplateStore.get(templateId)
      if (!template) {
        return false
      }
      const confirmed = typeof window.confirm === "function"
        ? window.confirm(`确定删除模板“${template.name}”吗？相关已保存视图也会一并删除。`)
        : true
      if (!confirmed) {
        return false
      }
      await storage.queryTemplateStore.remove(templateId)
      await storage.viewConfigStore.removeByTemplate(templateId)
      await refreshSavedTemplateSummaries()
      if (draft.template.id === templateId) {
        resetDraft()
      } else {
        await refreshSavedViews(draft.template.id)
      }
      showMessage("已删除模板", 3000, "info")
      return true
    } catch (deleteError) {
      showMessage(deleteError instanceof Error ? deleteError.message : "删除模板失败", 5000, "error")
      return false
    }
  }

  async function saveViewAs() {
    try {
      const snapshot = createSnapshot(draft)
      snapshot.template.viewType = snapshot.view.type
      const duplicateTypeView = savedViews.value.find(view =>
        view.queryTemplateId === snapshot.template.id
        && view.type === snapshot.view.type,
      )
      if (duplicateTypeView) {
        showMessage("该视图类型已存在，无需重复添加", 3500, "error")
        return false
      }
      await savePersistedTemplate(snapshot.template)
      const nextView = {
        ...snapshot.view,
        id: createId("view"),
        queryTemplateId: snapshot.template.id,
        defaultView: false,
        type: snapshot.view.type,
      } satisfies ViewConfig
      await savePersistedView(nextView)
      draft.view = nextView
      draft.template.viewType = nextView.type
      await refreshSavedViews(draft.template.id)
      await refreshSavedTemplateSummaries()
      recordMetric("viewSaves")
      showMessage("已添加为新视图", 3000, "info")
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
    applyTemplateAndView(draft.template, view, {
      preserveResultState: true,
    })
    draft.template.viewType = view.type
    return true
  }

  async function setDefaultSavedView(viewId: string) {
    const view = savedViews.value.find(item => item.id === viewId)
    if (!view) {
      return false
    }
    try {
      await savePersistedView({
        ...view,
        defaultView: true,
      })
      if (draft.view.id === viewId) {
        draft.view.defaultView = true
      }
      const template = await storage.queryTemplateStore.get(view.queryTemplateId)
      if (template) {
        await savePersistedTemplate({
          ...applyViewConfigToTemplate(template, view),
        })
      }
      await refreshSavedViews(draft.template.id)
      await refreshSavedTemplateSummaries()
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
      const deletedView = savedViews.value.find(item => item.id === viewId)
      await storage.ensureStorageReady()
      await storage.viewConfigStore.remove(viewId)
      await refreshSavedViews(draft.template.id)
      let replacement = savedViews.value.find(item => item.defaultView) || savedViews.value[0]

      if (!savedViews.value.some(item => item.defaultView) && replacement) {
        replacement = {
          ...replacement,
          defaultView: true,
        }
        await savePersistedView(replacement)
        const template = await storage.queryTemplateStore.get(replacement.queryTemplateId)
        if (template) {
          await savePersistedTemplate({
            ...applyViewConfigToTemplate(template, replacement),
          })
        }
        await refreshSavedViews(draft.template.id)
      }

      if (draft.view.id === viewId) {
        if (replacement) {
          applyTemplateAndView(draft.template, replacement, {
            preserveResultState: true,
          })
          draft.template.viewType = replacement.type
        }
      } else if (deletedView?.defaultView && replacement) {
        const template = await storage.queryTemplateStore.get(replacement.queryTemplateId)
        if (template) {
          await savePersistedTemplate({
            ...applyViewConfigToTemplate(template, replacement),
          })
        }
      }

      await refreshSavedTemplateSummaries()
      showMessage("已删除视图配置", 3000, "info")
      return true
    } catch (deleteError) {
      showMessage(deleteError instanceof Error ? deleteError.message : "删除视图配置失败", 5000, "error")
      return false
    }
  }

  return {
    applyTemplateAndView,
    deleteSavedView,
    deleteTemplate,
    ensureStorageReady: storage.ensureStorageReady,
    exportTemplateBundle,
    importTemplateBundle,
    loadSavedView,
    loadTemplate,
    persistCurrentTemplateAndView,
    refreshSavedTemplateSummaries,
    refreshSavedViews,
    resetDraft,
    savePersistedTemplate,
    savePersistedView,
    saveTemplate,
    saveViewAs,
    setDefaultSavedView,
  }
}
