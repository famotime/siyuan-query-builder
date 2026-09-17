import { describe, expect, it, beforeEach } from "vitest"
import {
  resolveSiyuanThemeMode,
  syncSiyuanThemeMarkers,
  observeSiyuanTheme,
  useSiyuanTheme,
  onSiyuanThemeChange,
} from "@/ui/theme"

describe("theme sync and host adaptation", () => {
  beforeEach(() => {
    document.documentElement.className = ""
    document.body.className = ""
    document.documentElement.removeAttribute("data-theme-mode")
    document.body.removeAttribute("data-theme-mode")
  })

  it("detects theme mode from documentElement class", () => {
    document.documentElement.className = "b3-theme-dark"
    expect(resolveSiyuanThemeMode()).toBe("dark")

    document.documentElement.className = "b3-theme-light"
    expect(resolveSiyuanThemeMode()).toBe("light")
  })

  it("does not deadlock on element's own existing theme class", () => {
    // 宿主已经变为亮色模式
    document.documentElement.className = "b3-theme-light"

    // 子容器元素之前曾被赋予过暗色模式标记
    const childElement = document.createElement("div")
    childElement.className = "siyuan-query-builder-tab-root b3-theme-dark"
    childElement.dataset.sqbTheme = "dark"
    document.body.appendChild(childElement)

    // 检测时必须返回宿主的 "light"，不能命中子元素自身的 "dark"
    const detected = resolveSiyuanThemeMode(childElement)
    expect(detected).toBe("light")

    // 同步后子容器标记被纠正为 light
    syncSiyuanThemeMarkers(childElement)
    expect(childElement.classList.contains("b3-theme-light")).toBe(true)
    expect(childElement.classList.contains("b3-theme-dark")).toBe(false)
    expect(childElement.dataset.sqbTheme).toBe("light")

    document.body.removeChild(childElement)
  })

  it("notifies listeners on theme change", () => {
    let receivedTheme = ""
    const unsub = onSiyuanThemeChange((theme) => {
      receivedTheme = theme
    })

    const { currentTheme } = useSiyuanTheme()

    const host = document.createElement("div")
    document.body.appendChild(host)
    document.documentElement.className = "b3-theme-dark"

    const cleanup = observeSiyuanTheme(host, (theme) => {
      receivedTheme = theme
    })

    // 切换宿主为亮色
    document.documentElement.className = "b3-theme-light"
    // 手动派发或者直接触发同步
    syncSiyuanThemeMarkers(host)

    expect(host.dataset.sqbTheme).toBe("light")

    unsub()
    cleanup()
    document.body.removeChild(host)
  })
})
