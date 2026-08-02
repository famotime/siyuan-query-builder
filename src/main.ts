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

import { observeSiyuanTheme, syncSiyuanThemeMarkers } from "@/ui/theme"

let pluginInstance: Plugin | null = null
let dialog: Dialog | null = null
let dialogApp: VueApp | null = null
let dialogRootElement: HTMLDivElement | null = null
let dialogThemeUnsub: (() => void) | null = null
let workspaceTabRegistered = false
const tabApps = new WeakMap<Element, VueApp>()
const tabThemeUnsubs = new WeakMap<Element, () => void>()

const WORKSPACE_TAB_TYPE = "workspace"
const WORKSPACE_TAB_TITLE = "易搭 Query Builder"
const WORKSPACE_TAB_ICON = "iconQueryBuilder"

export const DEBUG_LOG_STORAGE_KEY = "query-builder.debug-runtime-errors.v1"

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

  const existing = await pluginInstance.loadData(DEBUG_LOG_STORAGE_KEY)
  const list = Array.isArray(existing) ? existing : []
  list.unshift({
    timestamp: new Date().toISOString(),
    source,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    info,
  })
  await pluginInstance.saveData(DEBUG_LOG_STORAGE_KEY, list.slice(0, 30))
}

function createVueApp(rootElement: HTMLDivElement) {
  const app = createApp(App)

  app.config.errorHandler = (err, _instance, info) => {
    console.error("[siyuan-query-builder] Vue render error", err, info)
    void appendDebugLog("vue_render_error", err, info)
    const message = pluginInstance?.i18n?.vueRenderError
      ? String(pluginInstance.i18n.vueRenderError)
      : "Query Builder 渲染失败，已记录调试日志"
    showMessage(message, 7000, "error")
  }
  app.mount(rootElement)
  return app
}

function mountWorkspaceInto(rootElement: HTMLDivElement) {
  syncSiyuanThemeMarkers(rootElement)
  return createVueApp(rootElement)
}

function destroyDialogMount() {
  dialogThemeUnsub?.()
  dialogThemeUnsub = null
  dialogApp?.unmount()
  dialogApp = null

  if (dialogRootElement) {
    dialogRootElement.innerHTML = ""
  }

  dialogRootElement = null
  dialog = null
}

function destroyTabMount(hostElement: Element) {
  const unsub = tabThemeUnsubs.get(hostElement)
  if (unsub) {
    unsub()
    tabThemeUnsubs.delete(hostElement)
  }

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
      tabThemeUnsubs.set(this.element, observeSiyuanTheme(rootElement))
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
  dialogThemeUnsub = observeSiyuanTheme(dialogRootElement)
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
