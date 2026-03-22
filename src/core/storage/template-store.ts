import type { QueryBuilderSnapshot, QueryTemplate, ViewConfig } from "@/core/query/types"

import { createMigrationGate } from "./migration-gate"
import { migrateLegacyTemplateSnapshots } from "./migrations"
import { createQueryTemplateStore } from "./query-template-store"
import { createTemplateViewLoader } from "./template-view-loader"
import { createViewConfigStore } from "./view-config-store"

interface StorageAdapter {
  loadData(key: string): Promise<unknown>
  saveData(key: string, value: unknown): Promise<void>
  removeData(key: string): Promise<void>
}

export function createTemplateStore(storage: StorageAdapter) {
  const templateStore = createQueryTemplateStore(storage)
  const viewStore = createViewConfigStore(storage)
  const loadTemplateViews = createTemplateViewLoader(templateStore, viewStore)
  const ensureMigrated = createMigrationGate(() => migrateLegacyTemplateSnapshots(storage))

  return {
    async list() {
      await ensureMigrated()
      return loadTemplateViews.listSnapshots()
    },
    async get(templateId: string, viewId?: string) {
      await ensureMigrated()
      return loadTemplateViews.getSnapshot(templateId, viewId)
    },
    async save(snapshot: QueryBuilderSnapshot) {
      await ensureMigrated()
      const template = {
        ...snapshot.template,
        viewType: snapshot.view.type,
      } satisfies QueryTemplate
      const view = {
        ...snapshot.view,
        queryTemplateId: snapshot.template.id,
      } satisfies ViewConfig
      await templateStore.save(template)
      await viewStore.save(view)
    },
    async remove(templateId: string) {
      await ensureMigrated()
      await templateStore.remove(templateId)
      await viewStore.removeByTemplate(templateId)
    },
  }
}
