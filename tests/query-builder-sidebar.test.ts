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
    savedTemplates: [
      {
        template: {
          id: "template-1",
          name: "任务清单",
        },
        view: {
          type: "table",
        },
      },
    ],
    presets: [],
    applySnapshot: vi.fn(),
    deleteTemplate: vi.fn(),
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
})
