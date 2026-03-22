import { describe, expect, it } from "vitest"

import { METRICS_STORAGE_KEY, createMetricsStore } from "@/core/storage/metrics-store"

class FakePluginStorage {
  private data = new Map<string, unknown>()

  async loadData(key: string) {
    return this.data.get(key)
  }

  async saveData(key: string, value: unknown) {
    this.data.set(key, value)
  }

  async removeData(key: string) {
    this.data.delete(key)
  }

  seed(key: string, value: unknown) {
    this.data.set(key, value)
  }

  read(key: string) {
    return this.data.get(key)
  }
}

describe("createMetricsStore", () => {
  it("accumulates counters and view switch usage in local storage", async () => {
    const storage = new FakePluginStorage()
    const store = createMetricsStore(storage)

    await store.increment("queryRuns")
    await store.increment("templateSaves")
    await store.increment("viewSaves", 2)
    await store.increment("quickEdits", 3)
    await store.incrementViewSwitch("board")
    await store.incrementViewSwitch("board")
    await store.incrementViewSwitch("table")

    expect(await store.get()).toEqual({
      queryRuns: 1,
      templateSaves: 1,
      viewSaves: 2,
      embedInsertions: 0,
      quickEdits: 3,
      boardDrags: 0,
      viewSwitches: {
        board: 2,
        table: 1,
      },
    })
    expect(storage.read(METRICS_STORAGE_KEY)).toEqual(await store.get())
  })

  it("merges partial persisted metrics with default values", async () => {
    const storage = new FakePluginStorage()
    storage.seed(METRICS_STORAGE_KEY, {
      queryRuns: 5,
      viewSwitches: {
        cards: 4,
      },
    })
    const store = createMetricsStore(storage)

    expect(await store.get()).toEqual({
      queryRuns: 5,
      templateSaves: 0,
      viewSaves: 0,
      embedInsertions: 0,
      quickEdits: 0,
      boardDrags: 0,
      viewSwitches: {
        cards: 4,
      },
    })
  })
})
