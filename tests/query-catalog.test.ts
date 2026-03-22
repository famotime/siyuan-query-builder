import { describe, expect, it } from "vitest"

import { createPresets, DEFAULT_FIELD_MAPPINGS } from "@/core/query/catalog"

describe("createPresets", () => {
  it("includes a preset for top documents ranked by tag count", () => {
    const presets = createPresets(DEFAULT_FIELD_MAPPINGS)
    const preset = presets.find(item => item.id === "preset-top-tagged-documents")

    expect(preset).toBeDefined()
    expect(preset?.title).toBe("标签最多文档")
    expect(preset?.snapshot.template.scope).toEqual({
      type: "block_type",
      value: "d",
    })
    expect(preset?.snapshot.template.fields).toEqual(["content", "tag", "tagCount"])
    expect(preset?.snapshot.template.sorts).toEqual([
      {
        field: "tagCount",
        direction: "desc",
      },
    ])
    expect(preset?.snapshot.template.limit).toBe(10)
  })
})
