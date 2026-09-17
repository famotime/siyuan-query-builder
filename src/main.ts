import type { App as VueApp } from "vue"
import { createApp } from "vue"

import App from "./App.vue"
import QueryBuilderDock from "@/components/query-builder/QueryBuilderDock.vue"
import {
  Dialog,
  openTab,
  showMessage,
} from "@/external/siyuan"
import type { Plugin } from "@/external/siyuan"
import { loadPluginSettings, type WorkspaceOpenMode } from "@/core/plugin-settings"
import { SCENARIO_DASHBOARDS, getDashboardDefinition } from "@/core/dashboard/catalog"

import { observeSiyuanTheme, syncSiyuanThemeMarkers } from "@/ui/theme"

let pluginInstance: Plugin | null = null
let dialog: Dialog | null = null
let dialogApp: VueApp | null = null
let dialogRootElement: HTMLDivElement | null = null
let dialogThemeUnsub: (() => void) | null = null
let workspaceTabRegistered = false
const tabApps = new WeakMap<Element, VueApp>()
const tabThemeUnsubs = new WeakMap<Element, () => void>()
const dockApps = new WeakMap<Element, VueApp>()
const dockThemeUnsubs = new WeakMap<Element, () => void>()

let pendingWorkspaceTarget: {
  dashboardId?: string
  snapshot?: any
  templateId?: string
} | null = null

let activeWorkspaceStore: any = null

export function setActiveWorkspaceStore(store: any) {
  activeWorkspaceStore = store
}

export function getActiveWorkspaceStore() {
  return activeWorkspaceStore
}

function onHostThemeChanged() {
  if (activeWorkspaceStore?.activeDashboardId) {
    void activeWorkspaceStore.runActiveDashboard()
  }
}

export function getPendingWorkspaceTarget() {
  const target = pendingWorkspaceTarget
  pendingWorkspaceTarget = null
  return target
}

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
  for (const d of SCENARIO_DASHBOARDS) {
    registerDashboardTab(d.id)
  }
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

function createVueApp(rootElement: HTMLDivElement, props?: Record<string, unknown>) {
  const app = createApp(App, props)

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

function mountWorkspaceInto(rootElement: HTMLDivElement, props?: Record<string, unknown>) {
  syncSiyuanThemeMarkers(rootElement)
  return createVueApp(rootElement, props)
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
      tabThemeUnsubs.set(this.element, observeSiyuanTheme(rootElement, onHostThemeChanged))
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
  dialogThemeUnsub = observeSiyuanTheme(dialogRootElement, onHostThemeChanged)
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

const registeredDashboardTabTypes = new Set<string>()

export function registerDashboardTab(dashboardId: string) {
  if (!pluginInstance) {
    return
  }
  const tabType = `dashboard-${dashboardId}`
  if (registeredDashboardTabTypes.has(tabType)) {
    return
  }

  pluginInstance.addTab({
    type: tabType,
    init(this: { element: Element }) {
      if (!(this.element instanceof HTMLElement)) {
        throw new Error("Failed to create dashboard tab host")
      }

      const rootElement = document.createElement("div")
      rootElement.className = "siyuan-query-builder-tab-root"
      rootElement.style.height = "100%"
      this.element.innerHTML = ""
      this.element.appendChild(rootElement)
      tabApps.set(this.element, mountWorkspaceInto(rootElement, { initialDashboardId: dashboardId }))
      tabThemeUnsubs.set(this.element, observeSiyuanTheme(rootElement, onHostThemeChanged))
    },
    destroy(this: { element: Element }) {
      destroyTabMount(this.element)
    },
    beforeDestroy(this: { element: Element }) {
      destroyTabMount(this.element)
    },
  })

  registeredDashboardTabTypes.add(tabType)
}

export async function openDashboardTab(dashboardId: string) {
  if (!pluginInstance) {
    throw new Error("Plugin instance has not been initialized")
  }
  registerDashboardTab(dashboardId)
  const def = getDashboardDefinition(dashboardId)
  const title = def ? `易搭 - ${def.title}` : WORKSPACE_TAB_TITLE
  const tabType = `dashboard-${dashboardId}`

  if (dialog) {
    dialog.destroy()
  }

  await openTab({
    app: pluginInstance.app,
    custom: {
      id: `${pluginInstance.name}${tabType}`,
      icon: WORKSPACE_TAB_ICON,
      title,
    },
    openNewTab: true,
  })
}

export async function openWorkspaceWithDashboard(dashboardId?: string, openMode?: WorkspaceOpenMode) {
  if (!pluginInstance) {
    return
  }

  // 点击场景仪表板时，默认在独立的页签中打开
  if (dashboardId) {
    if (openMode === "dialog") {
      pendingWorkspaceTarget = { dashboardId }
      await openPanel(true, "dialog")
      if (activeWorkspaceStore?.loadDashboard) {
        await activeWorkspaceStore.loadDashboard(dashboardId)
      }
      return
    }
    await openDashboardTab(dashboardId)
    return
  }

  const mode = openMode || (await loadPluginSettings(pluginInstance)).openMode
  await openPanel(true, mode)
}

export async function openWorkspaceWithPreset(snapshot: any, openMode?: WorkspaceOpenMode) {
  if (!pluginInstance) {
    return
  }
  const mode = openMode || (await loadPluginSettings(pluginInstance)).openMode
  pendingWorkspaceTarget = { snapshot }
  await openPanel(true, mode)
  if (activeWorkspaceStore?.applySnapshot) {
    activeWorkspaceStore.applySnapshot(snapshot)
  }
}

export async function openWorkspaceWithTemplate(templateId: string, openMode?: WorkspaceOpenMode) {
  if (!pluginInstance) {
    return
  }
  const mode = openMode || (await loadPluginSettings(pluginInstance)).openMode
  pendingWorkspaceTarget = { templateId }
  await openPanel(true, mode)
  if (activeWorkspaceStore?.loadTemplate) {
    await activeWorkspaceStore.loadTemplate(templateId)
  }
}

export function mountDock(hostElement: HTMLElement) {
  syncSiyuanThemeMarkers(hostElement)
  dockThemeUnsubs.set(hostElement, observeSiyuanTheme(hostElement))
  const app = createApp(QueryBuilderDock)
  app.mount(hostElement)
  dockApps.set(hostElement, app)
  return app
}

export function unmountDock(hostElement: HTMLElement) {
  const unsub = dockThemeUnsubs.get(hostElement)
  if (unsub) {
    unsub()
    dockThemeUnsubs.delete(hostElement)
  }
  const app = dockApps.get(hostElement)
  if (app) {
    app.unmount()
    dockApps.delete(hostElement)
  }
  hostElement.innerHTML = ""
}

export function destroy() {
  if (dialog) {
    dialog.destroy()
  } else {
    destroyDialogMount()
  }
  workspaceTabRegistered = false
  registeredDashboardTabTypes.clear()
  pluginInstance = null
}
