import type { QueryHistoryEntry } from "@/core/query/types"
import { readArrayStorage, writeArrayStorage, type StorageAdapter } from "@/core/storage/collection-storage"

export const QUERY_HISTORY_STORAGE_KEY = "query-builder.history.v1"
export const QUERY_HISTORY_LIMIT = 10

async function readAll(storage: StorageAdapter) {
  return readArrayStorage<QueryHistoryEntry>(storage, QUERY_HISTORY_STORAGE_KEY)
}

export function createQueryHistoryStore(storage: StorageAdapter) {
  return {
    async list() {
      return readAll(storage)
    },
    async prepend(entry: QueryHistoryEntry) {
      const next = [entry, ...(await readAll(storage))].slice(0, QUERY_HISTORY_LIMIT)
      await writeArrayStorage(storage, QUERY_HISTORY_STORAGE_KEY, next)
      return next
    },
    async clear() {
      await writeArrayStorage(storage, QUERY_HISTORY_STORAGE_KEY, [])
      return []
    },
  }
}
