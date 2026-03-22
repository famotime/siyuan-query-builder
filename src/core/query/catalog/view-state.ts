import type {
  FieldId,
  QueryAggregation,
  QueryBuilderSnapshot,
  QuerySort,
  QueryTemplate,
  ViewConfig,
  ViewType,
} from "../types"

import { DEFAULT_FIELD_MAPPINGS, DEFAULT_VIEW_FIELDS } from "./constants"

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyTemplate(name = "未命名查询"): QueryTemplate {
  return {
    id: createId("template"),
    version: 1,
    name,
    scope: {
      type: "all_blocks",
    },
    filters: [],
    sorts: [],
    limit: 100,
    fields: [...DEFAULT_VIEW_FIELDS],
    viewType: "table",
  }
}

function cloneSorts(sorts: QuerySort[] = []) {
  return sorts.map(sort => ({
    ...sort,
  }))
}

function cloneAggregation(aggregation?: QueryAggregation) {
  return aggregation
    ? {
      ...aggregation,
    }
    : undefined
}

function buildViewState(template?: Pick<QueryTemplate, "fields" | "sorts" | "groupBy" | "aggregation"> | {
  fields?: FieldId[]
  sorts?: QuerySort[]
  groupBy?: FieldId | null
  aggregation?: QueryAggregation | null
}) {
  return {
    fields: [...(template?.fields || DEFAULT_VIEW_FIELDS)],
    sorts: cloneSorts(template?.sorts || []),
    groupBy: template?.groupBy || undefined,
    aggregation: cloneAggregation(template?.aggregation || undefined),
  }
}

export function createDefaultViewConfig(templateId: string, type: ViewType = "table", template?: QueryTemplate): ViewConfig {
  return {
    id: createId("view"),
    queryTemplateId: templateId,
    type,
    defaultView: true,
    fieldMappings: { ...DEFAULT_FIELD_MAPPINGS },
    ...buildViewState(template),
  }
}

export function hydrateViewConfig(view: ViewConfig, template: QueryTemplate): ViewConfig {
  const hasOwn = <K extends keyof ViewConfig>(key: K) => Object.prototype.hasOwnProperty.call(view, key)

  return {
    ...view,
    type: view.type || template.viewType,
    fieldMappings: {
      ...DEFAULT_FIELD_MAPPINGS,
      ...view.fieldMappings,
    },
    ...buildViewState({
      fields: hasOwn("fields") ? view.fields : template.fields,
      sorts: hasOwn("sorts") ? view.sorts : template.sorts,
      groupBy: hasOwn("groupBy") ? view.groupBy : template.groupBy,
      aggregation: hasOwn("aggregation") ? view.aggregation : template.aggregation,
    }),
  }
}

export function applyViewConfigToTemplate(template: QueryTemplate, view: ViewConfig): QueryTemplate {
  const hydratedView = hydrateViewConfig(view, template)

  return {
    ...template,
    viewType: hydratedView.type,
    fields: [...(hydratedView.fields || DEFAULT_VIEW_FIELDS)],
    sorts: cloneSorts(hydratedView.sorts || []),
    groupBy: hydratedView.groupBy,
    aggregation: cloneAggregation(hydratedView.aggregation),
  }
}

export function cloneSnapshot(snapshot: QueryBuilderSnapshot): QueryBuilderSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as QueryBuilderSnapshot
}
