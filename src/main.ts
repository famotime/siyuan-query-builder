import type { App as VueApp } from "vue"
import { createApp } from "vue"

import App from "./App.vue"
import {
  Dialog,
  openTab,
  showMessage,
} from "@/external/siyuan"
import type { Plugin } from "@/external/siyuan"
import type { WorkspaceOpenMode } from "@/core/plugin-settings"

let pluginInstance: Plugin | null = null
let dialog: Dialog | null = null
let dialogApp: VueApp | null = null
let dialogRootElement: HTMLDivElement | null = null
let workspaceTabRegistered = false
const tabApps = new WeakMap<Element, VueApp>()

const WORKSPACE_TAB_TYPE = "workspace"
const WORKSPACE_TAB_TITLE = "易搭 Query Builder"
const WORKSPACE_TAB_ICON = "iconQueryBuilder"

export function usePlugin() {
  if (!pluginInstance) {
    throw new Error("Plugin instance has not been initialized")
  }
  return pluginInstance
}

export function init(plugin: Plugin) {
  pluginInstance = plugin
  registerWorkspaceTab()
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

function createVueApp(rootElement: HTMLDivElement) {
  const app = createApp(App)
  app.config.errorHandler = (error, instance, info) => {
    console.error("[siyuan-query-builder] vue runtime error", error, info, instance)
    appendDebugLog("vue-error-handler", error, info)
    const detail = error instanceof Error ? error.stack || error.message : String(error)
    rootElement.innerHTML = `
      <section style="padding: 24px; font-family: Consolas, 'Courier New', monospace; color: #5c2a04;">
        <h2 style="margin: 0 0 12px; font-family: Georgia, 'Times New Roman', serif;">Query Builder 渲染失败</h2>
        <p style="margin: 0 0 12px;">${info}</p>
        <pre style="white-space: pre-wrap; word-break: break-word;">${detail}</pre>
      </section>
    `
    showMessage("Query Builder 渲染失败，已记录调试日志", 7000, "error")
  }
  app.mount(rootElement)
  return app
}

function mountWorkspaceInto(rootElement: HTMLDivElement) {
  return createVueApp(rootElement)
}

function destroyDialogMount() {
  dialogApp?.unmount()
  dialogApp = null

  if (dialogRootElement) {
    dialogRootElement.innerHTML = ""
  }

  dialogRootElement = null
  dialog = null
}

function destroyTabMount(hostElement: Element) {
  const app = tabApps.get(hostElement)
  if (!app) {
    return
  }

  app.unmount()
  tabApps.delete(hostElement)
  if (hostElement instanceof HTMLElement) {
    hostElement.innerHTML = ""
  }
}

function getWorkspaceTabId() {
  if (!pluginInstance) {
    throw new Error("Plugin instance has not been initialized")
  }
  return `${pluginInstance.name}${WORKSPACE_TAB_TYPE}`
}

function registerWorkspaceTab() {
  if (!pluginInstance || workspaceTabRegistered) {
    return
  }

  pluginInstance.addTab({
    type: WORKSPACE_TAB_TYPE,
    init(this: { element: Element }) {
      if (!(this.element instanceof HTMLElement)) {
        throw new Error("Failed to create query builder tab host")
      }

      const rootElement = document.createElement("div")
      rootElement.className = "siyuan-query-builder-tab-root"
      rootElement.style.height = "100%"
      this.element.innerHTML = ""
      this.element.appendChild(rootElement)
      tabApps.set(this.element, mountWorkspaceInto(rootElement))
    },
    destroy(this: { element: Element }) {
      destroyTabMount(this.element)
    },
    beforeDestroy(this: { element: Element }) {
      destroyTabMount(this.element)
    },
  })

  workspaceTabRegistered = true
}

function openDialogPanel(forceVisible = false) {
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
    title: WORKSPACE_TAB_TITLE,
    width: "min(1480px, 92vw)",
    height: "min(900px, 88vh)",
    content: '<div id="siyuan-query-builder-root" style="height: 100%;"></div>',
    destroyCallback: () => {
      destroyDialogMount()
    },
  })

  dialogRootElement = dialog.element.querySelector("#siyuan-query-builder-root") as HTMLDivElement | null
  if (!dialogRootElement) {
    dialog.destroy()
    throw new Error("Failed to create query builder dialog host")
  }

  dialogApp = mountWorkspaceInto(dialogRootElement)
}

async function openWorkspaceTabPanel() {
  if (!pluginInstance) {
    throw new Error("Plugin instance has not been initialized")
  }

  if (dialog) {
    dialog.destroy()
  }

  await openTab({
    app: pluginInstance.app,
    custom: {
      id: getWorkspaceTabId(),
      icon: WORKSPACE_TAB_ICON,
      title: WORKSPACE_TAB_TITLE,
    },
  })
}

export async function openPanel(forceVisible = false, openMode: WorkspaceOpenMode = "dialog") {
  if (openMode === "tab") {
    await openWorkspaceTabPanel()
    return
  }

  openDialogPanel(forceVisible)
}

export function destroy() {
  if (dialog) {
    dialog.destroy()
  } else {
    destroyDialogMount()
  }
  workspaceTabRegistered = false
  pluginInstance = null
}
