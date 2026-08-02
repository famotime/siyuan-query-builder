import type { FieldMappings } from "../types"

export const DEFAULT_FIELD_MAPPINGS: FieldMappings = {
  status: "status",
  dueDate: "dueDate",
  priority: "priority",
  project: "project",
  owner: "owner",
}

export const AGGREGATE_VALUE_FIELD = "agg:value"
export const TAG_COUNT_FIELD = "tagCount"
export const TEXT_LENGTH_FIELD = "textLength"
export const BACKLINK_COUNT_FIELD = "backlinkCount"
export const OUT_LINK_COUNT_FIELD = "outLinkCount"
export const LINK_COUNT_FIELD = "linkCount"
export const ASSET_COUNT_FIELD = "assetCount"
export const NUMERIC_FIELD_IDS = [TAG_COUNT_FIELD, TEXT_LENGTH_FIELD, BACKLINK_COUNT_FIELD, OUT_LINK_COUNT_FIELD, LINK_COUNT_FIELD, ASSET_COUNT_FIELD]
export const DEFAULT_VIEW_FIELDS = [
  "content",
  "updated",
  `attr:${DEFAULT_FIELD_MAPPINGS.status}`,
  `attr:${DEFAULT_FIELD_MAPPINGS.dueDate}`,
]
