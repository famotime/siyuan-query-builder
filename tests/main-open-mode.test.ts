import { beforeEach, describe, expect, it, vi } from "vitest"

function createPlugin() {
  return {
    app: { appId: "app-1" },
    addTab: vi.fn(),
    loadData: vi.fn(async () => null),
    saveData: vi.fn(async () => {}),
    name: "siyuan-query-builder",
  }
}

async function loadMainModule() {
  const dialogCtor = vi.fn()
  const openTab = vi.fn(async () => ({ id: "tab-1" }))
  const showMessage = vi.fn()

  vi.doMock("@/external/siyuan", () => {
    class FakeDialog {
      element = document.createElement("div")
      destroyCallback?: () => void
      destroy = vi.fn(() => {
        this.destroyCallback?.()
      })

      constructor(options?: { content?: string, destroyCallback?: () => void }) {
        if (options?.content) {
          this.element.innerHTML = options.content
        }
        this.destroyCallback = options?.destroyCallback
        dialogCtor(options)
      }
    }

    return {
      Dialog: FakeDialog,
      openTab,
      showMessage,
    }
  })

  vi.doMock("@/App.vue", () => ({
    default: {
      template: "<div>Query Builder</div>",
    },
  }))

  const main = await import("@/main")
  return {
    ...main,
    dialogCtor,
    openTab,
    showMessage,
  }
}

describe("main open mode", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("registers a custom workspace tab on init", async () => {
    const plugin = createPlugin()
    const { destroy, init } = await loadMainModule()

    init(plugin as any)

    expect(plugin.addTab).toHaveBeenCalledTimes(1)
    expect(plugin.addTab).toHaveBeenCalledWith(expect.objectContaining({
      type: "workspace",
      init: expect.any(Function),
    }))

    destroy()
  })

  it("opens the query builder in a dialog by default", async () => {
    const plugin = createPlugin()
    const {
      destroy,
      dialogCtor,
      init,
      openPanel,
      openTab,
    } = await loadMainModule()

    init(plugin as any)
    await openPanel(false, "dialog")

    expect(dialogCtor).toHaveBeenCalledTimes(1)
    expect(openTab).not.toHaveBeenCalled()

    destroy()
  })

  it("opens the query builder in a custom tab when tab mode is selected", async () => {
    const plugin = createPlugin()
    const {
      destroy,
      init,
      openPanel,
      openTab,
    } = await loadMainModule()

    init(plugin as any)
    await openPanel(false, "dialog")
    await openPanel(false, "tab")

    expect(openTab).toHaveBeenCalledTimes(1)
    expect(openTab).toHaveBeenCalledWith(expect.objectContaining({
      app: plugin.app,
      custom: expect.objectContaining({
        title: "思源易搭 Query Builder",
        icon: "iconSearch",
      }),
    }))

    destroy()
  })
})
