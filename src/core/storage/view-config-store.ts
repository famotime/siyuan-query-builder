import type { ViewConfig } from "@/core/query/types"
import { readArrayStorage, writeArrayStorage, type StorageAdapter } from "@/core/storage/collection-storage"

export const VIEW_CONFIG_STORAGE_KEY = "query-builder.views.v2"

async function readAll(storage: StorageAdapter) {
  return readArrayStorage<ViewConfig>(storage, VIEW_CONFIG_STORAGE_KEY)
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
      const next = views.map((item) => {
        if (view.defaultView && item.queryTemplateId === view.queryTemplateId) {
          return {
            ...item,
            defaultView: false,
          }
        }
        return item
      })
      const existingIndex = next.findIndex(item => item.id === view.id)
      if (existingIndex >= 0) {
        next.splice(existingIndex, 1, view)
      } else {
        next.push(view)
      }
      await storage.saveData(VIEW_CONFIG_STORAGE_KEY, next)
    },
    async remove(viewId: string) {
      const views = await readAll(storage)
      const next = views.filter(item => item.id !== viewId)
      await writeArrayStorage(storage, VIEW_CONFIG_STORAGE_KEY, next)
    },
    async removeByTemplate(templateId: string) {
      const views = await readAll(storage)
      const next = views.filter(item => item.queryTemplateId !== templateId)
      await writeArrayStorage(storage, VIEW_CONFIG_STORAGE_KEY, next)
    },
  }
}
