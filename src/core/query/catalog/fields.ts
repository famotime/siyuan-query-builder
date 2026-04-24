import type { FieldId, FieldMappings } from "../types"

import {
  AGGREGATE_VALUE_FIELD,
  ASSET_COUNT_FIELD,
  BACKLINK_COUNT_FIELD,
  LINK_COUNT_FIELD,
  OUT_LINK_COUNT_FIELD,
  TAG_COUNT_FIELD,
} from "./constants"

export interface FieldOption {
  value: FieldId
  label: string
  hint?: string
}

export function createFieldOptions(mappings: FieldMappings): FieldOption[] {
  return [
    { value: "content", label: "标题 / 内容" },
    { value: "updated", label: "更新时间" },
    { value: "created", label: "创建时间" },
    { value: "tag", label: "标签" },
    { value: TAG_COUNT_FIELD, label: "标签数量" },
    { value: ASSET_COUNT_FIELD, label: "内嵌资源数量" },
    { value: BACKLINK_COUNT_FIELD, label: "反向链接数" },
    { value: OUT_LINK_COUNT_FIELD, label: "正向链接数" },
    { value: LINK_COUNT_FIELD, label: "总链接数" },
    { value: "box", label: "笔记本" },
    { value: "path", label: "路径" },
    { value: "type", label: "块类型" },
    { value: AGGREGATE_VALUE_FIELD, label: "统计值" },
    { value: `attr:${mappings.status}`, label: "状态", hint: mappings.status },
    { value: `attr:${mappings.dueDate}`, label: "截止日期", hint: mappings.dueDate },
    { value: `attr:${mappings.priority}`, label: "优先级", hint: mappings.priority },
    { value: `attr:${mappings.project}`, label: "项目", hint: mappings.project },
    { value: `attr:${mappings.owner}`, label: "负责人", hint: mappings.owner },
  ]
}
