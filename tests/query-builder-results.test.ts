import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"
import { reactive } from "vue"

const { showMessage } = vi.hoisted(() => ({
  showMessage: vi.fn(),
}))

let currentStore: any

vi.mock("@/composables/query-builder-store", () => ({
  useQueryBuilderStore: () => currentStore,
}))

vi.mock("@/external/siyuan", () => ({
  showMessage,
}))

import QueryBuilderResults from "@/components/query-builder/QueryBuilderResults.vue"

function createStore() {
  return reactive({
    resultSummary: "还没有执行查询。",
    embedParentId: "",
    embedTargetHint: "",
    currentDocumentTarget: null,
    openDocumentTargets: [],
    recentEmbedTargets: [],
    error: "",
    advancedMode: false,
    advancedSql: "",
    resultSet: null,
    savedViews: [],
    draft: {
      template: {
        id: "template-1",
        fields: ["content", "updated"],
        viewType: "table",
      },
      view: {
        id: "view-1",
        type: "table",
        fieldMappings: {
          project: "project",
          priority: "priority",
          dueDate: "dueDate",
        },
      },
    },
    fieldLabel: (field: string) => field,
    refreshCurrentDocumentTarget: async () => {},
    selectCurrentDocumentTarget: async () => true,
    selectEmbedTarget: async () => true,
    insertEmbed: () => {},
    setViewType: (type: string) => {
      currentStore.draft.view.type = type
      currentStore.draft.template.viewType = type
    },
    saveViewAs: async () => true,
    loadSavedView: async () => true,
    setDefaultSavedView: async () => true,
    deleteSavedView: async () => true,
    editableField: () => null,
    displayValue: () => "",
    quickEdit: () => {},
    openBlock: () => {},
    boardColumns: [],
    boardDragCapability: {
      enabled: true,
      reason: "",
    },
    draggingRowId: "",
    dropToColumn: () => {},
    listItems: [],
    cardsSummary: [],
  })
}

describe("QueryBuilderResults", () => {
  it("shows view type switcher in the results header", () => {
    currentStore = createStore()
    const wrapper = mount(QueryBuilderResults)

    expect(wrapper.text()).toContain("查询结果预览")
    expect(wrapper.find("[data-view-type=\"table\"]").exists()).toBe(true)
    expect(wrapper.find("[data-view-type=\"board\"]").exists()).toBe(true)
    expect(wrapper.find("[data-view-type=\"list\"]").exists()).toBe(true)
    expect(wrapper.find("[data-view-type=\"cards\"]").exists()).toBe(true)
  })

  it("shows board drag capability guidance before dragging", () => {
    currentStore = createStore()
    currentStore.draft.view.type = "board"
    currentStore.boardDragCapability = {
      enabled: false,
      reason: "当前分组不支持拖拽回写，只有按状态分组时才能拖拽改状态。",
    }

    const wrapper = mount(QueryBuilderResults)

    expect(wrapper.text()).toContain("当前分组不支持拖拽回写，只有按状态分组时才能拖拽改状态。")
  })

  it("prefers loading the matching saved view when switching tabs so the active card and result view stay in sync", async () => {
    currentStore = createStore()
    currentStore.savedViews = [
      {
        id: "view-1",
        queryTemplateId: "template-1",
        type: "table",
        defaultView: true,
      },
      {
        id: "view-2",
        queryTemplateId: "template-1",
        type: "board",
        defaultView: false,
      },
    ]
    currentStore.setViewType = vi.fn((type: string) => {
      currentStore.draft.view.type = type
      currentStore.draft.template.viewType = type
    })
    currentStore.loadSavedView = vi.fn(async (viewId: string) => {
      const nextView = currentStore.savedViews.find((view: any) => view.id === viewId)
      if (!nextView) {
        return false
      }
      currentStore.draft.view.id = nextView.id
      currentStore.draft.view.type = nextView.type
      currentStore.draft.template.viewType = nextView.type
      return true
    })

    const wrapper = mount(QueryBuilderResults)
    await wrapper.get('[data-view-type="board"]').trigger("click")

    expect(currentStore.loadSavedView).toHaveBeenCalledWith("view-2")
    expect(currentStore.setViewType).not.toHaveBeenCalled()
    expect(currentStore.draft.view.id).toBe("view-2")
    expect(currentStore.draft.view.type).toBe("board")
    expect(currentStore.draft.template.viewType).toBe("board")
    expect(wrapper.get('[data-view-type="board"]').classes()).toContain("tabs__item--active")
  })

  it("falls back to setViewType when no saved view matches the requested tab", async () => {
    currentStore = createStore()
    currentStore.savedViews = [
      {
        id: "view-1",
        queryTemplateId: "template-1",
        type: "table",
        defaultView: true,
      },
    ]
    currentStore.setViewType = vi.fn((type: string) => {
      currentStore.draft.view.type = type
      currentStore.draft.template.viewType = type
    })
    currentStore.loadSavedView = vi.fn(async () => false)

    const wrapper = mount(QueryBuilderResults)
    await wrapper.get('[data-view-type="list"]').trigger("click")

    expect(currentStore.loadSavedView).not.toHaveBeenCalled()
    expect(currentStore.setViewType).toHaveBeenCalledWith("list")
    expect(currentStore.draft.view.type).toBe("list")
  })

  it("shows a default badge on every saved view card and lets the whole card click switch the active saved view", async () => {
    currentStore = createStore()
    currentStore.savedViews = [
      {
        id: "view-1",
        queryTemplateId: "template-1",
        type: "table",
        defaultView: true,
      },
      {
        id: "view-2",
        queryTemplateId: "template-1",
        type: "board",
        defaultView: false,
      },
    ]
    currentStore.loadSavedView = vi.fn(async (viewId: string) => {
      const nextView = currentStore.savedViews.find((view: any) => view.id === viewId)
      if (!nextView) {
        return false
      }
      currentStore.draft.view.id = nextView.id
      currentStore.draft.view.type = nextView.type
      currentStore.draft.template.viewType = nextView.type
      return true
    })
    currentStore.setDefaultSavedView = vi.fn(async () => true)
    currentStore.deleteSavedView = vi.fn(async () => true)
    currentStore.saveViewAs = vi.fn(async () => true)

    const wrapper = mount(QueryBuilderResults)
    const grid = wrapper.get("[data-saved-views-grid]")
    const cards = grid.findAll("[data-saved-view-card]")
    const firstBadge = wrapper.get('[data-view-default-badge="view-1"]')
    const secondBadge = wrapper.get('[data-view-default-badge="view-2"]')
    const secondMeta = wrapper.get('[data-view-card-meta="view-2"]')
    const firstDescription = wrapper.get('[data-view-description="view-1"]')
    const secondDescription = wrapper.get('[data-view-description="view-2"]')

    expect(wrapper.text()).toContain("已保存视图")
    expect(wrapper.text()).toContain("默认")
    expect(grid.attributes("data-grid-columns")).toBe("4")
    expect(cards.length).toBe(2)
    expect(cards[0]?.attributes("data-card-size")).toBe("compact")
    expect(wrapper.find('[data-view-default="view-2"]').exists()).toBe(false)
    expect(firstBadge.attributes("data-state")).toBe("active")
    expect(secondBadge.attributes("data-state")).toBe("idle")
    expect(secondMeta.get('[data-view-default-badge="view-2"]').exists()).toBe(true)
    expect(secondMeta.get('[data-view-delete="view-2"]').exists()).toBe(true)
    expect(firstDescription.text()).toContain("适合核对明细")
    expect(secondDescription.text()).toContain("适合按阶段推进")

    await cards[1]!.trigger("click")

    expect(currentStore.loadSavedView).toHaveBeenCalledWith("view-2")
    expect(currentStore.draft.view.id).toBe("view-2")
    expect(currentStore.draft.view.type).toBe("board")
    expect(cards[1]!.classes()).toContain("saved-views__item--active")

    await secondBadge.trigger("click")
    await wrapper.get('[data-view-delete="view-2"]').trigger("click")
    await wrapper.get("[data-view-save-as]").trigger("click")

    expect(currentStore.setDefaultSavedView).toHaveBeenCalledWith("view-2")
    expect(currentStore.deleteSavedView).toHaveBeenCalledWith("view-2")
    expect(currentStore.saveViewAs).toHaveBeenCalled()
  })

  it("shows the empty result placeholder when no rows have been loaded", () => {
    currentStore = createStore()
    currentStore.draft.view.type = "board"

    const wrapper = mount(QueryBuilderResults)

    expect(wrapper.get("[data-results-empty]").text()).toContain("结果会在这里出现")
  })

  it("hides empty list metadata and renders existing metadata on a separate aligned line", () => {
    currentStore = createStore()
    currentStore.draft.view.type = "list"
    currentStore.resultSet = {
      rows: [
        { id: "block-1" },
        { id: "block-2" },
      ],
      total: 2,
      executedAt: "2026-03-24T00:00:00.000Z",
    }
    currentStore.listItems = [
      {
        id: "block-1",
        title: "我的 OpenClaw Token 账单降了72%，只因装了这个插件",
        meta: [],
      },
      {
        id: "block-2",
        title: "2026-03-23 Query Builder 示例",
        meta: ["项目周报", "P1"],
      },
    ]

    const wrapper = mount(QueryBuilderResults)
    const listItems = wrapper.findAll("[data-list-item]")

    expect(listItems).toHaveLength(2)
    expect(wrapper.text()).not.toContain("无附加信息")
    expect(listItems[0]!.find("[data-list-item-meta]").exists()).toBe(false)
    expect(listItems[1]!.get("[data-list-item-meta]").text()).toBe("项目周报 · P1")
  })

  it("opens the embed target menu, refreshes document targets, and wires target selection", async () => {
    currentStore = createStore()
    currentStore.refreshCurrentDocumentTarget = vi.fn(async () => {})
    currentStore.selectCurrentDocumentTarget = vi.fn(async () => true)
    currentStore.selectEmbedTarget = vi.fn(async () => true)
    currentStore.currentDocumentTarget = {
      id: "20260322194501-abc1234",
      title: "当前文档",
    }
    currentStore.openDocumentTargets = [
      {
        id: "20260322194501-abc1234",
        title: "当前文档",
      },
      {
        id: "20260322195501-def5678",
        title: "项目周报",
      },
    ]
    currentStore.recentEmbedTargets = [
      {
        id: "20260322201501-hij9012",
        type: "document",
        title: "历史文档",
        content: "",
      },
    ]

    const wrapper = mount(QueryBuilderResults)

    await wrapper.get("[data-embed-target-toggle]").trigger("click")

    expect(currentStore.refreshCurrentDocumentTarget).toHaveBeenCalled()
    expect(wrapper.get("[data-embed-target-menu]").exists()).toBe(true)

    await wrapper.get("[data-embed-target-current]").trigger("click")
    expect(currentStore.selectCurrentDocumentTarget).toHaveBeenCalled()

    await wrapper.get("[data-embed-target-toggle]").trigger("click")
    await wrapper.get('[data-embed-target-item="20260322201501-hij9012"]').trigger("click")

    expect(currentStore.selectEmbedTarget).toHaveBeenCalledWith("20260322201501-hij9012")
    expect(wrapper.find("[data-embed-target-menu]").exists()).toBe(false)
  })

  it("renders SQL preview as a code block and copies generated SQL from the toolbar icon", async () => {
    currentStore = createStore()
    currentStore.advancedMode = true
    currentStore.advancedSql = "select * from blocks where type = 'd'"
    const writeText = vi.fn(async () => {})

    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText,
      },
    })

    const wrapper = mount(QueryBuilderResults)
    const preview = wrapper.get("[data-sql-preview]")
    const copyButton = wrapper.get("[data-sql-copy]")

    expect(preview.get("code").text()).toBe("select * from blocks where type = 'd'")
    expect(copyButton.attributes("aria-label")).toBe("复制 SQL")

    await copyButton.trigger("click")

    expect(writeText).toHaveBeenCalledWith("select * from blocks where type = 'd'")
    expect(showMessage).toHaveBeenCalledWith("已复制 SQL", 2500, "info")
  })
})
