import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'

let currentStore: any

vi.mock('@/composables/query-builder-store', () => ({
  useQueryBuilderStore: () => currentStore,
}))

import QueryBuilderResults from '@/components/query-builder/QueryBuilderResults.vue'

function createStore() {
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
    savedViews: [],
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
    refreshCurrentDocumentTarget: async () => {},
    selectCurrentDocumentTarget: async () => true,
    selectEmbedTarget: async () => true,
    insertEmbed: () => {},
    setViewType: vi.fn(),
    saveViewAs: async () => true,
    loadSavedView: async () => true,
    setDefaultSavedView: async () => true,
    deleteSavedView: async () => true,
    editableField: () => null,
    displayValue: () => '',
    quickEdit: () => {},
    openBlock: () => {},
    boardColumns: [],
    boardDragCapability: {
      enabled: true,
      reason: '',
    },
    draggingRowId: '',
    dropToColumn: () => {},
    listItems: [],
    cardsSummary: [],
  })
}

describe('QueryBuilderResults advanced mode placement', () => {
  it('renders advanced mode as a collapsible section above the results content', async () => {
    currentStore = createStore()
    const wrapper = mount(QueryBuilderResults)

    const toggle = wrapper.get('[data-advanced-mode-toggle]')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.find('input[type="checkbox"]').exists()).toBe(false)
    expect(wrapper.find('.sql-box').exists()).toBe(false)

    await toggle.trigger('click')

    expect(currentStore.advancedMode).toBe(true)
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.sql-box').exists()).toBe(true)
    expect(wrapper.text()).toContain('运行查询后会显示生成后的 SQL 表达。')
  })
})
