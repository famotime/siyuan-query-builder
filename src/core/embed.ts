import type { ViewType } from "@/core/query/types"

export interface InlineEmbedPayload {
  templateId: string
  viewType: ViewType
  title?: string
}

function encodePayload(payload: InlineEmbedPayload) {
  return encodeURIComponent(JSON.stringify(payload))
}

function decodePayload(value: string) {
  try {
    return JSON.parse(decodeURIComponent(value)) as InlineEmbedPayload
  } catch {
    return null
  }
}

export function parseInlineEmbedPayload(input: string | HTMLElement) {
  if (typeof input !== "string") {
    const encoded = input.dataset.sqbInline
    return encoded ? decodePayload(encoded) : null
  }

  const attrMatch = input.match(/data-sqb-inline=['"]([^'"]+)['"]/)
  if (attrMatch?.[1]) {
    return decodePayload(attrMatch[1])
  }

  const commentMatch = input.match(/<!--siyuan-query-builder:(.+?)-->/)
  if (commentMatch?.[1]) {
    try {
      return JSON.parse(commentMatch[1]) as InlineEmbedPayload
    } catch {
      return null
    }
  }

  return null
}

export function createEmbedBlockMarkdown(payload: InlineEmbedPayload) {
  const title = payload.title || "未命名视图"
  const encoded = encodePayload(payload)
  return `<div class="sqb-inline-host" data-sqb-inline="${encoded}">
  <div class="sqb-inline-host__fallback">
    <strong>${title}</strong>
    <span>siyuan-query-builder · ${payload.viewType}</span>
  </div>
</div>
<!--siyuan-query-builder:${JSON.stringify(payload)}-->`
}
