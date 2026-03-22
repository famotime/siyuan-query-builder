import { describe, expect, it } from "vitest"

import { createEmbedBlockMarkdown } from "@/core/embed"

describe("createEmbedBlockMarkdown", () => {
  it("creates a stable embed descriptor that references template and view type", () => {
    const markdown = createEmbedBlockMarkdown({
      templateId: "template-42",
      viewType: "board",
      title: "项目看板",
    })

    expect(markdown).toContain("siyuan-query-builder")
    expect(markdown).toContain("template-42")
    expect(markdown).toContain("\"viewType\":\"board\"")
  })
})
