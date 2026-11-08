import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

import PluginClass from "@/index"
import QueryBuilderDock from "@/components/query-builder/QueryBuilderDock.vue"
import { SCENARIO_DASHBOARDS } from "@/core/dashboard/catalog"
import { QUERY_HISTORY_STORAGE_KEY } from "@/core/storage/query-history-store"
import { QUERY_TEMPLATE_STORAGE_KEY } from "@/core/storage/query-template-store"
import { workspaceNavigationKey } from "@/ui/workspace-navigation"

class FakeDockPluginStorage {
  i18n: Record<string, string> = {}
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
}

let currentPlugin = new FakeDockPluginStorage()

const navigationMocks = {
  openWorkspaceWithDashboard: vi.fn(async () => {}),
  openWorkspaceWithPreset: vi.fn(async () => {}),
  openWorkspaceWithTemplate: vi.fn(async () => {}),
  openDashboardTab: vi.fn(async () => {}),
}

vi.mock("@/main", () => ({
  usePlugin: () => currentPlugin,
  openDashboardTab: (...args: any[]) => navigationMocks.openDashboardTab(...args),
  openWorkspaceWithDashboard: (...args: any[]) => navigationMocks.openWorkspaceWithDashboard(...args),
  openWorkspaceWithPreset: (...args: any[]) => navigationMocks.openWorkspaceWithPreset(...args),
  openWorkspaceWithTemplate: (...args: any[]) => navigationMocks.openWorkspaceWithTemplate(...args),
  init: vi.fn(),
  destroy: vi.fn(),
  mountDock: vi.fn(),
  unmountDock: vi.fn(),
  openPanel: vi.fn(),
}))

vi.mock("@/inline/service", () => ({
  createInlineBlockRenderer: vi.fn(() => ({
    start: vi.fn(),
    destroy: vi.fn(),
  })),
}))

function mountDock() {
  return mount(QueryBuilderDock, {
    global: {
      provide: {
        [workspaceNavigationKey as unknown as symbol]: navigationMocks,
      },
    },
  })
}

describe("QueryBuilderDock and SiYuan Dock Integration", () => {
  beforeEach(() => {
    currentPlugin = new FakeDockPluginStorage()
    vi.clearAllMocks()
  })

  it("registers RightTop dock tab upon plugin onload", async () => {
    const plugin = new PluginClass({
      app: { appId: "test-app" },
      name: "siyuan-query-builder",
      i18n: {},
    } as any)

    await plugin.onload()

    expect(plugin.dockDefinitions).toHaveLength(1)
    const dockDef = plugin.dockDefinitions[0]
    expect(dockDef.type).toBe("query-builder-dock")
    expect(dockDef.config.position).toBe("RightTop")
    expect(dockDef.config.icon).toBe("iconQueryBuilder")
    expect(dockDef.config.title).toBe("易搭")
  })

  it("renders all 5 scenario dashboards in QueryBuilderDock component", async () => {
    const wrapper = mountDock()

    const dashboardItems = wrapper.findAll(".sqb-dock__item--dashboard")
    expect(dashboardItems.length).toBe(SCENARIO_DASHBOARDS.length)
    expect(dashboardItems.length).toBe(5)

    const text = wrapper.text()
    for (const d of SCENARIO_DASHBOARDS) {
      expect(text).toContain(d.title)
    }
  })

  it("triggers openDashboardTab to open an independent tab when a dashboard item is clicked", async () => {
    const wrapper = mountDock()

    const dashboardItems = wrapper.findAll(".sqb-dock__item--dashboard")
    expect(dashboardItems.length).toBeGreaterThan(0)

    // Click first dashboard
    await dashboardItems[0].trigger("click")
    expect(navigationMocks.openDashboardTab).toHaveBeenCalledWith("daily-cockpit")

    // Click second dashboard
    await dashboardItems[1].trigger("click")
    expect(navigationMocks.openDashboardTab).toHaveBeenCalledWith("habit-tracker")
  })

  it("provides buttons to open workspace in tab and dialog modes", async () => {
    const wrapper = mountDock()

    const actionButtons = wrapper.findAll(".sqb-dock__btn-icon")
    expect(actionButtons.length).toBe(2)

    // Click tab open button
    await actionButtons[0].trigger("click")
    expect(navigationMocks.openWorkspaceWithDashboard).toHaveBeenCalledWith("", "tab")

    // Click dialog open button
    await actionButtons[1].trigger("click")
    expect(navigationMocks.openWorkspaceWithPreset).not.toHaveBeenCalled()
    expect(navigationMocks.openWorkspaceWithDashboard).toHaveBeenLastCalledWith("", "dialog")
  })

  it("opens the workspace with the preset snapshot when a preset item is clicked", async () => {
    const wrapper = mountDock()

    // 预设场景默认折叠,先展开
    const presetsHead = wrapper.findAll(".sqb-dock__section-head")
      .find(node => node.text().includes("预设场景"))!
    await presetsHead.trigger("click")

    const presetItems = wrapper.findAll(".sqb-dock__section")
      .find(section => section.text().includes("预设场景"))!
      .findAll(".sqb-dock__item")
    expect(presetItems.length).toBeGreaterThan(0)
    const firstPreset = presetItems[0]

    await firstPreset.trigger("click")

    expect(navigationMocks.openWorkspaceWithPreset).toHaveBeenCalledTimes(1)
    const snapshot = navigationMocks.openWorkspaceWithPreset.mock.calls[0][0]
    expect(snapshot).toBeTypeOf("object")
    expect(snapshot).toHaveProperty("template")
    expect(snapshot).toHaveProperty("view")
  })

  it("lists saved templates from v2 storage and opens them by template id", async () => {
    currentPlugin.seed(QUERY_TEMPLATE_STORAGE_KEY, [
      {
        id: "template-1",
        version: 1,
        name: "项目跟踪",
        scope: { type: "all_blocks" },
        filters: [],
        sorts: [],
        fields: ["content"],
        viewType: "board",
      },
      {
        id: "template-2",
        version: 1,
        name: "周报汇总",
        scope: { type: "all_blocks" },
        filters: [],
        sorts: [],
        fields: ["content"],
        viewType: "table",
      },
    ])

    const wrapper = mountDock()
    await new Promise(resolve => setTimeout(resolve, 0))

    const text = wrapper.text()
    expect(text).toContain("项目跟踪")
    expect(text).toContain("周报汇总")

    const templateItems = wrapper.findAll(".sqb-dock__section")
      .find(section => section.text().includes("已保存模板"))!
      .findAll(".sqb-dock__item")
    expect(templateItems.length).toBe(2)

    await templateItems[1].trigger("click")
    expect(navigationMocks.openWorkspaceWithTemplate).toHaveBeenCalledWith("template-2")
  })

  it("lists recent history entries and restores them via the preset channel", async () => {
    currentPlugin.seed(QUERY_HISTORY_STORAGE_KEY, [
      {
        id: "history-1",
        templateName: "最近查询 A",
        summary: "全部内容 · 1 个条件 · 表格",
        executedAt: "2026-11-08T00:00:00.000Z",
        snapshot: { template: { name: "最近查询 A" }, view: { type: "table" } },
      },
      {
        id: "history-2",
        templateName: "最近查询 B",
        summary: "全部内容 · 0 个条件 · 卡片",
        executedAt: "2026-11-07T00:00:00.000Z",
        snapshot: { template: { name: "最近查询 B" }, view: { type: "cards" } },
      },
    ])

    const wrapper = mountDock()
    await new Promise(resolve => setTimeout(resolve, 0))

    // 最近查询默认折叠,先展开
    const historyHead = wrapper.findAll(".sqb-dock__section-head")
      .find(node => node.text().includes("最近查询"))!
    await historyHead.trigger("click")

    const text = wrapper.text()
    expect(text).toContain("最近查询 A")
    expect(text).toContain("最近查询 B")

    const historyItems = wrapper.findAll(".sqb-dock__section")
      .find(section => section.text().includes("最近查询"))!
      .findAll(".sqb-dock__item")
    expect(historyItems.length).toBe(2)

    await historyItems[0].trigger("click")
    expect(navigationMocks.openWorkspaceWithPreset).toHaveBeenCalledWith(
      expect.objectContaining({ template: { name: "最近查询 A" } }),
    )
  })

  it("renders without template/history sections and does not throw on corrupted storage data", async () => {
    currentPlugin.seed(QUERY_TEMPLATE_STORAGE_KEY, "corrupted-not-an-array")
    currentPlugin.seed(QUERY_HISTORY_STORAGE_KEY, { broken: true })

    const wrapper = mountDock()
    await new Promise(resolve => setTimeout(resolve, 0))

    const text = wrapper.text()
    expect(text).not.toContain("已保存模板")
    expect(text).not.toContain("最近查询")
    // 仪表板与预设区块不受影响
    expect(wrapper.findAll(".sqb-dock__item--dashboard").length).toBe(5)
  })
})
