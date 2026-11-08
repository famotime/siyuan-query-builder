import type { App as VueApp } from "vue"
import type { WorkspaceOpenMode } from "@/core/plugin-settings"

import type { QueryBuilderSnapshot } from "@/core/query/types"
import type { Plugin } from "@/external/siyuan"
import { createApp } from "vue"
import QueryBuilderDock from "@/components/query-builder/QueryBuilderDock.vue"
import {
  getDashboardDefinition,
  SCENARIO_DASHBOARDS,
} from "@/core/dashboard/catalog"
import { loadPluginSettings } from "@/core/plugin-settings"
import {
  Dialog,
  openTab,
  showMessage,
} from "@/external/siyuan"
import {
  observeSiyuanTheme,
  syncSiyuanThemeMarkers,
} from "@/ui/theme"

import { workspaceNavigationKey } from "@/ui/workspace-navigation"
import App from "./App.vue"

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

export interface PendingWorkspaceTarget {
  dashboardId?: string
  snapshot?: any
  templateId?: string
}

let pendingWorkspaceTarget: PendingWorkspaceTarget | null = null

/**
 * main.ts 对工作台 store 的最小依赖面:打开路由只需要这几个方法。
 */
interface ActiveWorkspaceStoreRef {
  activeDashboardId?: string | null
  loadDashboard?: (id: string) => Promise<void> | void
  applySnapshot?: (snapshot: QueryBuilderSnapshot) => void | Promise<void>
  loadTemplate?: (templateId: string) => Promise<void> | void
  runActiveDashboard?: () => Promise<void> | void
}

let activeWorkspaceStore: ActiveWorkspaceStoreRef | null = null

export function setActiveWorkspaceStore(store: ActiveWorkspaceStoreRef | null) {
  activeWorkspaceStore = store
}

export function getActiveWorkspaceStore(): ActiveWorkspaceStoreRef | null {
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

/**
 * 工作台类宿主(workspace 页签 / 仪表板页签)共用的 addTab 生命周期回调。
 */
function createTabHostHandlers(hostKind: string, mountProps?: Record<string, unknown>) {
  return {
    init(this: { element: Element }) {
      if (!(this.element instanceof HTMLElement)) {
        throw new TypeError(`Failed to create ${hostKind} host`)
      }

      const rootElement = document.createElement("div")
      rootElement.className = "siyuan-query-builder-tab-root"
      rootElement.style.height = "100%"
      this.element.innerHTML = ""
      this.element.appendChild(rootElement)
      tabApps.set(this.element, mountWorkspaceInto(rootElement, mountProps))
      tabThemeUnsubs.set(this.element, observeSiyuanTheme(rootElement, onHostThemeChanged))
    },
    destroy(this: { element: Element }) {
      destroyTabMount(this.element)
    },
    beforeDestroy(this: { element: Element }) {
      destroyTabMount(this.element)
    },
  }
}

function registerWorkspaceTab() {
  if (!pluginInstance || workspaceTabRegistered) {
    return
  }

  pluginInstance.addTab({
    type: WORKSPACE_TAB_TYPE,
    ...createTabHostHandlers("query builder tab"),
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
    ...createTabHostHandlers("dashboard tab host", { initialDashboardId: dashboardId }),
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

/**
 * 打开路由的统一入口:写入 pendingTarget(供 App.vue 挂载时消费)
 * → 打开面板 → store 已就绪时直接应用目标。
 * dialog 模式下 store 往往已在挂载时消费 pendingTarget,这里的直调是幂等兜底。
 */
async function openWorkspaceToTarget(options: {
  pendingTarget: PendingWorkspaceTarget
  openMode?: WorkspaceOpenMode
  applyToStore: (store: ActiveWorkspaceStoreRef) => void | Promise<void>
}) {
  if (!pluginInstance) {
    return
  }
  const mode = options.openMode || (await loadPluginSettings(pluginInstance)).openMode
  pendingWorkspaceTarget = options.pendingTarget
  await openPanel(true, mode)
  if (activeWorkspaceStore) {
    await options.applyToStore(activeWorkspaceStore)
  }
}

export async function openWorkspaceWithDashboard(dashboardId?: string, openMode?: WorkspaceOpenMode) {
  if (!pluginInstance) {
    return
  }

  // 点击场景仪表板时，默认在独立的页签中打开
  if (dashboardId) {
    if (openMode === "dialog") {
      await openWorkspaceToTarget({
        pendingTarget: { dashboardId },
        openMode,
        applyToStore: (store) => store.loadDashboard?.(dashboardId),
      })
      return
    }
    await openDashboardTab(dashboardId)
    return
  }

  const mode = openMode || (await loadPluginSettings(pluginInstance)).openMode
  await openPanel(true, mode)
}

export async function openWorkspaceWithPreset(snapshot: any, openMode?: WorkspaceOpenMode) {
  await openWorkspaceToTarget({
    pendingTarget: { snapshot },
    openMode,
    applyToStore: (store) => {
      if (store.applySnapshot) {
        store.applySnapshot(snapshot)
      }
    },
  })
}

export async function openWorkspaceWithTemplate(templateId: string, openMode?: WorkspaceOpenMode) {
  await openWorkspaceToTarget({
    pendingTarget: { templateId },
    openMode,
    applyToStore: (store) => store.loadTemplate?.(templateId),
  })
}

export function mountDock(hostElement: HTMLElement) {
  syncSiyuanThemeMarkers(hostElement)
  dockThemeUnsubs.set(hostElement, observeSiyuanTheme(hostElement))
  const app = createApp(QueryBuilderDock)
  app.provide(workspaceNavigationKey, {
    openWorkspaceWithDashboard,
    openWorkspaceWithPreset,
    openWorkspaceWithTemplate,
    openDashboardTab,
  })
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
  pendingWorkspaceTarget = null
  pluginInstance = null
}
