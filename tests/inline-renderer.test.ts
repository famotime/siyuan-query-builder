import { describe, expect, it, vi } from "vitest"

import { createInlineRenderController } from "@/inline/render-controller"

describe("createInlineRenderController", () => {
  it("mounts matching inline blocks once and disposes removed ones", async () => {
    document.body.innerHTML = `
      <div id="root">
        <div data-sqb-inline='{"templateId":"t-1","viewType":"table","title":"Tasks"}'></div>
      </div>
    `

    const mount = vi.fn(async (element: HTMLElement) => {
      element.dataset.mounted = "yes"
      return () => {
        element.dataset.disposed = "yes"
      }
    })

    const controller = createInlineRenderController({ mount })
    await controller.scan(document.body)

    const element = document.querySelector("[data-sqb-inline]") as HTMLElement
    expect(mount).toHaveBeenCalledTimes(1)
    expect(element.dataset.mounted).toBe("yes")

    await controller.scan(document.body)
    expect(mount).toHaveBeenCalledTimes(1)

    element.remove()
    controller.cleanup()
    expect(element.dataset.disposed).toBe("yes")
  })
})
