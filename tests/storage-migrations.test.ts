import { describe, expect, it } from 'vitest'

import type { QueryBuilderSnapshot } from '@/core/query/types'
import { migrateLegacyTemplateSnapshots } from '@/core/storage/migrations'

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

  seed(key: string, value: unknown) {
    this.data.set(key, value)
  }

  read(key: string) {
    return this.data.get(key)
  }
}

describe('migrateLegacyTemplateSnapshots', () => {
  it('migrates v1 snapshots into v2 template and view stores', async () => {
    const storage = new FakePluginStorage()
    const legacySnapshots: QueryBuilderSnapshot[] = [
      {
        template: {
          id: 'template-1',
          version: 1,
          name: 'Reading Queue',
          scope: {
            type: 'tag',
            value: '#unread#',
          },
          filters: [],
          sorts: [],
          fields: ['content'],
          viewType: 'board',
        },
        view: {
          id: 'view-1',
          queryTemplateId: 'template-1',
          type: 'board',
          defaultView: true,
          fieldMappings: {
            status: 'status',
            dueDate: 'dueDate',
            priority: 'priority',
            project: 'project',
            owner: 'owner',
          },
        },
      },
    ]
    storage.seed('query-builder.templates.v1', legacySnapshots)

    await migrateLegacyTemplateSnapshots(storage)

    expect(storage.read('query-builder.templates.v2')).toEqual([
      legacySnapshots[0].template,
    ])
    expect(storage.read('query-builder.views.v2')).toEqual([
      {
        ...legacySnapshots[0].view,
        fields: ['content'],
        sorts: [],
        groupBy: undefined,
        aggregation: undefined,
      },
    ])
    expect(storage.read('query-builder.templates.v1')).toBeUndefined()
  })
})
