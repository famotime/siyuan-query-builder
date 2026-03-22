export interface EmbedTargetPreview {
  id: string
  type: "document" | "block"
  title: string
  content: string
}

export interface ActiveDocumentTarget {
  id: string
  title: string
}

export function normalizeRecentEmbedTargetIds(values: string[], maxItems = 6) {
  const normalized: string[] = []
  const seen = new Set<string>()

  for (const value of values) {
    const id = value.trim()
    if (!id || !isLikelyBlockId(id) || seen.has(id)) {
      continue
    }
    seen.add(id)
    normalized.push(id)
    if (normalized.length >= maxItems) {
      break
    }
  }

  return normalized
}

function isTabLike(value: unknown): value is Record<string, any> {
  if (!value || typeof value !== "object") {
    return false
  }
  return value.instance === "Tab" || "model" in value || "headElement" in value || "title" in value
}

function getLayoutChildren(node: unknown): Record<string, any>[] {
  if (!node || typeof node !== "object" || !Array.isArray((node as Record<string, any>).children)) {
    return []
  }
  return (node as Record<string, any>).children
}

function getTabEditorModel(tab: Record<string, any>) {
  if (tab.model && typeof tab.model === "object") {
    return tab.model
  }
  if (tab.children && !Array.isArray(tab.children) && typeof tab.children === "object") {
    return tab.children
  }
  return null
}

function collectTabsFromLayout(node: unknown, tabs: Record<string, any>[]) {
  if (!node || typeof node !== "object") {
    return
  }
  if (isTabLike(node)) {
    tabs.push(node)
  }
  for (const child of getLayoutChildren(node)) {
    collectTabsFromLayout(child, tabs)
  }
}

function resolveTargetFromTab(tab: Record<string, any>): ActiveDocumentTarget | null {
  const editor = getTabEditorModel(tab)
  const id = String(editor?.rootId || editor?.rootID || editor?.root_id || "").trim()
  if (!id) {
    return null
  }
  const title = String(tab.title || id).trim() || id
  return { id, title }
}

function getActiveDocumentTargetFromLayout(input: { siyuan?: any } | Window): ActiveDocumentTarget | null {
  const tabs: Record<string, any>[] = []
  const siyuan = input?.siyuan
  collectTabsFromLayout(siyuan?.layout?.centerLayout, tabs)
  collectTabsFromLayout(siyuan?.config?.uiLayout?.layout, tabs)
  if (!tabs.length) {
    return null
  }

  const activeTab = tabs.find(tab => tab.active) || tabs
    .slice()
    .sort((a, b) => Number(b.activeTime || 0) - Number(a.activeTime || 0))[0]

  return activeTab ? resolveTargetFromTab(activeTab) : null
}

export function isLikelyBlockId(value: string) {
  return /^\d{14}-[a-z0-9]{7,}$/i.test(value.trim())
}

export function summarizeBlockLabel(value: string, maxLength = 36) {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (!normalized) {
    return ""
  }
  if (normalized.length <= maxLength) {
    return normalized
  }
  return `${normalized.slice(0, maxLength)}…`
}

export function formatEmbedTargetHint(target: EmbedTargetPreview | null) {
  if (!target) {
    return ""
  }
  if (target.type === "document") {
    return `文档：${target.title || target.id}`
  }
  return `块：${target.content || target.title || target.id}`
}

export function createEmbedTargetPreview(block: Partial<Block> | null | undefined, fallbackId: string): EmbedTargetPreview | null {
  if (!block?.id && !fallbackId) {
    return null
  }

  const id = String(block?.id || fallbackId).trim()
  if (!id) {
    return null
  }

  return {
    id,
    type: block?.type === "d" ? "document" : "block",
    title: summarizeBlockLabel(String(block?.content || block?.name || id), 40),
    content: summarizeBlockLabel(String(block?.content || block?.fcontent || block?.name || id), 48),
  }
}

export function getActiveDocumentTarget(input: { siyuan?: { getActiveEditor?: () => any } } | Window): ActiveDocumentTarget | null {
  const activeEditor = input?.siyuan?.getActiveEditor?.()
  const protyle = activeEditor?.protyle
  const block = protyle?.block
  const id = String(
    block?.rootID
    || block?.rootId
    || block?.root_id
    || activeEditor?.rootID
    || activeEditor?.rootId
    || activeEditor?.root_id
    || block?.id
    || "",
  ).trim()
  if (!id) {
    return getActiveDocumentTargetFromLayout(input)
  }

  const title = String(
    activeEditor?.title
    || activeEditor?.model?.title
    || activeEditor?.tab?.title
    || id,
  ).trim() || id
  return { id, title }
}
