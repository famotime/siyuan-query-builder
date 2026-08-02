import type { FieldMappings, QueryBuilderSnapshot, QueryTemplate, ViewType } from "../types"

import {
  ASSET_COUNT_FIELD,
  BACKLINK_COUNT_FIELD,
  LINK_COUNT_FIELD,
  OUT_LINK_COUNT_FIELD,
  TAG_COUNT_FIELD,
  TEXT_LENGTH_FIELD,
} from "./constants"
import { createDefaultViewConfig, createId } from "./view-state"

export interface PresetDefinition {
  id: string
  category: "daily" | "links" | "attributes"
  title: string
  description: string
  snapshot: QueryBuilderSnapshot
}

function createPresetSnapshot(template: QueryTemplate, type: ViewType = template.viewType): QueryBuilderSnapshot {
  return {
    template,
    view: createDefaultViewConfig(template.id, type, template),
  }
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

  const recentCustomAttributeBlocksTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "近7天自定义属性块",
    scope: {
      type: "attribute",
    },
    filters: [
      {
        id: createId("filter"),
        field: "created",
        operator: "last_days",
        value: "7",
      },
    ],
    sorts: [
      {
        field: "created",
        direction: "desc",
      },
    ],
    fields: [
      "content",
      "type",
      "created",
      `attr:${mappings.status}`,
      `attr:${mappings.priority}`,
      `attr:${mappings.dueDate}`,
      `attr:${mappings.project}`,
      `attr:${mappings.owner}`,
    ],
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

  const topTaggedDocumentsTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "高反链核心笔记",
    scope: {
      type: "block_type",
      value: "d",
    },
    filters: [],
    sorts: [
      {
        field: BACKLINK_COUNT_FIELD,
        direction: "desc",
      },
    ],
    fields: ["content", BACKLINK_COUNT_FIELD, OUT_LINK_COUNT_FIELD, "updated", "box"],
    viewType: "table",
  }

  const topOutlinkedDocumentsTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "高正链索引笔记",
    scope: {
      type: "block_type",
      value: "d",
    },
    filters: [],
    sorts: [
      {
        field: OUT_LINK_COUNT_FIELD,
        direction: "desc",
      },
    ],
    fields: ["content", OUT_LINK_COUNT_FIELD, BACKLINK_COUNT_FIELD, "updated", "box"],
    viewType: "table",
  }

  const bidirectionalCoreDocumentsTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "双向连接核心区",
    scope: {
      type: "block_type",
      value: "d",
    },
    filters: [
      {
        id: createId("filter"),
        field: OUT_LINK_COUNT_FIELD,
        operator: "not_empty",
      },
      {
        id: createId("filter"),
        field: BACKLINK_COUNT_FIELD,
        operator: "not_empty",
      },
    ],
    sorts: [
      {
        field: LINK_COUNT_FIELD,
        direction: "desc",
      },
    ],
    fields: ["content", LINK_COUNT_FIELD, BACKLINK_COUNT_FIELD, OUT_LINK_COUNT_FIELD, "updated"],
    viewType: "table",
  }

  const islandDocumentsTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "无链接孤岛笔记",
    scope: {
      type: "block_type",
      value: "d",
    },
    filters: [
      {
        id: createId("filter"),
        field: LINK_COUNT_FIELD,
        operator: "eq",
        value: "0",
      },
    ],
    sorts: [
      {
        field: "updated",
        direction: "desc",
      },
    ],
    fields: ["content", OUT_LINK_COUNT_FIELD, BACKLINK_COUNT_FIELD, "updated", "box"],
    viewType: "table",
  }

  const recentLinkedDocumentsTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "近期活跃链接笔记",
    scope: {
      type: "block_type",
      value: "d",
    },
    filters: [
      {
        id: createId("filter"),
        field: "updated",
        operator: "last_days",
        value: "30",
      },
      {
        id: createId("filter"),
        field: LINK_COUNT_FIELD,
        operator: "gt",
        value: "0",
      },
    ],
    sorts: [
      {
        field: "updated",
        direction: "desc",
      },
    ],
    fields: ["content", "updated", BACKLINK_COUNT_FIELD, OUT_LINK_COUNT_FIELD, "box"],
    viewType: "list",
  }

  const recentlyUpdatedDocumentsTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "最近 7 天更新文档",
    scope: {
      type: "block_type",
      value: "d",
    },
    filters: [
      {
        id: createId("filter"),
        field: "updated",
        operator: "last_days",
        value: "7",
      },
    ],
    sorts: [
      {
        field: "updated",
        direction: "desc",
      },
    ],
    fields: ["content", "updated", "created", "box", "path"],
    viewType: "table",
  }

  const recentlyCreatedDocumentsTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "最近 30 天新建文档",
    scope: {
      type: "block_type",
      value: "d",
    },
    filters: [
      {
        id: createId("filter"),
        field: "created",
        operator: "last_days",
        value: "30",
      },
    ],
    sorts: [
      {
        field: "created",
        direction: "desc",
      },
    ],
    fields: ["content", "created", "updated", "box", "path"],
    viewType: "table",
  }

  const topTaggedDocumentsByTagCountTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "包含最多标签的文档(Top10)",
    scope: {
      type: "block_type",
      value: "d",
    },
    filters: [
      {
        id: createId("filter"),
        field: TAG_COUNT_FIELD,
        operator: "gt",
        value: "0",
      },
    ],
    sorts: [
      {
        field: TAG_COUNT_FIELD,
        direction: "desc",
      },
    ],
    fields: ["content", TAG_COUNT_FIELD, "box", "updated", "path"],
    limit: 10,
    viewType: "table",
  }

  const topAssetDocumentsTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "内嵌资源最多文档(Top10)",
    scope: {
      type: "block_type",
      value: "d",
    },
    filters: [
      {
        id: createId("filter"),
        field: ASSET_COUNT_FIELD,
        operator: "gt",
        value: "0",
      },
    ],
    sorts: [
      {
        field: ASSET_COUNT_FIELD,
        direction: "desc",
      },
    ],
    fields: ["content", ASSET_COUNT_FIELD, "box", "updated", "path"],
    limit: 10,
    viewType: "table",
  }

  const topBlocksByTextLengthTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "字数最多的块(Top10)",
    scope: {
      type: "all_blocks",
    },
    filters: [
      {
        id: createId("filter"),
        field: TEXT_LENGTH_FIELD,
        operator: "gt",
        value: "0",
      },
    ],
    sorts: [
      {
        field: TEXT_LENGTH_FIELD,
        direction: "desc",
      },
    ],
    fields: ["content", TEXT_LENGTH_FIELD, "type", "box", "updated"],
    limit: 10,
    viewType: "table",
  }

  const randomDocumentsTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "往日笔记随机漫游",
    scope: {
      type: "block_type",
      value: "d",
    },
    filters: [],
    sorts: [
      {
        field: "random",
        direction: "asc",
      },
    ],
    fields: ["content", "updated", "created", "box", "tag"],
    limit: 10,
    viewType: "table",
  }

  const todayEditedDocumentsTemplate: QueryTemplate = {
    id: createId("preset"),
    version: 1,
    name: "今日编辑速览",
    scope: {
      type: "block_type",
      value: "d",
    },
    filters: [
      {
        id: createId("filter"),
        field: "updated",
        operator: "last_days",
        value: "1",
      },
    ],
    sorts: [
      {
        field: "updated",
        direction: "desc",
      },
    ],
    fields: ["content", "updated", "box", "path"],
    viewType: "table",
  }

  return [
    {
      id: "preset-weekly-tasks",
      category: "attributes",
      title: "任务清单",
      description: "状态未完成且未来 7 天到期的任务",
      snapshot: createPresetSnapshot(taskTemplate, "table"),
    },
    {
      id: "preset-project-board",
      category: "attributes",
      title: "项目看板",
      description: "按状态分组的项目块看板",
      snapshot: createPresetSnapshot(boardTemplate, "board"),
    },
    {
      id: "preset-reading-queue",
      category: "attributes",
      title: "阅读清单",
      description: "未读内容按优先级排序",
      snapshot: createPresetSnapshot(readingTemplate, "table"),
    },
    {
      id: "preset-recent-custom-attribute-blocks-7d",
      category: "attributes",
      title: "近7天自定义属性块",
      description: "最近 7 天创建且带有自定义属性的块，可直接在结果中修改属性值。",
      snapshot: createPresetSnapshot(recentCustomAttributeBlocksTemplate, "table"),
    },
    {
      id: "preset-recent-meetings",
      category: "attributes",
      title: "会议回顾",
      description: "最近 30 天会议记录按项目查看",
      snapshot: createPresetSnapshot(meetingTemplate, "table"),
    },
    {
      id: "preset-core-documents-by-backlinks",
      category: "links",
      title: "高反链核心笔记",
      description: "按反向链接数排序，快速识别被最多笔记依赖的核心文档。",
      snapshot: createPresetSnapshot(topTaggedDocumentsTemplate, "table"),
    },
    {
      id: "preset-index-documents-by-outlinks",
      category: "links",
      title: "高正链索引笔记",
      description: "按正向链接数排序，识别承担目录和导航角色的索引文档。",
      snapshot: createPresetSnapshot(topOutlinkedDocumentsTemplate, "table"),
    },
    {
      id: "preset-bidirectional-core-documents",
      category: "links",
      title: "双向连接核心区",
      description: "同时有较多正链和反链的文档，适合优先精修知识网络中枢。",
      snapshot: createPresetSnapshot(bidirectionalCoreDocumentsTemplate, "table"),
    },
    {
      id: "preset-island-documents-without-links",
      category: "links",
      title: "无链接孤岛笔记",
      description: "筛出没有建立任何链接关系的文档，方便补齐知识网络连接。",
      snapshot: createPresetSnapshot(islandDocumentsTemplate, "table"),
    },
    {
      id: "preset-recent-linked-documents",
      category: "links",
      title: "近期活跃链接笔记",
      description: "查看最近 30 天更新且已经形成链接关系的活跃文档。",
      snapshot: createPresetSnapshot(recentLinkedDocumentsTemplate, "list"),
    },
    {
      id: "preset-recently-updated-documents-7d",
      category: "daily",
      title: "最近 7 天更新文档",
      description: "按更新时间回顾最近一周处理过的文档。",
      snapshot: createPresetSnapshot(recentlyUpdatedDocumentsTemplate, "table"),
    },
    {
      id: "preset-recently-created-documents-30d",
      category: "daily",
      title: "最近 30 天新建文档",
      description: "按创建时间查看最近新增积累，适合做月度整理回顾。",
      snapshot: createPresetSnapshot(recentlyCreatedDocumentsTemplate, "table"),
    },
    {
      id: "preset-top-documents-by-tags",
      category: "daily",
      title: "包含最多标签的文档(Top10)",
      description: "快速找出标签数量最多的文档，适合梳理高密度主题页面。",
      snapshot: createPresetSnapshot(topTaggedDocumentsByTagCountTemplate, "table"),
    },
    {
      id: "preset-top-documents-by-assets",
      category: "daily",
      title: "内嵌资源最多文档(Top10)",
      description: "按文档内嵌资源数量排序，快速定位图片、视频等资源密集文档。",
      snapshot: createPresetSnapshot(topAssetDocumentsTemplate, "table"),
    },
    {
      id: "preset-top-blocks-by-text-length",
      category: "daily",
      title: "字数最多的块(Top10)",
      description: "按文本字数长度降序排列，快速找出内容最长的块。",
      snapshot: createPresetSnapshot(topBlocksByTextLengthTemplate, "table"),
    },
    {
      id: "preset-today-edited-documents",
      category: "daily",
      title: "今日编辑速览",
      description: "聚焦今天更新过的文档，快速回看当前工作痕迹。",
      snapshot: createPresetSnapshot(todayEditedDocumentsTemplate, "table"),
    },
    {
      id: "preset-random-documents",
      category: "daily",
      title: "往日笔记随机漫游",
      description: "随机展示 10 篇文档，重新发现沉睡在知识库中的旧笔记。",
      snapshot: createPresetSnapshot(randomDocumentsTemplate, "table"),
    },
  ]
}
