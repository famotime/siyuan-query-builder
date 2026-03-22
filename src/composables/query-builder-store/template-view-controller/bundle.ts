import { createDefaultViewConfig, createId, hydrateViewConfig } from "@/core/query/catalog"
import type { QueryTemplate, QueryTemplateBundle, ViewConfig } from "@/core/query/types"

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function isTemplateBundle(value: unknown): value is QueryTemplateBundle {
  if (!value || typeof value !== "object") {
    return false
  }

  const bundle = value as Partial<QueryTemplateBundle>
  return bundle.schema === "siyuan-query-builder/template-bundle"
    && bundle.version === 1
    && Boolean(bundle.template)
    && Array.isArray(bundle.views)
}

export function createExportedTemplateBundle(template: QueryTemplate, views: ViewConfig[]): QueryTemplateBundle {
  return {
    schema: "siyuan-query-builder/template-bundle",
    version: 1,
    exportedAt: new Date().toISOString(),
    template: cloneValue(template),
    views: cloneValue(views.map(view => hydrateViewConfig(view, template))),
  }
}

export function createImportedTemplateBundle(bundle: QueryTemplateBundle) {
  const importedTemplate: QueryTemplate = {
    ...cloneValue(bundle.template),
    id: createId("template"),
  }

  const sourceViews = bundle.views.length
    ? bundle.views
    : [createDefaultViewConfig(importedTemplate.id, importedTemplate.viewType, importedTemplate)]
  const defaultIndex = Math.max(sourceViews.findIndex(view => view.defaultView), 0)
  const importedViews = sourceViews.map((view, index) => ({
    ...hydrateViewConfig(view, importedTemplate),
    id: createId("view"),
    queryTemplateId: importedTemplate.id,
    defaultView: index === defaultIndex,
    type: view.type || importedTemplate.viewType,
  }))

  return {
    template: importedTemplate,
    views: importedViews,
  }
}
