export {
  AGGREGATE_VALUE_FIELD,
  BACKLINK_COUNT_FIELD,
  DEFAULT_FIELD_MAPPINGS,
  DEFAULT_VIEW_FIELDS,
  LINK_COUNT_FIELD,
  NUMERIC_FIELD_IDS,
  OUT_LINK_COUNT_FIELD,
  TAG_COUNT_FIELD,
} from "./catalog/constants"
export { createFieldOptions, type FieldOption } from "./catalog/fields"
export { createPresets, type PresetDefinition } from "./catalog/presets"
export {
  applyViewConfigToTemplate,
  cloneSnapshot,
  createDefaultViewConfig,
  createEmptyTemplate,
  createId,
  hydrateViewConfig,
} from "./catalog/view-state"
