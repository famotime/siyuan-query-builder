import { beforeEach, describe, expect, it, vi } from "vitest"

import zhCN from "@/i18n/zh_CN.json"
import { QUERY_TEMPLATE_STORAGE_KEY } from "@/core/storage/query-template-store"

class FakePluginStorage {
  i18n: Record<string, string> = zhCN
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

let currentPlugin = new FakePluginStorage()

const runtime = {
  execute: vi.fn(async () => ({
    rows: [],
    total: 0,
    executedAt: "2026-11-08T00:00:00.000Z",
  })),
  updateField: vi.fn(async () => {}),
  insertEmbedBlock: vi.fn(async () => {}),
}

const { showMessage } = vi.hoisted(() => ({
  showMessage: vi.fn(),
}))

const dashboardMocks = vi.hoisted(() => ({
  definition: {
    id: "test-board",
    category: "daily",
    title: "测试仪表板",
    description: "测试用仪表板",
    parameters: [
      { id: "month", label: "月份", type: "text", defaultValue: "2026-03" },
      { id: "goal", label: "目标", type: "number", defaultValue: 8 },
    ],
    buildSql: vi.fn((): string | string[] => "SELECT 1"),
    computeViewModel: vi.fn(),
  },
  viewModel: {
    id: "test-board",
    title: "测试仪表板",
    category: "daily",
    description: "",
    parameters: {},
    metrics: [],
    charts: [],
  },
  getDashboardDefinition: vi.fn(),
  executeDashboard: vi.fn(),
}))

vi.mock("@/external/siyuan", () => ({
  Dialog: class {},
  showMessage,
}))

vi.mock("@/main", () => ({
  usePlugin: () => currentPlugin,
}))

vi.mock("@/api", () => ({
  appendBlock: vi.fn(async () => []),
  createDocWithMd: vi.fn(async () => "20261108000000-example"),
  getChildBlocks: vi.fn(async () => []),
  getBlockByID: vi.fn(async () => null),
  getNotebookConf: vi.fn(async () => null),
  lsNotebooks: vi.fn(async () => ({ notebooks: [] })),
  renderSprig: vi.fn(async (template: string) => template),
  setBlockAttrs: vi.fn(async () => []),
  sql: vi.fn(async () => []),
}))

vi.mock("@/core/runtime/query-runtime", () => ({
  createQueryRuntime: () => runtime,
}))

vi.mock("@/core/dashboard/catalog", () => ({
  SCENARIO_DASHBOARDS: [dashboardMocks.definition],
  getDashboardDefinition: dashboardMocks.getDashboardDefinition,
}))

vi.mock("@/core/dashboard/runtime", () => ({
  executeDashboard: dashboardMocks.executeDashboard,
}))

import { createQueryBuilderStore } from "@/composables/query-builder-store"

async function flushMetricsWrites() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe("createQueryBuilderStore dashboard orchestration", () => {
  beforeEach(() => {
    currentPlugin = new FakePluginStorage()
    showMessage.mockReset()
    runtime.execute.mockClear()
    dashboardMocks.getDashboardDefinition.mockReset()
    dashboardMocks.getDashboardDefinition.mockImplementation((id: string) =>
      id === dashboardMocks.definition.id ? dashboardMocks.definition : undefined)
    dashboardMocks.definition.buildSql.mockReset()
    dashboardMocks.definition.buildSql.mockImplementation(() => "SELECT 1")
    dashboardMocks.executeDashboard.mockReset()
    dashboardMocks.executeDashboard.mockImplementation(async () => dashboardMocks.viewModel)
    window.siyuan = undefined
    window.confirm = vi.fn(() => true)
  })

  it("loadDashboard resets parameters to definition defaults and executes the dashboard", async () => {
    const store = createQueryBuilderStore()

    // 先写入一个过期参数,验证 loadDashboard 会整体重置
    store.updateDashboardParam("stale", "old-value")

    await store.loadDashboard("test-board")

    expect(store.activeDashboardId).toBe("test-board")
    expect(store.activeDashboardParams).toEqual({ month: "2026-03", goal: 8 })
    expect(dashboardMocks.executeDashboard).toHaveBeenCalledTimes(1)
    expect(dashboardMocks.executeDashboard).toHaveBeenCalledWith(
      "test-board",
      store.activeDashboardParams,
      expect.objectContaining({ kernelAdapter: expect.anything() }),
    )
    expect(store.activeDashboardViewModel).toEqual(dashboardMocks.viewModel)
    expect(store.activeDashboardLoading).toBe(false)
  })

  it("loadDashboard ignores unknown dashboard ids", async () => {
    const store = createQueryBuilderStore()

    await store.loadDashboard("missing-board")

    expect(store.activeDashboardId).toBeNull()
    expect(store.activeDashboardViewModel).toBeNull()
    expect(dashboardMocks.executeDashboard).not.toHaveBeenCalled()
  })

  it("updateDashboardParam stores the value and re-runs the dashboard", async () => {
    const store = createQueryBuilderStore()
    await store.loadDashboard("test-board")
    dashboardMocks.executeDashboard.mockClear()

    store.updateDashboardParam("goal", 5)
    await flushMetricsWrites()

    expect(store.activeDashboardParams.goal).toBe(5)
    expect(dashboardMocks.executeDashboard).toHaveBeenCalledTimes(1)
    expect(dashboardMocks.executeDashboard).toHaveBeenCalledWith(
      "test-board",
      expect.objectContaining({ month: "2026-03", goal: 5 }),
      expect.anything(),
    )
    expect(store.activeDashboardLoading).toBe(false)
  })

  it("keeps the previous view model and clears loading when execution fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    dashboardMocks.executeDashboard.mockRejectedValueOnce(new Error("boom"))
    const store = createQueryBuilderStore()

    await store.loadDashboard("test-board")

    expect(store.activeDashboardId).toBe("test-board")
    expect(store.activeDashboardViewModel).toBeNull()
    expect(store.activeDashboardLoading).toBe(false)
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it("runActiveDashboard does nothing without an active dashboard", async () => {
    const store = createQueryBuilderStore()

    await store.runActiveDashboard()

    expect(dashboardMocks.executeDashboard).not.toHaveBeenCalled()
  })

  it("closeDashboard clears the active id and view model", async () => {
    const store = createQueryBuilderStore()
    await store.loadDashboard("test-board")

    store.closeDashboard()

    expect(store.activeDashboardId).toBeNull()
    expect(store.activeDashboardViewModel).toBeNull()
  })

  it("saveDashboardAsTemplate switches to advanced mode with the built SQL and saves a template", async () => {
    const store = createQueryBuilderStore()
    await store.loadDashboard("test-board")

    await store.saveDashboardAsTemplate()
    await flushMetricsWrites()

    expect(dashboardMocks.definition.buildSql).toHaveBeenCalledWith(
      expect.objectContaining({ month: "2026-03", goal: 8 }),
    )
    expect(store.activeDashboardId).toBeNull()
    expect(store.activeDashboardViewModel).toBeNull()
    expect(store.advancedMode).toBe(true)
    expect(store.advancedSql).toBe("SELECT 1")
    expect(store.draft.template.name).toBe("测试仪表板 (定制)")
    expect(store.draft.template.viewType).toBe("dashboard")

    const stored = currentPlugin.read(QUERY_TEMPLATE_STORAGE_KEY) as Array<{ name: string, viewType: string }>
    const saved = Array.isArray(stored) ? stored.find(item => item.name === "测试仪表板 (定制)") : undefined
    expect(saved).toBeDefined()
    expect(saved?.viewType).toBe("dashboard")
  })

  it("saveDashboardAsTemplate uses the first SQL statement when buildSql returns an array", async () => {
    dashboardMocks.definition.buildSql.mockImplementation(() => ["SELECT 1", "SELECT 2"])
    const store = createQueryBuilderStore()
    await store.loadDashboard("test-board")

    await store.saveDashboardAsTemplate()

    expect(store.advancedSql).toBe("SELECT 1")
    expect(store.advancedMode).toBe(true)
  })

  it("saveDashboardAsTemplate is a no-op without an active dashboard", async () => {
    const store = createQueryBuilderStore()

    await store.saveDashboardAsTemplate()

    expect(dashboardMocks.definition.buildSql).not.toHaveBeenCalled()
    expect(store.advancedMode).toBe(false)
    expect(store.advancedSql).toBe("")
  })

  it("saveDashboardAsTemplate is a no-op when the definition is missing", async () => {
    const store = createQueryBuilderStore()
    await store.loadDashboard("test-board")
    dashboardMocks.getDashboardDefinition.mockImplementation(() => undefined)

    await store.saveDashboardAsTemplate()

    expect(dashboardMocks.definition.buildSql).not.toHaveBeenCalled()
    expect(store.advancedMode).toBe(false)
    expect(store.advancedSql).toBe("")
    expect(store.activeDashboardId).toBe("test-board")
  })

  it("applySnapshot closes the active dashboard before applying the snapshot", async () => {
    const store = createQueryBuilderStore()
    await store.loadDashboard("test-board")
    const snapshot = JSON.parse(JSON.stringify(store.draft)) as typeof store.draft
    snapshot.template.name = "快照应用"

    await store.applySnapshot(snapshot)

    expect(store.activeDashboardId).toBeNull()
    expect(store.activeDashboardViewModel).toBeNull()
    expect(store.draft.template.name).toBe("快照应用")
  })

  it("loadTemplate closes the active dashboard before loading the template", async () => {
    currentPlugin.seed(QUERY_TEMPLATE_STORAGE_KEY, [
      {
        id: "template-1",
        version: 1,
        name: "项目看板",
        scope: { type: "all_blocks" },
        filters: [],
        sorts: [],
        fields: ["content"],
        viewType: "table",
      },
    ])
    const store = createQueryBuilderStore()
    await store.loadDashboard("test-board")

    await store.loadTemplate("template-1")

    expect(store.activeDashboardId).toBeNull()
    expect(store.activeDashboardViewModel).toBeNull()
    expect(store.draft.template.id).toBe("template-1")
  })

  it("resetDraft closes the active dashboard before resetting the draft", async () => {
    const store = createQueryBuilderStore()
    const defaultTemplateName = store.draft.template.name
    await store.loadDashboard("test-board")
    store.draft.template.name = "已修改"

    store.resetDraft()

    expect(store.activeDashboardId).toBeNull()
    expect(store.draft.template.name).toBe(defaultTemplateName)
    expect(store.draft.template.name).not.toBe("已修改")
  })
})
