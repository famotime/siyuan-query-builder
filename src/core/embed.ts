import type { ViewType } from "@/core/query/types"

export interface InlineEmbedPayload {
  templateId: string
  viewType: ViewType
  title?: string
}

export const SQB_EMBED_BRIDGE_KEY = "__siyuanQueryBuilderBridge"

function toSingleLineJsEmbed(script: string) {
  return `{{${script.trim().replace(/\r?\n/g, "_esc_newline_")}}}`
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

  const scriptMarkerMatch = input.match(/siyuan-query-builder:(\{.+?\})/s)
  if (scriptMarkerMatch?.[1]) {
    try {
      return JSON.parse(scriptMarkerMatch[1]) as InlineEmbedPayload
    } catch {
      return null
    }
  }

  return null
}

export function createEmbedBlockMarkdown(payload: InlineEmbedPayload) {
  const encoded = encodePayload(payload)
  const payloadJson = JSON.stringify(payload)

  const script = `//!js
/* siyuan-query-builder:${payloadJson} */
return (async () => {
  const payload = ${payloadJson};
  const host = document.createElement("div");
  host.className = "sqb-inline-host";
  host.dataset.sqbInline = ${JSON.stringify(encoded)};

  const fallback = document.createElement("div");
  fallback.className = "sqb-inline-host__fallback";

  const title = document.createElement("strong");
  title.textContent = payload.title || "未命名视图";

  const meta = document.createElement("span");
  meta.textContent = "siyuan-query-builder · " + payload.viewType;

  fallback.append(title, meta);
  host.appendChild(fallback);

  item.innerHTML = "";
  item.appendChild(host);

  const bridge = window.${SQB_EMBED_BRIDGE_KEY};
  if (bridge && typeof bridge.renderHost === "function") {
    await bridge.renderHost(host, payload);
  }

  return;
})();
`

  return toSingleLineJsEmbed(script)
}
