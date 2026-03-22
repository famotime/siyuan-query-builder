import { ref, type Ref } from "vue"

import { applyViewConfigToTemplate, cloneSnapshot, createId, hydrateViewConfig } from "@/core/query/catalog"
import type { QueryBuilderSnapshot, QueryTemplate, SavedTemplateSummary, ViewConfig } from "@/core/query/types"
import { showMessage } from "@/external/siyuan"
import { migrateLegacyTemplateSnapshots } from "@/core/storage/migrations"
import { createQueryTemplateStore } from "@/core/storage/query-template-store"
import { buildSavedTemplateSummary, pickTemplateView } from "@/core/storage/template-view"
import { createViewConfigStore } from "@/core/storage/view-config-store"

import { createDraft, createSnapshot } from "./shared"

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

  const queryTemplateStore = createQueryTemplateStore(plugin)
  const viewConfigStore = createViewConfigStore(plugin)
  const storageReadyPromise = ref<Promise<void> | null>(null)

  async function ensureStorageReady() {
    if (!storageReadyPromise.value) {
      storageReadyPromise.value = migrateLegacyTemplateSnapshots(plugin)
    }
    await storageReadyPromise.value
  }

  function applyTemplateAndView(template: QueryTemplate, view: ViewConfig) {
    const nextView = hydrateViewConfig(view, template)
    const next = cloneSnapshot({
      template: applyViewConfigToTemplate(template, nextView),
      view: nextView,
    })
    draft.template = next.template
    draft.view = next.view
    resetResultState()
  }

  function resetDraft() {
    const next = createDraft()
    applyTemplateAndView(next.template, next.view)
    savedViews.value = []
  }

  async function savePersistedTemplate(template: QueryTemplate) {
    await ensureStorageReady()
    await queryTemplateStore.save(template)
  }

  async function savePersistedView(view: ViewConfig) {
    await ensureStorageReady()
    await viewConfigStore.save(view)
  }

  async function persistCurrentTemplateAndView() {
    const snapshot = createSnapshot(draft)
    snapshot.template.viewType = snapshot.view.type
    snapshot.view.queryTemplateId = snapshot.template.id
    await ensureStorageReady()
    await queryTemplateStore.save(snapshot.template)
    await viewConfigStore.save(snapshot.view)
    return snapshot
  }

  async function refreshSavedTemplateSummaries() {
    await ensureStorageReady()
    const [templates, views] = await Promise.all([
      queryTemplateStore.list(),
      viewConfigStore.list(),
    ])
    savedTemplateSummaries.value = templates.map(template => buildSavedTemplateSummary(
      template,
      views.filter(view => view.queryTemplateId === template.id),
    ))
  }

  async function refreshSavedViews(templateId = draft.template.id) {
    await ensureStorageReady()
    if (!templateId) {
      savedViews.value = []
      return
    }
    savedViews.value = await viewConfigStore.listByTemplate(templateId)
  }

  async function loadTemplate(templateId: string) {
    await ensureStorageReady()
    const [template, views] = await Promise.all([
      queryTemplateStore.get(templateId),
      viewConfigStore.listByTemplate(templateId),
    ])
    if (!template) {
      return false
    }

    applyTemplateAndView(template, pickTemplateView(template, views))
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
      await ensureStorageReady()
      await queryTemplateStore.remove(templateId)
      await viewConfigStore.removeByTemplate(templateId)
      await refreshSavedTemplateSummaries()
      if (draft.template.id === templateId) {
        resetDraft()
      } else {
        await refreshSavedViews(draft.template.id)
      }
      showMessage("已删除模板", 3000, "info")
    } catch (deleteError) {
      showMessage(deleteError instanceof Error ? deleteError.message : "删除模板失败", 5000, "error")
    }
  }

  async function saveViewAs() {
    try {
      const snapshot = createSnapshot(draft)
      snapshot.template.viewType = snapshot.view.type
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
    applyTemplateAndView(draft.template, view)
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
      const template = await queryTemplateStore.get(view.queryTemplateId)
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
      await ensureStorageReady()
      await viewConfigStore.remove(viewId)
      await refreshSavedViews(draft.template.id)
      let replacement = savedViews.value.find(item => item.defaultView) || savedViews.value[0]

      if (!savedViews.value.some(item => item.defaultView) && replacement) {
        replacement = {
          ...replacement,
          defaultView: true,
        }
        await savePersistedView(replacement)
        const template = await queryTemplateStore.get(replacement.queryTemplateId)
        if (template) {
          await savePersistedTemplate({
            ...applyViewConfigToTemplate(template, replacement),
          })
        }
        await refreshSavedViews(draft.template.id)
      }

      if (draft.view.id === viewId) {
        if (replacement) {
          applyTemplateAndView(draft.template, replacement)
          draft.template.viewType = replacement.type
        }
      } else if (deletedView?.defaultView && replacement) {
        const template = await queryTemplateStore.get(replacement.queryTemplateId)
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
    ensureStorageReady,
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
