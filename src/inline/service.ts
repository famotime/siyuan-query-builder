import { createApp } from "vue"
import { showMessage } from "siyuan"
import type { Plugin } from "siyuan"

import { parseInlineEmbedPayload } from "@/core/embed"
import { buildQuery } from "@/core/query/compiler"
import { kernelAdapter } from "@/core/runtime/kernel-adapter"
import { createQueryRuntime } from "@/core/runtime/query-runtime"
import { createTemplateStore } from "@/core/storage/template-store"
import InlineQueryWidget from "@/inline/InlineQueryWidget.vue"
import { createInlineRenderController } from "@/inline/render-controller"

const EVENTS_TO_STOP = [
  "compositionstart",
  "compositionend",
  "mousedown",
  "mouseup",
  "keydown",
  "keyup",
  "input",
  "copy",
  "cut",
  "paste",
]

function shieldInlineElement(element: HTMLElement) {
  for (const eventName of EVENTS_TO_STOP) {
    element.addEventListener(eventName, event => event.stopPropagation(), true)
  }
}

export function createInlineBlockRenderer(plugin: Plugin) {
  const templateStore = createTemplateStore(plugin)
  const runtime = createQueryRuntime(kernelAdapter)
  const controller = createInlineRenderController({
    mount: async (element, rawPayload) => {
      const payload = rawPayload
      if (!payload) {
        return
      }

      const snapshot = await templateStore.get(payload.templateId)
      const host = document.createElement("div")
      host.className = "sqb-inline-root"
      shieldInlineElement(host)
      element.innerHTML = ""
      element.appendChild(host)

      if (!snapshot) {
        host.innerHTML = `<div class="sqb-inline-error">未找到模板：${payload.templateId}</div>`
        return
      }

      const compiled = buildQuery(snapshot.template)
      const result = await runtime.execute(compiled)
      const app = createApp(InlineQueryWidget, {
        title: payload.title || snapshot.template.name,
        viewType: payload.viewType,
        result,
        fields: snapshot.template.fields,
        groupBy: snapshot.template.groupBy,
        fieldMappings: snapshot.view.fieldMappings,
      })
      app.mount(host)

      return () => {
        app.unmount()
      }
    },
  })

  let frame = 0
  let started = false
  let scheduledRoot: ParentNode = document.body
  let scanQueued = false

  const runScan = async () => {
    scanQueued = false
    try {
      await controller.scan(scheduledRoot)
      controller.cleanup()
    } catch (error) {
      console.error("[siyuan-query-builder] inline scan failed", error)
      showMessage(`块内渲染失败：${error instanceof Error ? error.message : "未知错误"}`, 5000, "error")
    } finally {
      scheduledRoot = document.body
    }
  }

  const scheduleScan = (root: ParentNode = document.body) => {
    if (!started) {
      return
    }
    scheduledRoot = root
    if (scanQueued) {
      return
    }
    scanQueued = true
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(runScan)
  }

  const onLoaded = (...args: unknown[]) => {
    const maybeRoot = args.find((item): item is ParentNode => item instanceof Node)
    scheduleScan(maybeRoot || document.body)
  }

  return {
    start() {
      if (started) {
        return
      }
      started = true
      plugin.eventBus.on("loaded-protyle-static", onLoaded)
      plugin.eventBus.on("loaded-protyle-dynamic", onLoaded)
      scheduleScan()
    },
    scan() {
      scheduleScan()
    },
    destroy() {
      started = false
      cancelAnimationFrame(frame)
      scanQueued = false
      plugin.eventBus.off("loaded-protyle-static", onLoaded)
      plugin.eventBus.off("loaded-protyle-dynamic", onLoaded)
      controller.destroy()
    },
  }
}
