import type { Ref } from "vue"

import { applyViewConfigToTemplate, cloneSnapshot, hydrateViewConfig } from "@/core/query/catalog"
import type { QueryBuilderSnapshot, QueryTemplate, ViewConfig } from "@/core/query/types"

import { createDraft } from "../shared"

export function applyTemplateAndViewState(
  draft: QueryBuilderSnapshot,
  template: QueryTemplate,
  view: ViewConfig,
  resetResultState: () => void,
) {
  const nextView = hydrateViewConfig(view, template)
  const next = cloneSnapshot({
    template: applyViewConfigToTemplate(template, nextView),
    view: nextView,
  })
  draft.template = next.template
  draft.view = next.view
  resetResultState()
}

export function resetDraftState(
  draft: QueryBuilderSnapshot,
  savedViews: Ref<ViewConfig[]>,
  resetResultState: () => void,
) {
  const next = createDraft()
  applyTemplateAndViewState(draft, next.template, next.view, resetResultState)
  savedViews.value = []
}
