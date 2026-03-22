import type { App as VueApp } from "vue"
import { createApp } from "vue"
import { Dialog, showMessage } from "siyuan"
import type { Plugin } from "siyuan"

import App from "./App.vue"

let pluginInstance: Plugin | null = null
let app: VueApp | null = null
let dialog: Dialog | null = null
let rootElement: HTMLDivElement | null = null

export function usePlugin() {
  if (!pluginInstance) {
    throw new Error("Plugin instance has not been initialized")
  }
  return pluginInstance
}

export function init(plugin: Plugin) {
  pluginInstance = plugin
}

async function appendDebugLog(source: string, error: unknown, info?: string) {
  if (!pluginInstance) {
    return
  }

  const message = error instanceof Error
    ? `${error.name}: ${error.message}\n${error.stack || ""}`
    : String(error)
  const entry = {
    source,
    info: info || "",
    message,
    time: new Date().toISOString(),
  }

  try {
    const current = await pluginInstance.loadData("debug.runtime-errors.v1")
    const next = Array.isArray(current) ? [...current, entry].slice(-20) : [entry]
    await pluginInstance.saveData("debug.runtime-errors.v1", next)
  } catch (persistError) {
    console.error("[siyuan-query-builder] failed to persist debug log", persistError)
  }
}

function destroyMount() {
  app?.unmount()
  app = null

  if (rootElement) {
    rootElement.innerHTML = ""
  }

  rootElement = null
  dialog = null
}

export function openPanel(forceVisible = false) {
  if (!pluginInstance) {
    throw new Error("Plugin instance has not been initialized")
  }

  if (dialog) {
    if (!forceVisible) {
      dialog.destroy()
    }
    return
  }

  dialog = new Dialog({
    title: "思源易搭 Query Builder",
    width: "min(1480px, 92vw)",
    height: "min(900px, 88vh)",
    content: '<div id="siyuan-query-builder-root" style="height: 100%;"></div>',
    destroyCallback: () => {
      destroyMount()
    },
  })

  rootElement = dialog.element.querySelector("#siyuan-query-builder-root") as HTMLDivElement | null
  if (!rootElement) {
    dialog.destroy()
    throw new Error("Failed to create query builder dialog host")
  }

  app = createApp(App)
  app.config.errorHandler = (error, instance, info) => {
    console.error("[siyuan-query-builder] vue runtime error", error, info, instance)
    appendDebugLog("vue-error-handler", error, info)
    if (rootElement) {
      const detail = error instanceof Error ? error.stack || error.message : String(error)
      rootElement.innerHTML = `
        <section style="padding: 24px; font-family: Consolas, 'Courier New', monospace; color: #5c2a04;">
          <h2 style="margin: 0 0 12px; font-family: Georgia, 'Times New Roman', serif;">Query Builder 渲染失败</h2>
          <p style="margin: 0 0 12px;">${info}</p>
          <pre style="white-space: pre-wrap; word-break: break-word;">${detail}</pre>
        </section>
      `
    }
    showMessage("Query Builder 渲染失败，已记录调试日志", 7000, "error")
  }
  app.mount(rootElement)
}

export function destroy() {
  if (dialog) {
    dialog.destroy()
  } else {
    destroyMount()
  }
  pluginInstance = null
}
