import { createDefaultViewConfig } from "@/core/query/catalog"
import type { QueryBuilderSnapshot, QueryTemplate, ViewConfig } from "@/core/query/types"

import { migrateLegacyTemplateSnapshots } from "./migrations"
import { createQueryTemplateStore } from "./query-template-store"
import { createViewConfigStore } from "./view-config-store"

interface StorageAdapter {
  loadData(key: string): Promise<unknown>
  saveData(key: string, value: unknown): Promise<void>
  removeData(key: string): Promise<void>
}

function pickView(template: QueryTemplate, views: ViewConfig[]) {
  const preferred = views.find(item => item.defaultView)
    || views.find(item => item.type === template.viewType)
    || views[0]

  return preferred || createDefaultViewConfig(template.id, template.viewType)
}

function toSnapshot(template: QueryTemplate, views: ViewConfig[]): QueryBuilderSnapshot {
  return {
    template,
    view: pickView(template, views),
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
    async get(templateId: string) {
      await ensureMigrated()
      const [template, views] = await Promise.all([
        templateStore.get(templateId),
        viewStore.listByTemplate(templateId),
      ])
      if (!template) {
        return null
      }
      return toSnapshot(template, views)
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
