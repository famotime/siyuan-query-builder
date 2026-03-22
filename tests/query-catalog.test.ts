import { describe, expect, it } from "vitest"

import { createPresets, DEFAULT_FIELD_MAPPINGS } from "@/core/query/catalog"

describe("createPresets", () => {
  it("includes a preset for core documents ranked by backlinks", () => {
    const presets = createPresets(DEFAULT_FIELD_MAPPINGS)
    const preset = presets.find(item => item.id === "preset-core-documents-by-backlinks")

    expect(preset).toBeDefined()
    expect(preset?.title).toBe("高反链核心笔记")
    expect(preset?.snapshot.template.scope).toEqual({
      type: "block_type",
      value: "d",
    })
    expect(preset?.snapshot.template.fields).toEqual(["content", "backlinkCount", "outLinkCount", "updated", "box"])
    expect(preset?.snapshot.template.sorts).toEqual([
      {
        field: "backlinkCount",
        direction: "desc",
      },
    ])
    expect(preset?.snapshot.template.viewType).toBe("table")
  })

  it("includes the requested link-centric and recent activity presets", () => {
    const presets = createPresets(DEFAULT_FIELD_MAPPINGS)

    expect(presets.map(item => item.id)).toEqual(expect.arrayContaining([
      "preset-core-documents-by-backlinks",
      "preset-index-documents-by-outlinks",
      "preset-bidirectional-core-documents",
      "preset-island-documents-without-links",
      "preset-recent-linked-documents",
      "preset-recently-updated-documents-7d",
      "preset-recently-created-documents-30d",
      "preset-today-edited-documents",
    ]))

    const recentLinked = presets.find(item => item.id === "preset-recent-linked-documents")
    expect(recentLinked?.snapshot.view.type).toBe("list")
    expect(recentLinked?.snapshot.template.filters).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "updated",
        operator: "last_days",
        value: "30",
      }),
      expect.objectContaining({
        field: "linkCount",
        operator: "gt",
        value: "0",
      }),
    ]))
  })
})
