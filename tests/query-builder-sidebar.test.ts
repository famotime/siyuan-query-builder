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
    exportTemplateBundle: vi.fn(async () => ({ template: { name: "任务清单" }, views: [] })),
    importTemplateBundle: vi.fn(async () => "template-imported"),
    loadTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    restoreQueryHistory: vi.fn(),
    resetDraft: vi.fn(),
    runQuery: vi.fn(),
  })
}

describe("QueryBuilderSidebar", () => {
  it("renders the real plugin icon in the hero brand instead of a text placeholder", () => {
    currentStore = createStore()
    const wrapper = mount(QueryBuilderSidebar)
    const icon = wrapper.get('[data-plugin-icon]')

    expect(icon.element.tagName).toBe('IMG')
    expect(icon.attributes('src')).toContain('icon.png')
    expect(wrapper.text()).not.toContain('QB')
  })

  it("deletes a saved template without applying it", async () => {
    currentStore = createStore()
    const wrapper = mount(QueryBuilderSidebar)
    const deleteButton = wrapper.get('[data-template-delete="template-1"]')

    expect(deleteButton.get("svg").exists()).toBe(true)

    await deleteButton.trigger("click")

    expect(currentStore.deleteTemplate).toHaveBeenCalledWith("template-1")
    expect(currentStore.applySnapshot).not.toHaveBeenCalled()
  })

  it("groups presets by category and collapses each category independently", async () => {
    currentStore = createStore()
    currentStore.presets = [
      {
        id: "preset-1",
        category: "daily",
        title: "任务清单",
        description: "查看任务",
        snapshot: {},
      },
      {
        id: "preset-2",
        category: "links",
        title: "高反链核心笔记",
        description: "查看链接",
        snapshot: {},
      },
      {
        id: "preset-3",
        category: "attributes",
        title: "项目看板",
        description: "查看属性",
        snapshot: {},
      },
    ]

    const wrapper = mount(QueryBuilderSidebar)
    expect(wrapper.get('[data-section-toggle="presets"]').get("svg").exists()).toBe(true)
    expect(wrapper.get('[data-section-toggle="saved-templates"]').get("svg").exists()).toBe(true)
    expect(wrapper.get('[data-presets-count]').text()).toBe("3")

    expect(wrapper.text()).toContain("日常管理")
    expect(wrapper.text()).toContain("链接管理")
    expect(wrapper.text()).toContain("自定义属性")
    expect(wrapper.text()).toContain("任务清单")
    expect(wrapper.text()).toContain("高反链核心笔记")
    expect(wrapper.text()).toContain("项目看板")
    expect(wrapper.get('[data-preset-category-toggle="daily"]').classes()).toContain("preset-group__toggle")
    expect(wrapper.get('[data-preset-category-icon="daily"]').exists()).toBe(true)
    expect(wrapper.get('[data-preset-category="links"]').classes()).toContain("preset-group--separated")

    await wrapper.get('[data-preset-category-toggle="daily"]').trigger("click")
    expect(wrapper.findAll(".preset-group .item strong").map(item => item.text())).not.toContain("任务清单")
    expect(wrapper.text()).toContain("高反链核心笔记")
    expect(wrapper.text()).toContain("项目看板")

    await wrapper.get('[data-section-toggle="presets"]').trigger("click")
    expect(wrapper.text()).not.toContain("高反链核心笔记")
    await wrapper.get('[data-section-toggle="saved-templates"]').trigger("click")
    expect(wrapper.text()).not.toContain("任务清单")

    await wrapper.get('[data-section-toggle="presets"]').trigger("click")
    await wrapper.get('[data-section-toggle="saved-templates"]').trigger("click")

    expect(wrapper.text()).toContain("日常管理")
  })

  it("shows merged saved-template metadata as muted copy below the template name", () => {
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
    const firstSummary = wrapper.get('[data-template-summary="template-1"]')
    const secondSummary = wrapper.get('[data-template-summary="template-2"]')

    expect(firstSummary.text()).toBe("默认：卡片 · 2 个视图")
    expect(secondSummary.text()).toBe("默认：列表 · 3 个视图")
    expect(firstSummary.element.tagName).toBe("SPAN")
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

  it("exports a saved template bundle from the sidebar action", async () => {
    currentStore = createStore()
    const createObjectURL = vi.fn(() => "blob:template")
    const revokeObjectURL = vi.fn()
    const click = vi.fn()
    const originalCreateElement = document.createElement.bind(document)

    Object.defineProperty(window, "URL", {
      configurable: true,
      value: {
        createObjectURL,
        revokeObjectURL,
      },
    })

    vi.spyOn(document, "createElement").mockImplementation(((tagName: string) => {
      if (tagName === "a") {
        return {
          click,
          download: "",
          href: "",
        } as any
      }
      return originalCreateElement(tagName)
    }) as typeof document.createElement)

    const wrapper = mount(QueryBuilderSidebar)
    const exportButton = wrapper.get('[data-template-export="template-1"]')

    expect(exportButton.text()).toBe("")
    expect(exportButton.get("svg").exists()).toBe(true)

    await exportButton.trigger("click")

    expect(currentStore.exportTemplateBundle).toHaveBeenCalledWith("template-1")
    expect(createObjectURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:template")
  })

  it("imports a template bundle from the sidebar file input", async () => {
    currentStore = createStore()
    const wrapper = mount(QueryBuilderSidebar)
    const importButton = wrapper.get('[data-template-import-trigger]')
    const file = {
      text: vi.fn(async () => '{"schema":"siyuan-query-builder/template-bundle"}'),
    }
    const input = wrapper.get('[data-template-import-input]').element as HTMLInputElement

    expect(importButton.text()).toBe("")
    expect(importButton.get("svg").exists()).toBe(true)

    Object.defineProperty(input, "files", {
      configurable: true,
      value: [file],
    })

    await wrapper.get('[data-template-import-input]').trigger("change")

    expect(file.text).toHaveBeenCalled()
    expect(currentStore.importTemplateBundle).toHaveBeenCalledWith('{"schema":"siyuan-query-builder/template-bundle"}')
  })
})
