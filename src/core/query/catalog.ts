import type {
  FieldMappings,
  FieldId,
  QueryBuilderSnapshot,
  QueryTemplate,
  ViewConfig,
  ViewType,
} from "./types"

export const DEFAULT_FIELD_MAPPINGS: FieldMappings = {
  status: "status",
  dueDate: "dueDate",
  priority: "priority",
  project: "project",
  owner: "owner",
}

export interface FieldOption {
  value: FieldId
  label: string
  hint?: string
}

export interface PresetDefinition {
  id: string
  title: string
  description: string
  snapshot: QueryBuilderSnapshot
}

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
    fields: ["content", "updated", `attr:${DEFAULT_FIELD_MAPPINGS.status}`, `attr:${DEFAULT_FIELD_MAPPINGS.dueDate}`],
    viewType: "table",
  }
}

export function createDefaultViewConfig(templateId: string, type: ViewType = "table"): ViewConfig {
  return {
    id: createId("view"),
    queryTemplateId: templateId,
    type,
    defaultView: true,
    fieldMappings: { ...DEFAULT_FIELD_MAPPINGS },
  }
}

export function cloneSnapshot(snapshot: QueryBuilderSnapshot): QueryBuilderSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as QueryBuilderSnapshot
}

export function createFieldOptions(mappings: FieldMappings): FieldOption[] {
  return [
    { value: "content", label: "标题 / 内容" },
    { value: "updated", label: "更新时间" },
    { value: "created", label: "创建时间" },
    { value: "tag", label: "标签" },
    { value: "box", label: "笔记本" },
    { value: "path", label: "路径" },
    { value: "type", label: "块类型" },
    { value: `attr:${mappings.status}`, label: "状态", hint: mappings.status },
    { value: `attr:${mappings.dueDate}`, label: "截止日期", hint: mappings.dueDate },
    { value: `attr:${mappings.priority}`, label: "优先级", hint: mappings.priority },
    { value: `attr:${mappings.project}`, label: "项目", hint: mappings.project },
    { value: `attr:${mappings.owner}`, label: "负责人", hint: mappings.owner },
  ]
}

export function createPresets(mappings: FieldMappings): PresetDefinition[] {
  const taskTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "本周任务",
    scope: { type: "all_blocks" },
    filters: [
      {
        id: createId("filter"),
        field: `attr:${mappings.status}`,
        operator: "neq",
        value: "Done",
      },
      {
        id: createId("filter"),
        field: `attr:${mappings.dueDate}`,
        operator: "next_days",
        value: "7",
      },
    ],
    sorts: [
      {
        field: `attr:${mappings.dueDate}`,
        direction: "asc",
      },
    ],
    fields: ["content", `attr:${mappings.project}`, `attr:${mappings.owner}`, `attr:${mappings.dueDate}`, `attr:${mappings.status}`],
    viewType: "table",
  }

  const boardTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "项目看板",
    scope: { type: "all_blocks" },
    filters: [
      {
        id: createId("filter"),
        field: `attr:${mappings.project}`,
        operator: "not_empty",
      },
    ],
    sorts: [],
    groupBy: `attr:${mappings.status}`,
    fields: ["content", `attr:${mappings.project}`, `attr:${mappings.priority}`, `attr:${mappings.status}`],
    viewType: "board",
  }

  const readingTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "阅读清单",
    scope: { type: "all_blocks" },
    filters: [
      {
        id: createId("filter"),
        field: `attr:${mappings.status}`,
        operator: "eq",
        value: "Unread",
      },
    ],
    sorts: [
      {
        field: `attr:${mappings.priority}`,
        direction: "desc",
      },
    ],
    fields: ["content", "tag", `attr:${mappings.priority}`, `attr:${mappings.status}`],
    viewType: "table",
  }

  const meetingTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "最近会议",
    scope: { type: "all_blocks" },
    filters: [
      {
        id: createId("filter"),
        field: "content",
        operator: "contains",
        value: "会议",
      },
      {
        id: createId("filter"),
        field: "updated",
        operator: "last_days",
        value: "30",
      },
    ],
    sorts: [
      {
        field: "updated",
        direction: "desc",
      },
    ],
    groupBy: `attr:${mappings.project}`,
    fields: ["content", `attr:${mappings.project}`, "updated"],
    viewType: "table",
  }

  return [
    {
      id: "preset-weekly-tasks",
      title: "任务清单",
      description: "状态未完成且未来 7 天到期的任务",
      snapshot: {
        template: taskTemplate,
        view: createDefaultViewConfig(taskTemplate.id, "table"),
      },
    },
    {
      id: "preset-project-board",
      title: "项目看板",
      description: "按状态分组的项目块看板",
      snapshot: {
        template: boardTemplate,
        view: createDefaultViewConfig(boardTemplate.id, "board"),
      },
    },
    {
      id: "preset-reading-queue",
      title: "阅读清单",
      description: "未读内容按优先级排序",
      snapshot: {
        template: readingTemplate,
        view: createDefaultViewConfig(readingTemplate.id, "table"),
      },
    },
    {
      id: "preset-recent-meetings",
      title: "会议回顾",
      description: "最近 30 天会议记录按项目查看",
      snapshot: {
        template: meetingTemplate,
        view: createDefaultViewConfig(meetingTemplate.id, "table"),
      },
    },
  ]
}
