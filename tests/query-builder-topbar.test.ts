import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'

let currentStore: any

vi.mock('@/composables/query-builder-store', () => ({
  useQueryBuilderStore: () => currentStore,
}))

import QueryBuilderTopbar from '@/components/query-builder/QueryBuilderTopbar.vue'

function createStore() {
  return reactive({
    advancedMode: false,
    saving: false,
    loading: false,
    isDirty: false,
    t: (key: string) => key,
    draft: {
      template: {
        name: '未命名查询',
      },
    },
    resetDraft: vi.fn(),
    saveTemplate: vi.fn(),
    runQuery: vi.fn(),
  })
}

describe('QueryBuilderTopbar', () => {
  it('does not render the advanced mode toggle in the topbar', () => {
    currentStore = createStore()
    const wrapper = mount(QueryBuilderTopbar)

    expect(wrapper.text()).not.toContain('高级模式')
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
  })

  it('renders a new query button in the topbar actions', async () => {
    currentStore = createStore()
    const wrapper = mount(QueryBuilderTopbar)

    const resetButton = wrapper.get('[data-topbar-reset]')
    expect(resetButton.text()).toContain('新建查询')

    await resetButton.trigger('click')

    expect(currentStore.resetDraft).toHaveBeenCalled()
  })
})
