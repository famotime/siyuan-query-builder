import type { ViewConfig } from "@/core/query/types"

export const VIEW_CONFIG_STORAGE_KEY = "query-builder.views.v2"

interface StorageAdapter {
  loadData(key: string): Promise<unknown>
  saveData(key: string, value: unknown): Promise<void>
  removeData(key: string): Promise<void>
}

async function readAll(storage: StorageAdapter) {
  const data = await storage.loadData(VIEW_CONFIG_STORAGE_KEY)
  if (!Array.isArray(data)) {
    return [] as ViewConfig[]
  }
  return data as ViewConfig[]
}

export function createViewConfigStore(storage: StorageAdapter) {
  return {
    async list() {
      return readAll(storage)
    },
    async listByTemplate(templateId: string) {
      const views = await readAll(storage)
      return views.filter(item => item.queryTemplateId === templateId)
    },
    async save(view: ViewConfig) {
      const views = await readAll(storage)
      const next = views.filter(item => item.id !== view.id).map((item) => {
        if (view.defaultView && item.queryTemplateId === view.queryTemplateId) {
          return {
            ...item,
            defaultView: false,
          }
        }
        return item
      })
      next.unshift(view)
      await storage.saveData(VIEW_CONFIG_STORAGE_KEY, next)
    },
    async remove(viewId: string) {
      const views = await readAll(storage)
      const next = views.filter(item => item.id !== viewId)
      if (next.length) {
        await storage.saveData(VIEW_CONFIG_STORAGE_KEY, next)
        return
      }
      await storage.removeData(VIEW_CONFIG_STORAGE_KEY)
    },
    async removeByTemplate(templateId: string) {
      const views = await readAll(storage)
      const next = views.filter(item => item.queryTemplateId !== templateId)
      if (next.length) {
        await storage.saveData(VIEW_CONFIG_STORAGE_KEY, next)
        return
      }
      await storage.removeData(VIEW_CONFIG_STORAGE_KEY)
    },
  }
}
