import { describe, expect, it } from 'vitest'

import type { ViewConfig } from '@/core/query/types'
import { createViewConfigStore } from '@/core/storage/view-config-store'

class FakePluginStorage {
  private data = new Map<string, unknown>()

  async loadData(key: string) {
    return this.data.get(key)
  }

  async saveData(key: string, value: unknown) {
    this.data.set(key, value)
  }

  async removeData(key: string) {
    this.data.delete(key)
  }

  read(key: string) {
    return this.data.get(key)
  }
}

describe('createViewConfigStore', () => {
  it('keeps one default view per template when saving views', async () => {
    const storage = new FakePluginStorage()
    const store = createViewConfigStore(storage)
    const first: ViewConfig = {
      id: 'view-1',
      queryTemplateId: 'template-1',
      type: 'table',
      defaultView: true,
      fieldMappings: {
        status: 'status',
        dueDate: 'dueDate',
        priority: 'priority',
        project: 'project',
        owner: 'owner',
      },
    }
    const second: ViewConfig = {
      ...first,
      id: 'view-2',
      type: 'board',
      defaultView: true,
    }

    await store.save(first)
    await store.save(second)

    const views = await store.listByTemplate('template-1')
    expect(views).toHaveLength(2)
    expect(views.find(view => view.id === 'view-1')?.defaultView).toBe(false)
    expect(views.find(view => view.id === 'view-2')?.defaultView).toBe(true)
  })

  it('removes all views for a template while keeping other templates intact', async () => {
    const storage = new FakePluginStorage()
    const store = createViewConfigStore(storage)
    const first: ViewConfig = {
      id: 'view-1',
      queryTemplateId: 'template-1',
      type: 'table',
      defaultView: true,
      fieldMappings: {
        status: 'status',
        dueDate: 'dueDate',
        priority: 'priority',
        project: 'project',
        owner: 'owner',
      },
    }
    const second: ViewConfig = {
      ...first,
      id: 'view-2',
      queryTemplateId: 'template-2',
      type: 'board',
    }

    await store.save(first)
    await store.save(second)
    await store.removeByTemplate('template-1')

    expect(await store.list()).toEqual([second])
    expect(storage.read('query-builder.views.v2')).toEqual([second])
  })
})
