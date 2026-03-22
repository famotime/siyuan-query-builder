import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"
import { reactive } from "vue"

let currentStore: any

vi.mock("@/composables/query-builder-store", () => ({
  useQueryBuilderStore: () => currentStore,
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

  it("switches view type through the store and syncs template view type", async () => {
    currentStore = createStore()
    currentStore.setViewType = vi.fn((type: string) => {
      currentStore.draft.view.type = type
      currentStore.draft.template.viewType = type
    })

    const wrapper = mount(QueryBuilderResults)
    await wrapper.get('[data-view-type="board"]').trigger("click")

    expect(currentStore.setViewType).toHaveBeenCalledWith("board")
    expect(currentStore.draft.view.type).toBe("board")
    expect(currentStore.draft.template.viewType).toBe("board")
  })

  it("shows saved views for the current template and wires view actions", async () => {
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
    currentStore.loadSavedView = vi.fn(async () => true)
    currentStore.setDefaultSavedView = vi.fn(async () => true)
    currentStore.deleteSavedView = vi.fn(async () => true)
    currentStore.saveViewAs = vi.fn(async () => true)

    const wrapper = mount(QueryBuilderResults)
    const grid = wrapper.get("[data-saved-views-grid]")

    expect(wrapper.text()).toContain("已保存视图")
    expect(wrapper.text()).toContain("默认")
    expect(grid.findAll("[data-saved-view-card]").length).toBe(2)

    await wrapper.get('[data-view-load="view-2"]').trigger("click")
    await wrapper.get('[data-view-default="view-2"]').trigger("click")
    await wrapper.get('[data-view-delete="view-2"]').trigger("click")
    await wrapper.get("[data-view-save-as]").trigger("click")

    expect(currentStore.loadSavedView).toHaveBeenCalledWith("view-2")
    expect(currentStore.setDefaultSavedView).toHaveBeenCalledWith("view-2")
    expect(currentStore.deleteSavedView).toHaveBeenCalledWith("view-2")
    expect(currentStore.saveViewAs).toHaveBeenCalled()
  })
})
