import { applyViewConfigToTemplate } from "@/core/query/catalog"
import type { QueryBuilderSnapshot, QueryTemplate, ViewConfig } from "@/core/query/types"

import { migrateLegacyTemplateSnapshots } from "./migrations"
import { createQueryTemplateStore } from "./query-template-store"
import { pickTemplateViewById } from "./template-view"
import { createViewConfigStore } from "./view-config-store"

interface StorageAdapter {
  loadData(key: string): Promise<unknown>
  saveData(key: string, value: unknown): Promise<void>
  removeData(key: string): Promise<void>
}

function toSnapshot(template: QueryTemplate, views: ViewConfig[], viewId?: string): QueryBuilderSnapshot {
  const view = pickTemplateViewById(template, views, viewId)

  return {
    template: applyViewConfigToTemplate(template, view),
    view,
  }
}

export function createTemplateStore(storage: StorageAdapter) {
  const templateStore = createQueryTemplateStore(storage)
  const viewStore = createViewConfigStore(storage)
  let migrationPromise: Promise<void> | null = null

  async function ensureMigrated() {
    if (!migrationPromise) {
      migrationPromise = migrateLegacyTemplateSnapshots(storage)
    }
    await migrationPromise
  }

  return {
    async list() {
      await ensureMigrated()
      const [templates, views] = await Promise.all([
        templateStore.list(),
        viewStore.list(),
      ])
      return templates.map(template => toSnapshot(
        template,
        views.filter(view => view.queryTemplateId === template.id),
      ))
    },
    async get(templateId: string, viewId?: string) {
      await ensureMigrated()
      const [template, views] = await Promise.all([
        templateStore.get(templateId),
        viewStore.listByTemplate(templateId),
      ])
      if (!template) {
        return null
      }
      return toSnapshot(template, views, viewId)
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
