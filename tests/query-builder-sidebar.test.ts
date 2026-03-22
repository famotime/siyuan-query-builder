import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"
import { reactive } from "vue"

let currentStore: any

vi.mock("@/composables/query-builder-store", () => ({
  useQueryBuilderStore: () => currentStore,
}))

import QueryBuilderSidebar from "@/components/query-builder/QueryBuilderSidebar.vue"

function createStore() {
  return reactive({
    loading: false,
    currentTemplateId: "template-1",
    recentQueryHistory: [],
    savedTemplateSummaries: [
      {
        templateId: "template-1",
        templateName: "任务清单",
        defaultViewType: "table",
        viewCount: 1,
      },
    ],
    presets: [],
    applySnapshot: vi.fn(),
    loadTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    restoreQueryHistory: vi.fn(),
    resetDraft: vi.fn(),
    runQuery: vi.fn(),
  })
}

describe("QueryBuilderSidebar", () => {
  it("deletes a saved template without applying it", async () => {
    currentStore = createStore()
    const wrapper = mount(QueryBuilderSidebar)
    const deleteButton = wrapper.get('[data-template-delete="template-1"]')

    expect(deleteButton.get("svg").exists()).toBe(true)

    await deleteButton.trigger("click")

    expect(currentStore.deleteTemplate).toHaveBeenCalledWith("template-1")
    expect(currentStore.applySnapshot).not.toHaveBeenCalled()
  })

  it("collapses and expands preset and saved template sections", async () => {
    currentStore = createStore()
    currentStore.presets = [
      {
        id: "preset-1",
        title: "任务面板",
        description: "查看任务",
        snapshot: {},
      },
    ]

    const wrapper = mount(QueryBuilderSidebar)
    expect(wrapper.get('[data-section-toggle="presets"]').get("svg").exists()).toBe(true)
    expect(wrapper.get('[data-section-toggle="saved-templates"]').get("svg").exists()).toBe(true)

    expect(wrapper.text()).toContain("任务面板")
    expect(wrapper.text()).toContain("任务清单")

    await wrapper.get('[data-section-toggle="presets"]').trigger("click")
    expect(wrapper.text()).not.toContain("任务面板")
    expect(wrapper.text()).toContain("任务清单")

    await wrapper.get('[data-section-toggle="saved-templates"]').trigger("click")
    expect(wrapper.text()).not.toContain("任务清单")

    await wrapper.get('[data-section-toggle="presets"]').trigger("click")
    await wrapper.get('[data-section-toggle="saved-templates"]').trigger("click")

    expect(wrapper.text()).toContain("任务面板")
    expect(wrapper.text()).toContain("任务清单")
  })

  it("shows the saved default view label from the actual view type", () => {
    currentStore = createStore()
    currentStore.savedTemplateSummaries = [
      {
        templateId: "template-1",
        templateName: "任务清单",
        defaultViewType: "cards",
        viewCount: 2,
      },
      {
        templateId: "template-2",
        templateName: "阅读清单",
        defaultViewType: "list",
        viewCount: 3,
      },
    ]

    const wrapper = mount(QueryBuilderSidebar)

    expect(wrapper.text()).toContain("统计卡片")
    expect(wrapper.text()).toContain("列表")
    expect(wrapper.text()).toContain("2 个视图")
    expect(wrapper.text()).toContain("3 个视图")
  })

  it("loads a template by id instead of replaying a stored snapshot", async () => {
    currentStore = createStore()
    currentStore.currentTemplateId = "template-2"
    currentStore.savedTemplateSummaries = [
      {
        templateId: "template-1",
        templateName: "任务清单",
        defaultViewType: "table",
        viewCount: 1,
      },
      {
        templateId: "template-2",
        templateName: "项目看板",
        defaultViewType: "board",
        viewCount: 2,
      },
    ]

    const wrapper = mount(QueryBuilderSidebar)

    expect(wrapper.get('[data-template-load="template-2"]').attributes("data-active")).toBe("true")

    await wrapper.get('[data-template-load="template-1"]').trigger("click")

    expect(currentStore.loadTemplate).toHaveBeenCalledWith("template-1")
    expect(currentStore.applySnapshot).not.toHaveBeenCalled()
  })

  it("renders recent query history and restores a selected record", async () => {
    currentStore = createStore()
    currentStore.recentQueryHistory = [
      {
        id: "history-1",
        templateName: "逾期任务",
        summary: "全部内容 · 1 个条件 · 表格",
        executedAt: "2026-03-22T08:30:00.000Z",
      },
    ]

    const wrapper = mount(QueryBuilderSidebar)

    expect(wrapper.text()).toContain("历史记录")
    expect(wrapper.text()).toContain("逾期任务")
    expect(wrapper.text()).toContain("1 个条件")

    await wrapper.get('[data-history-load="history-1"]').trigger("click")

    expect(currentStore.restoreQueryHistory).toHaveBeenCalledWith("history-1")
  })
})
