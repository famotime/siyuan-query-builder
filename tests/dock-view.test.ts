import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

import PluginClass from "@/index"
import QueryBuilderDock from "@/components/query-builder/QueryBuilderDock.vue"
import { SCENARIO_DASHBOARDS } from "@/core/dashboard/catalog"

const openWorkspaceWithDashboardMock = vi.fn()
const openWorkspaceWithPresetMock = vi.fn()
const openWorkspaceWithTemplateMock = vi.fn()
const openDashboardTabMock = vi.fn()

vi.mock("@/main", () => ({
  usePlugin: () => ({
    loadData: vi.fn(async () => []),
  }),
  openDashboardTab: (...args: any[]) => openDashboardTabMock(...args),
  openWorkspaceWithDashboard: (...args: any[]) => openWorkspaceWithDashboardMock(...args),
  openWorkspaceWithPreset: (...args: any[]) => openWorkspaceWithPresetMock(...args),
  openWorkspaceWithTemplate: (...args: any[]) => openWorkspaceWithTemplateMock(...args),
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

describe("QueryBuilderDock and SiYuan Dock Integration", () => {
  beforeEach(() => {
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
    const wrapper = mount(QueryBuilderDock)

    const dashboardItems = wrapper.findAll(".sqb-dock__item--dashboard")
    expect(dashboardItems.length).toBe(SCENARIO_DASHBOARDS.length)
    expect(dashboardItems.length).toBe(5)

    const text = wrapper.text()
    for (const d of SCENARIO_DASHBOARDS) {
      expect(text).toContain(d.title)
    }
  })

  it("triggers openDashboardTab to open an independent tab when a dashboard item is clicked", async () => {
    const wrapper = mount(QueryBuilderDock)

    const dashboardItems = wrapper.findAll(".sqb-dock__item--dashboard")
    expect(dashboardItems.length).toBeGreaterThan(0)

    // Click first dashboard
    await dashboardItems[0].trigger("click")
    expect(openDashboardTabMock).toHaveBeenCalledWith("daily-cockpit")

    // Click second dashboard
    await dashboardItems[1].trigger("click")
    expect(openDashboardTabMock).toHaveBeenCalledWith("habit-tracker")
  })

  it("provides buttons to open workspace in tab and dialog modes", async () => {
    const wrapper = mount(QueryBuilderDock)

    const actionButtons = wrapper.findAll(".sqb-dock__btn-icon")
    expect(actionButtons.length).toBe(2)

    // Click tab open button
    await actionButtons[0].trigger("click")
    expect(openWorkspaceWithDashboardMock).toHaveBeenCalledWith("", "tab")

    // Click dialog open button
    await actionButtons[1].trigger("click")
    expect(openWorkspaceWithDashboardMock).toHaveBeenCalledWith("", "dialog")
  })
})
