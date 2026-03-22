import type { QueryBuilderSnapshot } from "@/core/query/types"

const STORAGE_KEY = "query-builder.templates.v1"

interface StorageAdapter {
  loadData(key: string): Promise<unknown>
  saveData(key: string, value: unknown): Promise<void>
  removeData(key: string): Promise<void>
}

async function readAll(storage: StorageAdapter) {
  const data = await storage.loadData(STORAGE_KEY)
  if (!Array.isArray(data)) {
    return [] as QueryBuilderSnapshot[]
  }
  return data as QueryBuilderSnapshot[]
}

export function createTemplateStore(storage: StorageAdapter) {
  return {
    async list() {
      return readAll(storage)
    },
    async get(templateId: string) {
      const templates = await readAll(storage)
      return templates.find(item => item.template.id === templateId) || null
    },
    async save(snapshot: QueryBuilderSnapshot) {
      const templates = await readAll(storage)
      const next = templates.filter(item => item.template.id !== snapshot.template.id)
      next.unshift(snapshot)
      await storage.saveData(STORAGE_KEY, next)
    },
    async remove(templateId: string) {
      const templates = await readAll(storage)
      const next = templates.filter(item => item.template.id !== templateId)
      if (next.length) {
        await storage.saveData(STORAGE_KEY, next)
        return
      }
      await storage.removeData(STORAGE_KEY)
    },
  }
}
