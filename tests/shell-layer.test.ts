import { describe, expect, it } from "vitest"

import { getShellLayerStyles } from "@/ui/shell-layers"

describe("shell layer styles", () => {
  it("keeps the interactive panel above the backdrop overlay", () => {
    const layers = getShellLayerStyles()

    expect(Number(layers.panel.zIndex)).toBeGreaterThan(Number(layers.backdrop.zIndex))
  })
})
