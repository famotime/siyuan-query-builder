import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"
import { reactive } from "vue"

let currentStore: any

vi.mock("@/composables/query-builder-store", () => ({
  useQueryBuilderStore: () => currentStore,
}))

import QueryBuilderEditor from "@/components/query-builder/QueryBuilderEditor.vue"

function createStore() {
  return reactive({
    advancedMode: false,
    saving: false,
    loading: false,
    validationIssues: [],
    notebooks: [],
    mappingKeys: ["status", "dueDate", "priority", "project", "owner"],
    mappingLabels: {
      status: "状态属性名",
      dueDate: "日期属性名",
      priority: "优先级属性名",
      project: "项目属性名",
      owner: "负责人属性名",
    },
    draft: {
      template: {
        name: "未命名查询",
        scope: {
          type: "all_blocks",
          value: "",
        },
        filters: [],
        sorts: [],
        fields: ["content", "updated"],
        groupBy: undefined,
        aggregation: undefined,
        limit: 200,
      },
      view: {
        type: "table",
        fieldMappings: {
          status: "status",
          dueDate: "dueDate",
          priority: "priority",
          project: "project",
          owner: "owner",
        },
      },
    },
    scopeLabel: "范围值",
    scopePlaceholder: "输入范围值",
    fieldOptions: [
      { value: "content", label: "标题 / 内容" },
      { value: "updated", label: "更新时间" },
      { value: "tagCount", label: "标签数量" },
      { value: "agg:value", label: "统计值" },
      { value: "attr:status", label: "状态" },
    ],
    selectableFieldOptions: [
      { value: "content", label: "标题 / 内容" },
      { value: "updated", label: "更新时间" },
      { value: "tagCount", label: "标签数量" },
      { value: "attr:status", label: "状态" },
    ],
    sortFieldOptions: [
      { value: "content", label: "标题 / 内容" },
      { value: "updated", label: "更新时间" },
      { value: "tagCount", label: "标签数量" },
      { value: "agg:value", label: "统计值" },
      { value: "attr:status", label: "状态" },
    ],
    statisticalFieldOptions: [
      { value: "tagCount", label: "标签数量" },
    ],
    groupByProxy: "",
    aggregationEnabled: false,
    aggregationFunctionProxy: "count",
    aggregationFieldProxy: "tagCount",
    limitProxy: "200",
    customFieldName: "",
    addFilter: () => {},
    removeFilter: () => {},
    dateRangeValue: () => "",
    updateDateRange: () => {},
    requiresValue: () => true,
    addSort: () => {},
    removeSort: () => {},
    toggleField: vi.fn(),
    addCustomField: () => {},
    saveTemplate: () => {},
    runQuery: () => {},
  })
}

describe("QueryBuilderEditor", () => {
  it("collapses and expands editor sections from the header toggle", async () => {
    currentStore = createStore()
    const wrapper = mount(QueryBuilderEditor)

    expect(wrapper.text()).toContain("范围类型")
    expect(wrapper.text()).not.toContain("视图类型")

    const toggle = wrapper.get("[data-section-toggle=\"scope\"]")
    await toggle.trigger("click")

    expect(wrapper.text()).not.toContain("范围类型")

    await toggle.trigger("click")

    expect(wrapper.text()).toContain("范围类型")
  })

  it("shows statistical function controls for aggregate queries", () => {
    currentStore = createStore()
    currentStore.aggregationEnabled = true
    currentStore.aggregationFunctionProxy = "sum"
    const wrapper = mount(QueryBuilderEditor)

    expect(wrapper.text()).toContain("统计函数")
    expect(wrapper.text()).toContain("统计字段")
    expect(wrapper.find('input[type="number"]').exists()).toBe(true)
  })

  it('renders validation issues before query execution', () => {
    currentStore = createStore()
    currentStore.validationIssues = [
      {
        level: 'error',
        code: 'board-group-by-required',
        message: '看板视图需要设置分组字段。',
      },
      {
        level: 'warning',
        code: 'board-drag-writeback-disabled',
        message: '当前分组不支持拖拽回写。',
      },
    ]
    const wrapper = mount(QueryBuilderEditor)

    expect(wrapper.text()).toContain('看板视图需要设置分组字段。')
    expect(wrapper.text()).toContain('当前分组不支持拖拽回写。')
  })

  it('renders output fields in a collapsible multiselect picker', async () => {
    currentStore = createStore()
    const wrapper = mount(QueryBuilderEditor)

    const compactRow = wrapper.get('[data-view-config-row]')
    expect(compactRow.get('[data-sort-panel]').exists()).toBe(true)
    expect(compactRow.get('[data-field-panel]').exists()).toBe(true)

    const toggle = wrapper.get('[data-field-picker-toggle]')
    expect(toggle.text()).toContain('已选 2 项')
    expect(wrapper.find('[data-field-option="content"]').exists()).toBe(false)

    await toggle.trigger('click')

    expect(wrapper.find('[data-field-option="content"]').exists()).toBe(true)

    await wrapper.get('[data-field-option="attr:status"]').trigger('change')

    expect(currentStore.toggleField).toHaveBeenCalledWith('attr:status')
  })
})
