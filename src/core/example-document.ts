import { toStorageAttrName } from "@/core/query/attributes"
import type { FieldMappings, QueryScope } from "@/core/query/types"

interface ExampleBlock {
  content: string
  attrs: Record<string, string>
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function renderGoDateLayout(date: Date, layout: string) {
  return layout
    .replaceAll("2006", "__YEAR__")
    .replaceAll("01", "__MONTH__")
    .replaceAll("02", "__DAY__")
    .replaceAll("__YEAR__", String(date.getFullYear()))
    .replaceAll("__MONTH__", String(date.getMonth() + 1).padStart(2, "0"))
    .replaceAll("__DAY__", String(date.getDate()).padStart(2, "0"))
}

function expandDailyNoteTemplate(template: string | undefined, now: Date) {
  const source = String(template || "/日记").trim()
  return source.replace(/\{\{\s*now\s*\|\s*date\s*"([^"]+)"\s*\}\}/g, (_, layout: string) => renderGoDateLayout(now, layout))
}

function buildExampleBlocks(mappings: FieldMappings, now: Date): ExampleBlock[] {
  const attrs = {
    status: toStorageAttrName(mappings.status),
    dueDate: toStorageAttrName(mappings.dueDate),
    priority: toStorageAttrName(mappings.priority),
    project: toStorageAttrName(mappings.project),
    owner: toStorageAttrName(mappings.owner),
  }
  const nextDay = formatDate(addDays(now, 1))
  const threeDays = formatDate(addDays(now, 3))
  const sixDays = formatDate(addDays(now, 6))
  const twoWeeks = formatDate(addDays(now, 14))

  return [
    {
      content: "修复登录页视觉样式 #task #frontend",
      attrs: {
        [attrs.status]: "Todo",
        [attrs.dueDate]: nextDay,
        [attrs.priority]: "P1",
        [attrs.project]: "官网改版",
        [attrs.owner]: "张三",
      },
    },
    {
      content: "同步 API 文档给前端 #task #backend",
      attrs: {
        [attrs.status]: "Doing",
        [attrs.dueDate]: threeDays,
        [attrs.priority]: "P2",
        [attrs.project]: "开放平台",
        [attrs.owner]: "Alice",
      },
    },
    {
      content: "整理迭代复盘行动项 #task #ops",
      attrs: {
        [attrs.status]: "Todo",
        [attrs.dueDate]: sixDays,
        [attrs.priority]: "P0",
        [attrs.project]: "交付提效",
        [attrs.owner]: "李四",
      },
    },
    {
      content: "归档旧版埋点脚本 #task #maintenance",
      attrs: {
        [attrs.status]: "Done",
        [attrs.dueDate]: nextDay,
        [attrs.priority]: "P3",
        [attrs.project]: "技术债清理",
        [attrs.owner]: "王五",
      },
    },
    {
      content: "官网改版第一阶段排期确认",
      attrs: {
        [attrs.status]: "Todo",
        [attrs.dueDate]: threeDays,
        [attrs.priority]: "P1",
        [attrs.project]: "官网改版",
        [attrs.owner]: "张三",
      },
    },
    {
      content: "开放平台 SDK 发布准备",
      attrs: {
        [attrs.status]: "Doing",
        [attrs.dueDate]: sixDays,
        [attrs.priority]: "P0",
        [attrs.project]: "开放平台",
        [attrs.owner]: "Alice",
      },
    },
    {
      content: "知识库迁移收尾",
      attrs: {
        [attrs.status]: "Done",
        [attrs.dueDate]: twoWeeks,
        [attrs.priority]: "P2",
        [attrs.project]: "知识中台",
        [attrs.owner]: "李四",
      },
    },
    {
      content: "阅读《Designing Data-Intensive Applications》 #reading #backend",
      attrs: {
        [attrs.status]: "Unread",
        [attrs.priority]: "P1",
        [attrs.project]: "阅读清单",
        [attrs.owner]: "自己",
      },
    },
    {
      content: "跟进《Refactoring UI》案例 #reading #design",
      attrs: {
        [attrs.status]: "Unread",
        [attrs.priority]: "P2",
        [attrs.project]: "阅读清单",
        [attrs.owner]: "自己",
      },
    },
    {
      content: "浏览 SiYuan API 变更记录 #reading #siyuan",
      attrs: {
        [attrs.status]: "Unread",
        [attrs.priority]: "P0",
        [attrs.project]: "阅读清单",
        [attrs.owner]: "自己",
      },
    },
  ]
}

export function formatExampleDocumentTitle(now = new Date()) {
  return `${formatDate(now)} Query Builder 示例`
}

export function buildDailyNoteExamplePath(dailyNoteSavePath: string | undefined, now = new Date()) {
  const expanded = expandDailyNoteTemplate(dailyNoteSavePath, now)
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")

  const segments = expanded.split("/").filter(Boolean)
  if (!segments.length) {
    return `/${formatExampleDocumentTitle(now)}`
  }

  if (segments.length === 1) {
    return `/${segments[0]}/${formatExampleDocumentTitle(now)}`
  }

  const parent = segments.slice(0, -1).join("/")
  const leaf = segments.at(-1) || formatDate(now)
  return `/${parent}/${leaf} Query Builder 示例`
}

export function pickExampleNotebookId(notebooks: Notebook[], scope: QueryScope) {
  if (scope.type === "notebook" && scope.value) {
    const matched = notebooks.find(notebook => notebook.id === scope.value)
    if (matched) {
      return matched.id
    }
  }

  return notebooks.find(notebook => !notebook.closed)?.id || notebooks[0]?.id || ""
}

export function buildPresetExampleDocument(now: Date, mappings: FieldMappings) {
  const blocks = buildExampleBlocks(mappings, now)
  return {
    markdown: [
      `# ${formatExampleDocumentTitle(now)}`,
      "",
      "## 任务清单示例",
      "",
      blocks[0]?.content || "",
      "",
      blocks[1]?.content || "",
      "",
      blocks[2]?.content || "",
      "",
      blocks[3]?.content || "",
      "",
      "## 项目看板示例",
      "",
      blocks[4]?.content || "",
      "",
      blocks[5]?.content || "",
      "",
      blocks[6]?.content || "",
      "",
      "## 阅读清单示例",
      "",
      blocks[7]?.content || "",
      "",
      blocks[8]?.content || "",
      "",
      blocks[9]?.content || "",
    ].join("\n"),
    blockAttrs: blocks.map(block => block.attrs),
  }
}
