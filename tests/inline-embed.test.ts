import { describe, expect, it } from "vitest"

import {
  createEmbedBlockMarkdown,
  parseInlineEmbedPayload,
} from "@/core/embed"

describe("inline embed payload", () => {
  it("creates a mountable JS query embed block for inline rendering", () => {
    const markdown = createEmbedBlockMarkdown({
      templateId: "template-7",
      viewType: "cards",
      title: "任务概览",
    })

    expect(markdown).toContain("{{//!js")
    expect(markdown).toContain("_esc_newline_")
    expect(markdown).toContain("window.__siyuanQueryBuilderBridge")
    expect(markdown).toContain("template-7")
    expect(markdown).toContain("\"viewType\":\"cards\"")
    expect(markdown).not.toContain("\n")
  })

  it("parses inline payload from rendered html", () => {
    const html = createEmbedBlockMarkdown({
      templateId: "template-8",
      viewId: "view-8",
      viewType: "list",
      title: "阅读清单",
    })

    const payload = parseInlineEmbedPayload(html)

    expect(payload).toEqual({
      templateId: "template-8",
      viewId: "view-8",
      viewType: "list",
      title: "阅读清单",
    })
  })
})
