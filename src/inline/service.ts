import { createApp } from "vue"

import { lsNotebooks } from "@/api"
import {
  type InlineEmbedPayload,
  parseInlineEmbedPayload,
} from "@/core/embed"
import { buildQuery } from "@/core/query/compiler"
import { kernelAdapter } from "@/core/runtime/kernel-adapter"
import { createQueryRuntime } from "@/core/runtime/query-runtime"
import { createTemplateStore } from "@/core/storage/template-store"
import { showMessage } from "@/external/siyuan"
import type { Plugin } from "@/external/siyuan"
import { createInlineBridgeRegistry } from "@/inline/bridge-registry"
import InlineQueryWidget from "@/inline/InlineQueryWidget.vue"
import { createInlineRenderController } from "@/inline/render-controller"
import { createInlineScanLifecycle } from "@/inline/scan-lifecycle"
import { syncSiyuanThemeMarkers } from "@/ui/theme"
import { createI18nHelper } from "@/utils/i18n"

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

type DisposeFn = () => void

function shieldInlineElement(element: HTMLElement) {
  for (const eventName of EVENTS_TO_STOP) {
    element.addEventListener(eventName, event => event.stopPropagation(), true)
  }
}

function renderInlineError(element: HTMLElement, message: string) {
  element.innerHTML = `<div class="sqb-inline-error">${message}</div>`
}

export function createInlineBlockRenderer(plugin: Plugin) {
  const t = createI18nHelper(plugin)
  const templateStore = createTemplateStore(plugin)
  const runtime = createQueryRuntime(kernelAdapter)
  const notebooksPromise = lsNotebooks()
    .then(result => result?.notebooks || [])
    .catch(() => [])
  const mountPayload = async (element: HTMLElement, payload: InlineEmbedPayload) => {
    const snapshot = await templateStore.get(payload.templateId, payload.viewId)
    const notebooks = await notebooksPromise
    const host = document.createElement("div")
    host.className = "sqb-inline-root sqb-inline-host"
    syncSiyuanThemeMarkers(host)
    shieldInlineElement(host)
    element.innerHTML = ""
    element.appendChild(host)

    if (!snapshot) {
      renderInlineError(host, t("inlineTemplateNotFound", { id: payload.templateId }))
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
      notebooks,
    })
    app.mount(host)

    return () => {
      app.unmount()
    }
  }

  const controller = createInlineRenderController({
    mount: async (element, rawPayload) => {
      const payload = rawPayload
      if (!payload) {
        return
      }
      return mountPayload(element, payload)
    },
  })

  const runScan = (root: ParentNode) => {
    try {
      void controller.scan(root)
      controller.cleanup()
    } catch (error) {
      console.error("[siyuan-query-builder] inline scan failed", error)
      showMessage(t("inlineRenderFailed", { error: error instanceof Error ? error.message : t("errorUnknown") }), 5000, "error")
    }
  }

  const bridgeRegistry = createInlineBridgeRegistry({
    mount: mountPayload,
    onError: (element, error) => {
      console.error("[siyuan-query-builder] inline bridge render failed", error)
      renderInlineError(element, t("inlineRenderFailed", { error: error instanceof Error ? error.message : t("errorUnknown") }))
    },
  })
  const scanLifecycle = createInlineScanLifecycle({
    plugin,
    bridge: bridgeRegistry.bridge,
    runScan,
  })

  return {
    start() {
      scanLifecycle.start()
    },
    scan() {
      scanLifecycle.scan()
    },
    destroy() {
      scanLifecycle.destroy()
      controller.destroy()
      bridgeRegistry.destroy()
    },
  }
}
