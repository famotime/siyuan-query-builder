export interface StorageAdapter {
  loadData(key: string): Promise<unknown>
  saveData(key: string, value: unknown): Promise<void>
  removeData(key: string): Promise<void>
}

export async function readArrayStorage<T>(storage: StorageAdapter, key: string) {
  const data = await storage.loadData(key)
  if (!Array.isArray(data)) {
    return [] as T[]
  }
  return data as T[]
}

export async function writeArrayStorage<T>(storage: StorageAdapter, key: string, items: T[]) {
  if (items.length) {
    await storage.saveData(key, items)
    return
  }
  await storage.removeData(key)
}
