import type { ViewType } from "@/core/query/types"

export const METRICS_STORAGE_KEY = "query-builder.metrics.v1"

export interface QueryBuilderMetrics {
  queryRuns: number
  templateSaves: number
  viewSaves: number
  embedInsertions: number
  quickEdits: number
  boardDrags: number
  viewSwitches: Partial<Record<ViewType, number>>
}

interface StorageAdapter {
  loadData(key: string): Promise<unknown>
  saveData(key: string, value: unknown): Promise<void>
  removeData(key: string): Promise<void>
}

type MetricCounterKey = Exclude<keyof QueryBuilderMetrics, "viewSwitches">

function createDefaultMetrics(): QueryBuilderMetrics {
  return {
    queryRuns: 0,
    templateSaves: 0,
    viewSaves: 0,
    embedInsertions: 0,
    quickEdits: 0,
    boardDrags: 0,
    viewSwitches: {},
  }
}

function normalizeMetrics(data: unknown): QueryBuilderMetrics {
  const defaults = createDefaultMetrics()
  if (!data || typeof data !== "object") {
    return defaults
  }

  const source = data as Partial<QueryBuilderMetrics>

  return {
    queryRuns: Number(source.queryRuns) || 0,
    templateSaves: Number(source.templateSaves) || 0,
    viewSaves: Number(source.viewSaves) || 0,
    embedInsertions: Number(source.embedInsertions) || 0,
    quickEdits: Number(source.quickEdits) || 0,
    boardDrags: Number(source.boardDrags) || 0,
    viewSwitches: source.viewSwitches && typeof source.viewSwitches === "object"
      ? { ...source.viewSwitches }
      : defaults.viewSwitches,
  }
}

export function createMetricsStore(storage: StorageAdapter) {
  let pendingWrite = Promise.resolve()

  async function get() {
    return normalizeMetrics(await storage.loadData(METRICS_STORAGE_KEY))
  }

  async function save(metrics: QueryBuilderMetrics) {
    await storage.saveData(METRICS_STORAGE_KEY, metrics)
  }

  function enqueueWrite<T>(task: () => Promise<T>) {
    const next = pendingWrite.then(task, task)
    pendingWrite = next.then(() => undefined, () => undefined)
    return next
  }

  return {
    get,
    async increment(metric: MetricCounterKey, amount = 1) {
      return enqueueWrite(async () => {
        const current = await get()
        const next = {
          ...current,
          [metric]: current[metric] + amount,
        } satisfies QueryBuilderMetrics
        await save(next)
        return next
      })
    },
    async incrementViewSwitch(type: ViewType, amount = 1) {
      return enqueueWrite(async () => {
        const current = await get()
        const next = {
          ...current,
          viewSwitches: {
            ...current.viewSwitches,
            [type]: (current.viewSwitches[type] || 0) + amount,
          },
        } satisfies QueryBuilderMetrics
        await save(next)
        return next
      })
    },
  }
}
