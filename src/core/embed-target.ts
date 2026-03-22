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

export function getActiveDocumentTarget(input: { siyuan?: { getActiveEditor?: () => any } } | Window): ActiveDocumentTarget | null {
  const activeEditor = input?.siyuan?.getActiveEditor?.()
  const protyle = activeEditor?.protyle
  const block = protyle?.block
  const id = String(block?.rootID || block?.rootId || block?.root_id || block?.id || "").trim()
  if (!id) {
    return null
  }

  const title = String(activeEditor?.title || activeEditor?.model?.title || id).trim() || id
  return { id, title }
}
