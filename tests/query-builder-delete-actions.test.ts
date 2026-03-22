import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'

let currentStore: any

vi.mock('@/composables/query-builder-store', () => ({
  useQueryBuilderStore: () => currentStore,
}))

import QueryBuilderEditor from '@/components/query-builder/QueryBuilderEditor.vue'
import QueryBuilderResults from '@/components/query-builder/QueryBuilderResults.vue'
import QueryBuilderSidebar from '@/components/query-builder/QueryBuilderSidebar.vue'

function createSidebarStore() {
  return reactive({
    loading: false,
    presets: [],
    currentTemplateId: 'template-1',
    savedTemplateSummaries: [
      {
        templateId: 'template-1',
        templateName: '任务清单',
        defaultViewType: 'table',
        viewCount: 1,
      },
    ],
    applySnapshot: vi.fn(),
    loadTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    resetDraft: vi.fn(),
    runQuery: vi.fn(),
  })
}

function createEditorStore() {
  return reactive({
    validationIssues: [],
    notebooks: [],
    mappingKeys: ['status', 'dueDate', 'priority', 'project', 'owner'],
    mappingLabels: {
      status: '状态属性名',
      dueDate: '日期属性名',
      priority: '优先级属性名',
      project: '项目属性名',
      owner: '负责人属性名',
    },
    draft: {
      template: {
        scope: {
          type: 'all_blocks',
          value: '',
        },
        filters: [
          {
            id: 'filter-1',
            field: 'content',
            operator: 'contains',
            value: '任务',
          },
        ],
        sorts: [
          {
            field: 'updated',
            direction: 'desc',
          },
        ],
        fields: ['content', 'updated'],
        limit: 200,
      },
      view: {
        type: 'table',
        fieldMappings: {
          status: 'status',
          dueDate: 'dueDate',
          priority: 'priority',
          project: 'project',
          owner: 'owner',
        },
      },
    },
    scopeLabel: '范围值',
    scopePlaceholder: '输入范围值',
    fieldOptions: [
      { value: 'content', label: '标题 / 内容' },
      { value: 'updated', label: '更新时间' },
    ],
    selectableFieldOptions: [
      { value: 'content', label: '标题 / 内容' },
      { value: 'updated', label: '更新时间' },
    ],
    sortFieldOptions: [
      { value: 'content', label: '标题 / 内容' },
      { value: 'updated', label: '更新时间' },
    ],
    statisticalFieldOptions: [
      { value: 'updated', label: '更新时间' },
    ],
    groupByProxy: '',
    aggregationEnabled: false,
    aggregationFunctionProxy: 'count',
    aggregationFieldProxy: 'updated',
    limitProxy: '200',
    customFieldName: '',
    addFilter: vi.fn(),
    removeFilter: vi.fn(),
    dateRangeValue: vi.fn(() => ''),
    updateDateRange: vi.fn(),
    requiresValue: vi.fn(() => true),
    addSort: vi.fn(),
    removeSort: vi.fn(),
    toggleField: vi.fn(),
    addCustomField: vi.fn(),
  })
}

function createResultsStore() {
  return reactive({
    resultSummary: '还没有执行查询。',
    embedParentId: '',
    embedTargetHint: '',
    currentDocumentTarget: null,
    openDocumentTargets: [],
    recentEmbedTargets: [],
    error: '',
    advancedMode: false,
    advancedSql: '',
    resultSet: null,
    savedViews: [
      {
        id: 'view-1',
        queryTemplateId: 'template-1',
        type: 'table',
        defaultView: false,
      },
    ],
    draft: {
      template: {
        id: 'template-1',
        fields: ['content', 'updated'],
        viewType: 'table',
      },
      view: {
        id: 'view-1',
        type: 'table',
        fieldMappings: {
          project: 'project',
          priority: 'priority',
          dueDate: 'dueDate',
        },
      },
    },
    fieldLabel: (field: string) => field,
    refreshCurrentDocumentTarget: vi.fn(async () => {}),
    selectCurrentDocumentTarget: vi.fn(async () => true),
    selectEmbedTarget: vi.fn(async () => true),
    insertEmbed: vi.fn(),
    setViewType: vi.fn(),
    saveViewAs: vi.fn(async () => true),
    loadSavedView: vi.fn(async () => true),
    setDefaultSavedView: vi.fn(async () => true),
    deleteSavedView: vi.fn(async () => true),
    editableField: vi.fn(() => null),
    displayValue: vi.fn(() => ''),
    quickEdit: vi.fn(),
    openBlock: vi.fn(),
    boardColumns: [],
    boardDragCapability: {
      enabled: true,
      reason: '',
    },
    draggingRowId: '',
    dropToColumn: vi.fn(),
    listItems: [],
    cardsSummary: [],
  })
}

describe('query builder delete actions', () => {
  it('renders the template delete action as an icon-only button', () => {
    currentStore = createSidebarStore()
    const wrapper = mount(QueryBuilderSidebar)
    const deleteButton = wrapper.get('[data-template-delete="template-1"]')

    expect(deleteButton.find('svg').exists()).toBe(true)
    expect(deleteButton.text()).toBe('')
  })

  it('renders filter and sort delete actions as icon-only buttons', () => {
    currentStore = createEditorStore()
    const wrapper = mount(QueryBuilderEditor)
    const filterDeleteButton = wrapper.get('[data-filter-delete="filter-1"]')
    const sortDeleteButton = wrapper.get('[data-sort-delete="0"]')

    expect(filterDeleteButton.find('svg').exists()).toBe(true)
    expect(filterDeleteButton.text()).toBe('')
    expect(sortDeleteButton.find('svg').exists()).toBe(true)
    expect(sortDeleteButton.text()).toBe('')
  })

  it('renders the saved view delete action as an icon-only button', () => {
    currentStore = createResultsStore()
    const wrapper = mount(QueryBuilderResults)
    const deleteButton = wrapper.get('[data-view-delete="view-1"]')

    expect(deleteButton.find('svg').exists()).toBe(true)
    expect(deleteButton.text()).toBe('')
  })
})
