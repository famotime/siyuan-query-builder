import { describe, expect, it } from 'vitest'

import type { QueryTemplate } from '@/core/query/types'
import { createQueryTemplateStore } from '@/core/storage/query-template-store'

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
}

describe('createQueryTemplateStore', () => {
  it('saves and removes query templates in v2 storage', async () => {
    const storage = new FakePluginStorage()
    const store = createQueryTemplateStore(storage)
    const template: QueryTemplate = {
      id: 'template-1',
      version: 1,
      name: 'Reading Queue',
      scope: {
        type: 'tag',
        value: '#unread#',
      },
      filters: [],
      sorts: [],
      fields: ['content', 'attr:priority'],
      viewType: 'table',
    }

    await store.save(template)
    expect(await store.list()).toEqual([template])

    await store.remove(template.id)
    expect(await store.list()).toEqual([])
  })
})
