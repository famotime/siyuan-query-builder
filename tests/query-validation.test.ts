import { describe, expect, it } from 'vitest'

import type { QueryBuilderSnapshot } from '@/core/query/types'
import { validateSnapshot } from '@/core/query/validation'

function createSnapshot(overrides?: Partial<QueryBuilderSnapshot>): QueryBuilderSnapshot {
  return {
    template: {
      id: 'template-1',
      version: 1,
      name: '测试查询',
      scope: {
        type: 'all_blocks',
      },
      filters: [],
      sorts: [],
      fields: ['content'],
      viewType: 'table',
      ...overrides?.template,
    },
    view: {
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
      ...overrides?.view,
    },
  }
}

describe('validateSnapshot', () => {
  it('returns an error when board view is missing groupBy', () => {
    const issues = validateSnapshot(createSnapshot({
      view: {
        type: 'board',
      },
      template: {
        viewType: 'board',
      },
    }))

    expect(issues).toEqual([
      expect.objectContaining({
        level: 'error',
        code: 'board-group-by-required',
      }),
    ])
  })

  it('returns an error when date_between filter is incomplete', () => {
    const issues = validateSnapshot(createSnapshot({
      template: {
        filters: [
          {
            id: 'filter-1',
            field: 'updated',
            operator: 'date_between',
            value: ['2026-03-01', ''],
          },
        ],
      },
    }))

    expect(issues).toEqual([
      expect.objectContaining({
        level: 'error',
        code: 'filter-date-range-incomplete',
      }),
    ])
  })

  it('returns a warning when board grouping does not support drag writeback', () => {
    const issues = validateSnapshot(createSnapshot({
      view: {
        type: 'board',
      },
      template: {
        viewType: 'board',
        groupBy: 'attr:project',
      },
    }))

    expect(issues).toEqual([
      expect.objectContaining({
        level: 'warning',
        code: 'board-drag-writeback-disabled',
      }),
    ])
  })

  it('does not require a scope value when attribute scope means any custom attribute', () => {
    const issues = validateSnapshot(createSnapshot({
      template: {
        scope: {
          type: 'attribute',
        },
      },
    }))

    expect(issues.some(issue => issue.code === 'scope-value-required')).toBe(false)
  })
})
