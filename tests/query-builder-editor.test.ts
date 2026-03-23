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
      { value: "attr:dueDate", label: "截止日期" },
      { value: "tagCount", label: "标签数量" },
      { value: "agg:value", label: "统计值" },
      { value: "attr:status", label: "状态" },
    ],
    selectableFieldOptions: [
      { value: "content", label: "标题 / 内容" },
      { value: "updated", label: "更新时间" },
      { value: "attr:dueDate", label: "截止日期" },
      { value: "tagCount", label: "标签数量" },
      { value: "attr:status", label: "状态" },
    ],
    sortFieldOptions: [
      { value: "content", label: "标题 / 内容" },
      { value: "updated", label: "更新时间" },
      { value: "attr:dueDate", label: "截止日期" },
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
    moveFilter: vi.fn(),
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

  it("uses the aggregation select directly and defaults to not using aggregation", () => {
    currentStore = createStore()
    const wrapper = mount(QueryBuilderEditor)
    const aggregationSelect = wrapper.get('[data-aggregation-function]')

    expect(wrapper.text()).not.toContain("启用统计函数")
    expect((aggregationSelect.element as HTMLSelectElement).value).toBe("")
    expect(aggregationSelect.text()).toContain("不使用")
    expect(wrapper.find('[data-aggregation-field]').exists()).toBe(false)
  })

  it("shows statistical field selection when aggregation mode is enabled from the dropdown", async () => {
    currentStore = createStore()
    const wrapper = mount(QueryBuilderEditor)
    const aggregationSelect = wrapper.get('[data-aggregation-function]')

    await aggregationSelect.setValue("sum")
    currentStore.aggregationEnabled = true
    currentStore.aggregationFunctionProxy = "sum"
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-aggregation-field]').exists()).toBe(true)
    expect(wrapper.find('input[type="number"]').exists()).toBe(true)
  })

  it('shows preset mapping hints below the field mapping inputs', () => {
    currentStore = createStore()
    const wrapper = mount(QueryBuilderEditor)

    expect(wrapper.get('[data-mapping-hint="status"]').text()).toContain('Todo / Doing / Done')
    expect(wrapper.get('[data-mapping-hint="dueDate"]').text()).toContain('YYYY-MM-DD')
    expect(wrapper.get('[data-mapping-hint="priority"]').text()).toContain('P0 / P1 / P2 / P3')
    expect(wrapper.get('[data-mapping-hint="project"]').text()).toContain('项目周报')
    expect(wrapper.get('[data-mapping-hint="owner"]').text()).toContain('张三')
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

  it('uses the same primary button style for adding filters as running queries', () => {
    currentStore = createStore()

    const wrapper = mount(QueryBuilderEditor)
    const addFilterButton = wrapper.get('[data-add-filter]')

    expect(addFilterButton.classes()).toEqual(expect.arrayContaining(['btn', 'btn--solid']))
    expect(addFilterButton.classes()).not.toContain('btn--ghost')
  })

  it('renders and cycles the relation toggle beside the delete action', async () => {
    currentStore = createStore()
    currentStore.draft.template.filters = [
      {
        id: 'filter-1',
        field: 'content',
        operator: 'contains',
        value: '任务',
      },
      {
        id: 'filter-2',
        field: 'attr:status',
        operator: 'eq',
        value: 'Doing',
        condition: 'or',
      },
    ]

    const wrapper = mount(QueryBuilderEditor)
    const actions = wrapper.get('[data-filter-actions="filter-2"]')
    const relation = actions.get('[data-filter-condition-toggle="filter-2"]')
    const deleteButton = actions.get('[data-filter-delete="filter-2"]')

    expect(relation.element.tagName).toBe('BUTTON')
    expect(relation.text()).toBe('OR')
    expect(relation.classes()).toContain('filter-row__logic')
    expect(deleteButton.exists()).toBe(true)

    await relation.trigger('click')

    expect(currentStore.draft.template.filters[1].condition).toBe('and')
    expect(relation.text()).toBe('AND')
  })

  it('shows date operators only for time-related fields and normalizes incompatible operators on field change', async () => {
    currentStore = createStore()
    currentStore.draft.template.filters = [
      {
        id: 'filter-1',
        field: 'updated',
        operator: 'last_days',
        value: '7',
      },
    ]

    const wrapper = mount(QueryBuilderEditor)
    const fieldSelect = wrapper.get('[data-filter-field="filter-1"]')
    const operatorSelect = wrapper.get('[data-filter-operator="filter-1"]')

    expect(operatorSelect.text()).toContain('日期区间')
    expect(operatorSelect.text()).toContain('未来 N 天')
    expect(operatorSelect.text()).toContain('最近 N 天')

    await fieldSelect.setValue('content')

    expect(currentStore.draft.template.filters[0].operator).toBe('contains')
    expect(operatorSelect.text()).not.toContain('日期区间')
    expect(operatorSelect.text()).not.toContain('未来 N 天')
    expect(operatorSelect.text()).not.toContain('最近 N 天')
  })

  it('keeps date operators available for mapped due date fields', () => {
    currentStore = createStore()
    currentStore.draft.template.filters = [
      {
        id: 'filter-1',
        field: 'attr:dueDate',
        operator: 'date_between',
        value: ['2026-03-01', '2026-03-31'],
      },
    ]

    const wrapper = mount(QueryBuilderEditor)
    const operatorSelect = wrapper.get('[data-filter-operator="filter-1"]')

    expect(operatorSelect.text()).toContain('日期区间')
    expect(operatorSelect.text()).toContain('未来 N 天')
    expect(operatorSelect.text()).toContain('最近 N 天')
  })

  it("shows a drag handle and a drop indicator before reordering filters", async () => {
    currentStore = createStore()
    currentStore.draft.template.filters = [
      {
        id: "filter-1",
        field: "content",
        operator: "contains",
        value: "任务",
      },
      {
        id: "filter-2",
        field: "attr:status",
        operator: "eq",
        value: "Doing",
        condition: "and",
      },
    ]

    const wrapper = mount(QueryBuilderEditor)
    const sourceHandle = wrapper.get('[data-filter-drag-handle="filter-1"]')
    const target = wrapper.get('[data-filter-row="filter-2"]')

    Object.defineProperty(target.element, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        top: 100,
        bottom: 180,
        left: 0,
        right: 320,
        width: 320,
        height: 80,
        x: 0,
        y: 100,
        toJSON: () => ({}),
      }),
    })

    expect(sourceHandle.attributes("draggable")).toBe("true")
    expect(sourceHandle.attributes("title")).toContain("拖拽")

    await sourceHandle.trigger("dragstart")
    await target.trigger("dragover", { clientY: 108 })

    expect(target.classes()).toContain("filter-row--drop-before")
    await target.trigger("drop")

    expect(currentStore.moveFilter).toHaveBeenCalledWith("filter-1", "filter-2", "before")
  })
})
