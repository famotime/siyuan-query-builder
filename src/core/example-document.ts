import type { FieldMappings, QueryScope } from "@/core/query/types"

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

function escapeAttrValue(value: string) {
  return value.replace(/"/g, "&quot;")
}

function buildAttrString(attrs: Record<string, string>) {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${escapeAttrValue(value)}"`)
    .join(" ")
}

function buildParagraph(content: string, attrs: Record<string, string>) {
  return `${content}\n{: ${buildAttrString(attrs)}}`
}

export function formatExampleDocumentTitle(now = new Date()) {
  return `${formatDate(now)} Query Builder 示例`
}

export function buildDailyNoteExamplePath(dailyNoteSavePath: string | undefined, title: string) {
  const normalizedDir = `/${String(dailyNoteSavePath || "/日记").trim()}`
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "")

  return `${normalizedDir}/${title}`
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

export function buildPresetExampleDocumentMarkdown(mappings: FieldMappings, now = new Date()) {
  const attrs = {
    status: mappings.status.trim(),
    dueDate: mappings.dueDate.trim(),
    priority: mappings.priority.trim(),
    project: mappings.project.trim(),
    owner: mappings.owner.trim(),
  }
  const nextDay = formatDate(addDays(now, 1))
  const threeDays = formatDate(addDays(now, 3))
  const sixDays = formatDate(addDays(now, 6))
  const twoWeeks = formatDate(addDays(now, 14))

  return [
    `# ${formatExampleDocumentTitle(now)}`,
    "",
    "> 这份示例文档覆盖任务清单、项目看板、阅读清单等预设场景，可直接用于验证字段映射与查询结果。",
    "",
    "## 任务清单示例",
    "",
    buildParagraph("修复登录页视觉样式 #task #frontend", {
      [attrs.status]: "Todo",
      [attrs.dueDate]: nextDay,
      [attrs.priority]: "P1",
      [attrs.project]: "官网改版",
      [attrs.owner]: "张三",
    }),
    "",
    buildParagraph("同步 API 文档给前端 #task #backend", {
      [attrs.status]: "Doing",
      [attrs.dueDate]: threeDays,
      [attrs.priority]: "P2",
      [attrs.project]: "开放平台",
      [attrs.owner]: "Alice",
    }),
    "",
    buildParagraph("整理迭代复盘行动项 #task #ops", {
      [attrs.status]: "Todo",
      [attrs.dueDate]: sixDays,
      [attrs.priority]: "P0",
      [attrs.project]: "交付提效",
      [attrs.owner]: "李四",
    }),
    "",
    buildParagraph("归档旧版埋点脚本 #task #maintenance", {
      [attrs.status]: "Done",
      [attrs.dueDate]: nextDay,
      [attrs.priority]: "P3",
      [attrs.project]: "技术债清理",
      [attrs.owner]: "王五",
    }),
    "",
    "## 项目看板示例",
    "",
    buildParagraph("官网改版第一阶段排期确认", {
      [attrs.status]: "Todo",
      [attrs.dueDate]: threeDays,
      [attrs.priority]: "P1",
      [attrs.project]: "官网改版",
      [attrs.owner]: "张三",
    }),
    "",
    buildParagraph("开放平台 SDK 发布准备", {
      [attrs.status]: "Doing",
      [attrs.dueDate]: sixDays,
      [attrs.priority]: "P0",
      [attrs.project]: "开放平台",
      [attrs.owner]: "Alice",
    }),
    "",
    buildParagraph("知识库迁移收尾", {
      [attrs.status]: "Done",
      [attrs.dueDate]: twoWeeks,
      [attrs.priority]: "P2",
      [attrs.project]: "知识中台",
      [attrs.owner]: "李四",
    }),
    "",
    "## 阅读清单示例",
    "",
    buildParagraph("阅读《Designing Data-Intensive Applications》 #reading #backend", {
      [attrs.status]: "Unread",
      [attrs.priority]: "P1",
      [attrs.project]: "阅读清单",
      [attrs.owner]: "自己",
    }),
    "",
    buildParagraph("跟进《Refactoring UI》案例 #reading #design", {
      [attrs.status]: "Unread",
      [attrs.priority]: "P2",
      [attrs.project]: "阅读清单",
      [attrs.owner]: "自己",
    }),
    "",
    buildParagraph("浏览 SiYuan API 变更记录 #reading #siyuan", {
      [attrs.status]: "Unread",
      [attrs.priority]: "P0",
      [attrs.project]: "阅读清单",
      [attrs.owner]: "自己",
    }),
  ].join("\n")
}
