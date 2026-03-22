import { describe, expect, it } from "vitest"

import {
  createEmbedBlockMarkdown,
  parseInlineEmbedPayload,
} from "@/core/embed"

describe("inline embed payload", () => {
  it("creates mountable html markup for inline rendering", () => {
    const markdown = createEmbedBlockMarkdown({
      templateId: "template-7",
      viewType: "cards",
      title: "任务概览",
    })

    expect(markdown).toContain("data-sqb-inline")
    expect(markdown).toContain("template-7")
    expect(markdown).toContain("\"viewType\":\"cards\"")
  })

  it("parses inline payload from rendered html", () => {
    const html = createEmbedBlockMarkdown({
      templateId: "template-8",
      viewType: "list",
      title: "阅读清单",
    })

    const payload = parseInlineEmbedPayload(html)

    expect(payload).toEqual({
      templateId: "template-8",
      viewType: "list",
      title: "阅读清单",
    })
  })
})
