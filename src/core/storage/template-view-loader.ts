import { applyViewConfigToTemplate } from "@/core/query/catalog"
import type { QueryBuilderSnapshot, QueryTemplate, ViewConfig } from "@/core/query/types"

import { pickTemplateViewById } from "./template-view"

interface QueryTemplateReader {
  list: () => Promise<QueryTemplate[]>
  get: (templateId: string) => Promise<QueryTemplate | null>
}

interface ViewConfigReader {
  list: () => Promise<ViewConfig[]>
  listByTemplate: (templateId: string) => Promise<ViewConfig[]>
}

function toSnapshot(template: QueryTemplate, views: ViewConfig[], viewId?: string): QueryBuilderSnapshot {
  const view = pickTemplateViewById(template, views, viewId)

  return {
    template: applyViewConfigToTemplate(template, view),
    view,
  }
}

export function createTemplateViewLoader(queryTemplateStore: QueryTemplateReader, viewConfigStore: ViewConfigReader) {
  return {
    async listSnapshots() {
      const [templates, views] = await Promise.all([
        queryTemplateStore.list(),
        viewConfigStore.list(),
      ])
      return templates.map(template => toSnapshot(
        template,
        views.filter(view => view.queryTemplateId === template.id),
      ))
    },
    async getSnapshot(templateId: string, viewId?: string) {
      const [template, views] = await Promise.all([
        queryTemplateStore.get(templateId),
        viewConfigStore.listByTemplate(templateId),
      ])
      if (!template) {
        return null
      }
      return toSnapshot(template, views, viewId)
    },
  }
}
