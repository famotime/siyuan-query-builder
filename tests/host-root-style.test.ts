import { describe, expect, it } from "vitest"

import { getHostRootStyles } from "@/ui/host-root-styles"

describe("host root styles", () => {
  it("does not make the host root a fullscreen hit target", () => {
    const styles = getHostRootStyles()

    expect(styles.position).not.toBe("fixed")
    expect(styles.pointerEvents).not.toBe("auto")
  })
})
