import { beforeEach, describe, expect, it, vi } from "vitest"

function createPlugin() {
  return {
    app: { appId: "app-1" },
    addTab: vi.fn(),
    loadData: vi.fn(async () => null),
    saveData: vi.fn(async () => {}),
    name: "siyuan-query-builder",
  }
}

async function loadMainModule() {
  const dialogCtor = vi.fn()
  const openTab = vi.fn(async () => ({ id: "tab-1" }))
  const showMessage = vi.fn()
  const applySnapshotMock = vi.fn()
  const loadDashboardMock = vi.fn(async () => {})
  const loadTemplateMock = vi.fn(async () => {})

  vi.doMock("@/external/siyuan", () => {
    class FakeDialog {
      element = document.createElement("div")
      destroyCallback?: () => void
      destroy = vi.fn(() => {
        this.destroyCallback?.()
      })

      constructor(options?: { content?: string, destroyCallback?: () => void }) {
        if (options?.content) {
          this.element.innerHTML = options.content
        }
        this.destroyCallback = options?.destroyCallback
        dialogCtor(options)
      }
    }

    return {
      Dialog: FakeDialog,
      openTab,
      showMessage,
    }
  })

  vi.doMock("@/App.vue", () => ({
    default: {
      template: "<div>Query Builder</div>",
    },
  }))

  const main = await import("@/main")
  return {
    ...main,
    dialogCtor,
    openTab,
    showMessage,
    applySnapshotMock,
    loadDashboardMock,
    loadTemplateMock,
  }
}

describe("main open mode", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("registers workspace tab and independent scenario dashboard tabs on init", async () => {
    const plugin = createPlugin()
    const { destroy, init } = await loadMainModule()

    init(plugin as any)

    expect(plugin.addTab).toHaveBeenCalledWith(expect.objectContaining({
      type: "workspace",
      init: expect.any(Function),
    }))
    expect(plugin.addTab).toHaveBeenCalledWith(expect.objectContaining({
      type: "dashboard-daily-cockpit",
      init: expect.any(Function),
    }))
    expect(plugin.addTab).toHaveBeenCalledWith(expect.objectContaining({
      type: "dashboard-habit-tracker",
      init: expect.any(Function),
    }))

    destroy()
  })

  it("opens an independent dashboard tab with openDashboardTab", async () => {
    const plugin = createPlugin()
    const {
      destroy,
      init,
      openDashboardTab,
      openTab,
    } = await loadMainModule()

    init(plugin as any)
    await openDashboardTab("habit-tracker")

    expect(openTab).toHaveBeenCalledWith(expect.objectContaining({
      app: plugin.app,
      custom: expect.objectContaining({
        id: "siyuan-query-builderdashboard-habit-tracker",
        title: "易搭 - 微习惯打卡与精力大盘",
        icon: "iconQueryBuilder",
      }),
      openNewTab: true,
    }))

    destroy()
  })

  it("opens the query builder in a dialog by default", async () => {
    const plugin = createPlugin()
    const {
      destroy,
      dialogCtor,
      init,
      openPanel,
      openTab,
    } = await loadMainModule()

    init(plugin as any)
    await openPanel(false, "dialog")

    expect(dialogCtor).toHaveBeenCalledTimes(1)
    expect(openTab).not.toHaveBeenCalled()

    destroy()
  })

  it("opens the query builder in a custom tab when tab mode is selected", async () => {
    const plugin = createPlugin()
    const {
      destroy,
      init,
      openPanel,
      openTab,
    } = await loadMainModule()

    init(plugin as any)
    await openPanel(false, "dialog")
    await openPanel(false, "tab")

    expect(openTab).toHaveBeenCalledTimes(1)
    expect(openTab).toHaveBeenCalledWith(expect.objectContaining({
      app: plugin.app,
      custom: expect.objectContaining({
        title: "易搭 Query Builder",
        icon: "iconQueryBuilder",
      }),
    }))

    destroy()
  })

  it("routes a preset snapshot via pendingTarget and applies it when the store is ready", async () => {
    const plugin = createPlugin()
    const {
      applySnapshotMock,
      destroy,
      dialogCtor,
      getPendingWorkspaceTarget,
      init,
      openWorkspaceWithPreset,
      setActiveWorkspaceStore,
    } = await loadMainModule()

    init(plugin as any)
    setActiveWorkspaceStore({
      applySnapshot: applySnapshotMock,
      loadDashboard: vi.fn(),
      loadTemplate: vi.fn(),
      runActiveDashboard: vi.fn(),
    })

    const snapshot = { template: { name: "预设" }, view: { type: "table" } }
    await openWorkspaceWithPreset(snapshot, "dialog")

    expect(dialogCtor).toHaveBeenCalledTimes(1)
    expect(applySnapshotMock).toHaveBeenCalledWith(snapshot)
    // pendingTarget 已写入并可在挂载时消费,读取后清空
    expect(getPendingWorkspaceTarget()).toEqual({ snapshot })
    expect(getPendingWorkspaceTarget()).toBeNull()

    destroy()
  })

  it("leaves the preset in pendingTarget when the workspace store is not ready yet", async () => {
    const plugin = createPlugin()
    const {
      destroy,
      getPendingWorkspaceTarget,
      init,
      openWorkspaceWithPreset,
    } = await loadMainModule()

    init(plugin as any)
    // 不调用 setActiveWorkspaceStore —— App.vue 尚未挂载

    await openWorkspaceWithPreset({ template: {} }, "dialog")

    expect(getPendingWorkspaceTarget()).toEqual({ snapshot: { template: {} } })
    destroy()
  })

  it("routes a template id via pendingTarget and awaits the store load", async () => {
    const plugin = createPlugin()
    const {
      destroy,
      init,
      loadTemplateMock,
      openWorkspaceWithTemplate,
      setActiveWorkspaceStore,
    } = await loadMainModule()

    init(plugin as any)
    const loadDashboard = vi.fn()
    setActiveWorkspaceStore({
      applySnapshot: vi.fn(),
      loadDashboard,
      loadTemplate: loadTemplateMock,
      runActiveDashboard: vi.fn(),
    })

    await openWorkspaceWithTemplate("template-9", "dialog")

    expect(loadTemplateMock).toHaveBeenCalledWith("template-9")
    expect(loadDashboard).not.toHaveBeenCalled()
    destroy()
  })

  it("routes an empty dashboard id straight to the panel without pendingTarget", async () => {
    const plugin = createPlugin()
    const {
      destroy,
      getPendingWorkspaceTarget,
      init,
      openTab,
      openWorkspaceWithDashboard,
    } = await loadMainModule()

    init(plugin as any)

    await openWorkspaceWithDashboard("", "tab")

    expect(openTab).toHaveBeenCalledTimes(1)
    expect(getPendingWorkspaceTarget()).toBeNull()
    destroy()
  })

  it("writes the dashboard id into pendingTarget and loads it on the dialog route", async () => {
    const plugin = createPlugin()
    const {
      destroy,
      getPendingWorkspaceTarget,
      init,
      loadDashboardMock,
      openWorkspaceWithDashboard,
      setActiveWorkspaceStore,
    } = await loadMainModule()

    init(plugin as any)
    setActiveWorkspaceStore({
      applySnapshot: vi.fn(),
      loadDashboard: loadDashboardMock,
      loadTemplate: vi.fn(),
      runActiveDashboard: vi.fn(),
    })

    await openWorkspaceWithDashboard("daily-cockpit", "dialog")

    expect(getPendingWorkspaceTarget()).toEqual({ dashboardId: "daily-cockpit" })
    expect(loadDashboardMock).toHaveBeenCalledWith("daily-cockpit")
    destroy()
  })

  it("supports repeated init after destroy and clears stale pending targets", async () => {
    const plugin = createPlugin()
    const {
      destroy,
      getPendingWorkspaceTarget,
      init,
      openWorkspaceWithPreset,
    } = await loadMainModule()

    init(plugin as any)
    await openWorkspaceWithPreset({ template: {} }, "dialog")
    destroy()

    // destroy 后遗留的 pendingTarget 被清理,避免下一次挂载误消费
    expect(getPendingWorkspaceTarget()).toBeNull()

    init(plugin as any)
    expect(plugin.addTab).toHaveBeenCalledTimes(12) // 6 + 6(重复注册成功)
    destroy()
  })
})
