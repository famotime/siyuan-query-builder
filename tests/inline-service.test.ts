import { beforeEach, describe, expect, it, vi } from "vitest"

import type { InlineEmbedPayload } from "@/core/embed"
import { SQB_EMBED_BRIDGE_KEY } from "@/core/embed"

const { createAppMock, showMessage, lsNotebooks, templateStoreGet, runtimeExecute, buildQuery, controllerScan, controllerCleanup, controllerDestroy, createInlineRenderControllerMock } = vi.hoisted(() => {
  const createAppMock = vi.fn()
  const showMessage = vi.fn()
  const lsNotebooks = vi.fn(async () => ({
    notebooks: [],
  }))
  const templateStoreGet = vi.fn()
  const runtimeExecute = vi.fn(async () => ({
    rows: [],
    total: 0,
    executedAt: "2026-03-23T00:00:00.000Z",
  }))
  const buildQuery = vi.fn((template: { fields: string[] }) => ({
    sql: "SELECT * FROM blocks",
    meta: {
      selectedFields: template.fields,
    },
  }))
  const controllerScan = vi.fn(async () => {})
  const controllerCleanup = vi.fn()
  const controllerDestroy = vi.fn()
  const createInlineRenderControllerMock = vi.fn((options: unknown) => ({
    scan: controllerScan,
    cleanup: controllerCleanup,
    destroy: controllerDestroy,
    ...(options as Record<string, unknown>),
  }))

  return {
    buildQuery,
    controllerCleanup,
    controllerDestroy,
    controllerScan,
    createAppMock,
    createInlineRenderControllerMock,
    lsNotebooks,
    runtimeExecute,
    showMessage,
    templateStoreGet,
  }
})

vi.mock(import("vue"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    createApp: createAppMock,
  }
})

vi.mock("@/external/siyuan", () => ({
  showMessage,
}))

vi.mock("@/api", () => ({
  lsNotebooks,
}))

vi.mock("@/core/query/compiler", () => ({
  buildQuery,
}))

vi.mock("@/core/runtime/kernel-adapter", () => ({
  kernelAdapter: {},
}))

vi.mock("@/core/runtime/query-runtime", () => ({
  createQueryRuntime: () => ({
    execute: runtimeExecute,
  }),
}))

vi.mock("@/core/storage/template-store", () => ({
  createTemplateStore: () => ({
    get: templateStoreGet,
  }),
}))

vi.mock("@/inline/render-controller", () => ({
  createInlineRenderController: createInlineRenderControllerMock,
}))

import { createInlineBlockRenderer } from "@/inline/service"
import zhCN from "@/i18n/zh_CN.json"

function createPlugin() {
  return {
    i18n: zhCN,
    eventBus: {
      on: vi.fn(),
      off: vi.fn(),
    },
  } as any
}

function createSnapshot() {
  return {
    template: {
      id: "template-1",
      version: 1,
      name: "任务清单",
      scope: {
        type: "all_blocks",
      },
      filters: [],
      sorts: [],
      fields: ["content"],
      viewType: "table",
    },
    view: {
      id: "view-1",
      queryTemplateId: "template-1",
      type: "table",
      defaultView: true,
      fieldMappings: {
        status: "status",
        dueDate: "dueDate",
        priority: "priority",
        project: "project",
        owner: "owner",
      },
    },
  }
}

describe("createInlineBlockRenderer", () => {
  beforeEach(() => {
    createAppMock.mockReset()
    showMessage.mockReset()
    lsNotebooks.mockClear()
    templateStoreGet.mockReset()
    runtimeExecute.mockClear()
    buildQuery.mockClear()
    controllerScan.mockClear()
    controllerCleanup.mockClear()
    controllerDestroy.mockClear()
    createInlineRenderControllerMock.mockClear()
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal("cancelAnimationFrame", vi.fn())
    document.body.className = ""
    document.documentElement.className = ""
    delete (window as Record<string, unknown>)[SQB_EMBED_BRIDGE_KEY]
  })

  it("starts only once and registers bridge and event listeners once", () => {
    const plugin = createPlugin()
    const renderer = createInlineBlockRenderer(plugin)

    renderer.start()
    renderer.start()

    expect(createInlineRenderControllerMock).toHaveBeenCalledTimes(1)
    expect(plugin.eventBus.on).toHaveBeenCalledTimes(2)
    expect(plugin.eventBus.on).toHaveBeenCalledWith("loaded-protyle-static", expect.any(Function))
    expect(plugin.eventBus.on).toHaveBeenCalledWith("loaded-protyle-dynamic", expect.any(Function))
    expect(controllerScan).toHaveBeenCalledTimes(1)
    expect(window[SQB_EMBED_BRIDGE_KEY]).toEqual(expect.objectContaining({
      renderHost: expect.any(Function),
    }))
  })

  it("disposes the previous bridge mount before replacing it", async () => {
    const plugin = createPlugin()
    const firstUnmount = vi.fn()
    const secondUnmount = vi.fn()
    createAppMock
      .mockReturnValueOnce({
        mount: vi.fn(),
        unmount: firstUnmount,
      })
      .mockReturnValueOnce({
        mount: vi.fn(),
        unmount: secondUnmount,
      })
    templateStoreGet.mockResolvedValue(createSnapshot())

    const renderer = createInlineBlockRenderer(plugin)
    renderer.start()

    const host = document.createElement("div")
    const payload: InlineEmbedPayload = {
      templateId: "template-1",
      viewType: "table",
      title: "任务清单",
    }

    await window[SQB_EMBED_BRIDGE_KEY]?.renderHost(host, payload)
    await window[SQB_EMBED_BRIDGE_KEY]?.renderHost(host, payload)

    expect(firstUnmount).toHaveBeenCalledTimes(1)
    expect(secondUnmount).not.toHaveBeenCalled()
  })

  it("renders an inline error when the template cannot be found", async () => {
    const plugin = createPlugin()
    templateStoreGet.mockResolvedValue(null)

    const renderer = createInlineBlockRenderer(plugin)
    renderer.start()

    const host = document.createElement("div")
    await window[SQB_EMBED_BRIDGE_KEY]?.renderHost(host, {
      templateId: "missing-template",
      viewType: "table",
      title: "Missing",
    })

    expect(host.innerHTML).toContain("未找到模板：missing-template")
  })

  it("mounts the inline widget in a theme-token host wrapper", async () => {
    const plugin = createPlugin()
    createAppMock.mockReturnValue({
      mount: vi.fn(),
      unmount: vi.fn(),
    })
    templateStoreGet.mockResolvedValue(createSnapshot())

    const renderer = createInlineBlockRenderer(plugin)
    renderer.start()

    const host = document.createElement("div")
    await window[SQB_EMBED_BRIDGE_KEY]?.renderHost(host, {
      templateId: "template-1",
      viewType: "table",
      title: "任务清单",
    })

    const inlineHost = host.firstElementChild as HTMLElement | null

    expect(inlineHost).not.toBeNull()
    expect(inlineHost?.classList.contains("sqb-inline-host")).toBe(true)
  })

  it("mirrors the current SiYuan theme class onto the inline host", async () => {
    document.body.classList.add("b3-theme-light")
    const plugin = createPlugin()
    createAppMock.mockReturnValue({
      mount: vi.fn(),
      unmount: vi.fn(),
    })
    templateStoreGet.mockResolvedValue(createSnapshot())

    const renderer = createInlineBlockRenderer(plugin)
    renderer.start()

    const host = document.createElement("div")
    await window[SQB_EMBED_BRIDGE_KEY]?.renderHost(host, {
      templateId: "template-1",
      viewType: "table",
      title: "任务清单",
    })

    const inlineHost = host.firstElementChild as HTMLElement | null

    expect(inlineHost?.classList.contains("b3-theme-light")).toBe(true)
  })

  it("falls back to the current SiYuan appearance mode when DOM theme classes are unavailable", async () => {
    const plugin = createPlugin()
    createAppMock.mockReturnValue({
      mount: vi.fn(),
      unmount: vi.fn(),
    })
    templateStoreGet.mockResolvedValue(createSnapshot())
    ;(window as any).siyuan = {
      config: {
        appearance: {
          mode: 1,
        },
      },
    }

    const renderer = createInlineBlockRenderer(plugin)
    renderer.start()

    const host = document.createElement("div")
    await window[SQB_EMBED_BRIDGE_KEY]?.renderHost(host, {
      templateId: "template-1",
      viewType: "table",
      title: "任务清单",
    })

    const inlineHost = host.firstElementChild as HTMLElement | null

    expect(inlineHost?.dataset.sqbTheme).toBe("dark")
  })

  it("cleans up bridge state, event listeners, controller state, and mounted apps on destroy", async () => {
    const plugin = createPlugin()
    const unmount = vi.fn()
    createAppMock.mockReturnValue({
      mount: vi.fn(),
      unmount,
    })
    templateStoreGet.mockResolvedValue(createSnapshot())

    const renderer = createInlineBlockRenderer(plugin)
    renderer.start()

    const host = document.createElement("div")
    await window[SQB_EMBED_BRIDGE_KEY]?.renderHost(host, {
      templateId: "template-1",
      viewType: "table",
      title: "任务清单",
    })

    renderer.destroy()

    expect(unmount).toHaveBeenCalledTimes(1)
    expect(plugin.eventBus.off).toHaveBeenCalledTimes(2)
    expect(controllerDestroy).toHaveBeenCalledTimes(1)
    expect(window[SQB_EMBED_BRIDGE_KEY]).toBeUndefined()
  })
})
