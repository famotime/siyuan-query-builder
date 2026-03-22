import type { Ref } from "vue"

import type { QueryBuilderSnapshot, QueryTemplate, SavedTemplateSummary, ViewConfig } from "@/core/query/types"
import { createMigrationGate } from "@/core/storage/migration-gate"
import { migrateLegacyTemplateSnapshots } from "@/core/storage/migrations"
import { createQueryTemplateStore } from "@/core/storage/query-template-store"
import { buildSavedTemplateSummary } from "@/core/storage/template-view"
import { createTemplateViewLoader } from "@/core/storage/template-view-loader"
import { createViewConfigStore } from "@/core/storage/view-config-store"

import { createSnapshot } from "../shared"

interface StorageAdapter {
  loadData(key: string): Promise<unknown>
  saveData(key: string, value: unknown): Promise<void>
  removeData(key: string): Promise<void>
}

interface TemplateViewStorageOptions {
  plugin: StorageAdapter
  draft: QueryBuilderSnapshot
  savedTemplateSummaries: Ref<SavedTemplateSummary[]>
  savedViews: Ref<ViewConfig[]>
}

export function createTemplateViewStorage(options: TemplateViewStorageOptions) {
  const {
    plugin,
    draft,
    savedTemplateSummaries,
    savedViews,
  } = options

  const queryTemplateStore = createQueryTemplateStore(plugin)
  const viewConfigStore = createViewConfigStore(plugin)
  const loadTemplateViews = createTemplateViewLoader(queryTemplateStore, viewConfigStore)
  const ensureStorageReady = createMigrationGate(() => migrateLegacyTemplateSnapshots(plugin))

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

  async function loadTemplateSnapshot(templateId: string) {
    await ensureStorageReady()
    return loadTemplateViews.getSnapshot(templateId)
  }

  return {
    ensureStorageReady,
    loadTemplateSnapshot,
    persistCurrentTemplateAndView,
    queryTemplateStore,
    refreshSavedTemplateSummaries,
    refreshSavedViews,
    savePersistedTemplate,
    savePersistedView,
    viewConfigStore,
  }
}
