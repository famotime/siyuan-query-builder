import {
  Plugin,
  Setting,
  getFrontend,
  showMessage,
} from "siyuan"

import pluginInfoJson from "@/../plugin.json"
import "@/index.scss"
import {
  DEFAULT_PLUGIN_SETTINGS,
  loadPluginSettings,
  savePluginSettings,
  type WorkspaceOpenMode,
} from "@/core/plugin-settings"
import { createInlineBlockRenderer } from "@/inline/service"
import { destroy, init, openPanel } from "@/main"

const pluginInfo = pluginInfoJson as { version?: string }
let inlineRenderer: ReturnType<typeof createInlineBlockRenderer> | null = null

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error"
}

export default class SiyuanQueryBuilderPlugin extends Plugin {
  public isMobile = false
  public isBrowser = false
  public isLocal = false
  public isElectron = false
  public isInWindow = false
  public platform: SyFrontendTypes
  public readonly version = pluginInfo.version || "0.0.1"
  private settingsState = { ...DEFAULT_PLUGIN_SETTINGS }
  private openModeSelect: HTMLSelectElement | null = null

  async onload() {
    try {
      const frontend = getFrontend()
      this.platform = frontend as SyFrontendTypes
      this.isMobile = frontend === "mobile" || frontend === "browser-mobile"
      this.isBrowser = frontend.includes("browser")
      this.isLocal = location.href.includes("127.0.0.1") || location.href.includes("localhost")
      this.isInWindow = location.href.includes("window.html")

      try {
        require("@electron/remote").require("@electron/remote/main")
        this.isElectron = true
      } catch {
        this.isElectron = false
      }

      init(this)
      inlineRenderer = createInlineBlockRenderer(this)
      inlineRenderer.start()

      this.addTopBar({
        icon: "iconSearch",
        title: "Siyuan Query Builder",
        callback: () => {
          void this.showWorkspace()
        },
      })

      this.addCommand({
        langKey: "addTopBarIcon",
        hotkey: "⌘⇧Q",
        callback: () => {
          void this.showWorkspace(true)
        },
      })

      this.settingsState = await loadPluginSettings(this)
    } catch (error) {
      console.error("[siyuan-query-builder] onload failed", error)
      showMessage(`Query Builder 启动失败：${toErrorMessage(error)}`, 7000, "error")
    }
  }

  onunload() {
    inlineRenderer?.destroy()
    inlineRenderer = null
    destroy()
  }

  openSetting() {
    this.ensureSettingPage()
    this.syncSettingControls()
    this.setting.open(this.name)
  }

  private ensureSettingPage() {
    if (this.setting) {
      return
    }

    this.openModeSelect = document.createElement("select")
    this.openModeSelect.className = "b3-select"
    this.openModeSelect.innerHTML = [
      '<option value="dialog">弹窗</option>',
      '<option value="tab">页签</option>',
    ].join("")
    this.openModeSelect.addEventListener("change", () => {
      void this.updateOpenMode(this.openModeSelect?.value as WorkspaceOpenMode)
    })

    this.setting = new Setting({
      width: "520px",
    })
    this.setting.addItem({
      title: "打开方式",
      description: "选择点击查询构建器时使用弹窗，还是在当前笔记窗口新增一个页签打开。",
      actionElement: this.openModeSelect,
    })
  }

  private syncSettingControls() {
    if (this.openModeSelect) {
      this.openModeSelect.value = this.settingsState.openMode
    }
  }

  private async updateOpenMode(openMode: WorkspaceOpenMode) {
    this.settingsState = await savePluginSettings(this, { openMode })
    this.syncSettingControls()
  }

  private async showWorkspace(forceVisible = false) {
    try {
      this.settingsState = await loadPluginSettings(this)
      await openPanel(forceVisible, this.settingsState.openMode)
    } catch (error) {
      console.error("[siyuan-query-builder] showWorkspace failed", error)
      showMessage(`Query Builder 打开失败：${toErrorMessage(error)}`, 7000, "error")
    }
  }
}
