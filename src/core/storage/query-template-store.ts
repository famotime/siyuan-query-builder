import type { QueryTemplate } from "@/core/query/types"
import { readArrayStorage, writeArrayStorage, type StorageAdapter } from "@/core/storage/collection-storage"

export const QUERY_TEMPLATE_STORAGE_KEY = "query-builder.templates.v2"

async function readAll(storage: StorageAdapter) {
  return readArrayStorage<QueryTemplate>(storage, QUERY_TEMPLATE_STORAGE_KEY)
}

export function createQueryTemplateStore(storage: StorageAdapter) {
  return {
    async list() {
      return readAll(storage)
    },
    async get(templateId: string) {
      const templates = await readAll(storage)
      return templates.find(item => item.id === templateId) || null
    },
    async save(template: QueryTemplate) {
      const templates = await readAll(storage)
      const next = templates.filter(item => item.id !== template.id)
      next.unshift(template)
      await storage.saveData(QUERY_TEMPLATE_STORAGE_KEY, next)
    },
    async remove(templateId: string) {
      const templates = await readAll(storage)
      const next = templates.filter(item => item.id !== templateId)
      await writeArrayStorage(storage, QUERY_TEMPLATE_STORAGE_KEY, next)
    },
  }
}
