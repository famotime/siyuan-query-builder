import { describe, expect, it } from "vitest"

import { createEmbedBlockMarkdown } from "@/core/embed"

describe("createEmbedBlockMarkdown", () => {
  it("creates a SiYuan JS query embed block that references template and view type", () => {
    const markdown = createEmbedBlockMarkdown({
      templateId: "template-42",
      viewType: "board",
      title: "项目看板",
    })

    expect(markdown).toContain("{{//!js")
    expect(markdown).toContain("_esc_newline_")
    expect(markdown).toContain("siyuan-query-builder")
    expect(markdown).toContain("template-42")
    expect(markdown).toContain("\"viewType\":\"board\"")
    expect(markdown).toContain("window.__siyuanQueryBuilderBridge")
    expect(markdown).not.toContain("\n")
  })

  it("does not return an empty block id list that triggers SiYuan empty-result fallback", () => {
    const markdown = createEmbedBlockMarkdown({
      templateId: "template-42",
      viewType: "board",
      title: "项目看板",
    })

    expect(markdown).not.toContain("return [];")
    expect(markdown).toContain("return;")
  })

  it("writes an explicit theme marker into the embed host when SiYuan theme classes are unavailable", () => {
    const markdown = createEmbedBlockMarkdown({
      templateId: "template-42",
      viewType: "board",
      title: "项目看板",
    })

    expect(markdown).toContain('host.dataset.sqbTheme')
    expect(markdown).toContain('window?.siyuan?.config?.appearance?.mode')
  })
})
