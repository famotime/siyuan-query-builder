import type { QueryTemplate } from "@/core/query/types"

export const QUERY_TEMPLATE_STORAGE_KEY = "query-builder.templates.v2"

interface StorageAdapter {
  loadData(key: string): Promise<unknown>
  saveData(key: string, value: unknown): Promise<void>
  removeData(key: string): Promise<void>
}

async function readAll(storage: StorageAdapter) {
  const data = await storage.loadData(QUERY_TEMPLATE_STORAGE_KEY)
  if (!Array.isArray(data)) {
    return [] as QueryTemplate[]
  }
  return data as QueryTemplate[]
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
      if (next.length) {
        await storage.saveData(QUERY_TEMPLATE_STORAGE_KEY, next)
        return
      }
      await storage.removeData(QUERY_TEMPLATE_STORAGE_KEY)
    },
  }
}
