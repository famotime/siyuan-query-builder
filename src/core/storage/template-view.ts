import { createDefaultViewConfig, hydrateViewConfig } from "@/core/query/catalog"
import type { QueryTemplate, SavedTemplateSummary, ViewConfig } from "@/core/query/types"

export function pickTemplateView(template: QueryTemplate, views: ViewConfig[]) {
  return pickTemplateViewById(template, views)
}

export function pickTemplateViewById(template: QueryTemplate, views: ViewConfig[], viewId?: string) {
  const byId = viewId ? views.find(item => item.id === viewId) : null
  const preferred = views.find(item => item.defaultView)
    || views.find(item => item.type === template.viewType)
    || views[0]

  return (byId || preferred)
    ? hydrateViewConfig(byId || preferred, template)
    : createDefaultViewConfig(template.id, template.viewType, template)
}

export function buildSavedTemplateSummary(template: QueryTemplate, views: ViewConfig[]): SavedTemplateSummary {
  const defaultView = pickTemplateView(template, views)

  return {
    templateId: template.id,
    templateName: template.name,
    defaultViewId: defaultView.id,
    defaultViewType: defaultView.type,
    viewCount: Math.max(views.length, 1),
  }
}
