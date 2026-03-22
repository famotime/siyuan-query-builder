import { createDefaultViewConfig } from "@/core/query/catalog"
import type { QueryTemplate, SavedTemplateSummary, ViewConfig } from "@/core/query/types"

export function pickTemplateView(template: QueryTemplate, views: ViewConfig[]) {
  const preferred = views.find(item => item.defaultView)
    || views.find(item => item.type === template.viewType)
    || views[0]

  return preferred || createDefaultViewConfig(template.id, template.viewType)
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
