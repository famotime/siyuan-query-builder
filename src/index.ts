import { Plugin, getFrontend } from "siyuan"
import { showMessage } from "siyuan"

import pluginInfoJson from "@/../plugin.json"
import "@/index.scss"
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
          this.showWorkspace()
        },
      })

      this.addCommand({
        langKey: "addTopBarIcon",
        hotkey: "⌘⇧Q",
        callback: () => {
          this.showWorkspace(true)
        },
      })
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
    this.showWorkspace(true)
  }

  private showWorkspace(forceVisible = false) {
    try {
      openPanel(forceVisible)
    } catch (error) {
      console.error("[siyuan-query-builder] showWorkspace failed", error)
      showMessage(`Query Builder 打开失败：${toErrorMessage(error)}`, 7000, "error")
    }
  }
}
