import { ref, type Ref } from "vue"

export type SiyuanThemeMode = "light" | "dark"

let isSyncing = false

function themeFromClassList(classList: DOMTokenList | undefined): SiyuanThemeMode | null {
  if (!classList) {
    return null
  }
  if (classList.contains("b3-theme-light")) {
    return "light"
  }
  if (classList.contains("b3-theme-dark")) {
    return "dark"
  }
  return null
}

export function resolveSiyuanThemeMode(element?: HTMLElement | null): SiyuanThemeMode | null {
  const ownerDocument = element?.ownerDocument || (typeof document !== "undefined" ? document : null)
  if (!ownerDocument) {
    return "light"
  }

  // 1. 优先检查父级/祖先宿主节点（严格排除 element 自身，防止旧 marker 类名造成死锁无法切回）
  const ancestorHost = element?.parentElement?.closest(".b3-theme-light, .b3-theme-dark")
    || ownerDocument.body?.closest(".b3-theme-light, .b3-theme-dark")
    || ownerDocument.documentElement?.closest(".b3-theme-light, .b3-theme-dark")

  const classTheme = themeFromClassList(ancestorHost?.classList)
    || themeFromClassList(ownerDocument.body?.classList)
    || themeFromClassList(ownerDocument.documentElement?.classList)

  if (classTheme) {
    return classTheme
  }

  // 2. 检查 HTML / Body 上的 data-theme-mode 或 data-theme 属性
  const themeAttr = ownerDocument.documentElement?.getAttribute("data-theme-mode")
    || ownerDocument.body?.getAttribute("data-theme-mode")
    || ownerDocument.documentElement?.getAttribute("data-theme")
    || ownerDocument.body?.getAttribute("data-theme")

  if (themeAttr === "light") return "light"
  if (themeAttr === "dark") return "dark"

  // 3. 检查思源客户端全局配置 window.siyuan.config.appearance.mode (0: light, 1: dark)
  const appearanceMode = typeof window !== "undefined"
    ? (window as Window & {
        siyuan?: {
          config?: {
            appearance?: {
              mode?: unknown
            }
          }
        }
      }).siyuan?.config?.appearance?.mode
    : undefined

  if (appearanceMode === 0) {
    return "light"
  }
  if (appearanceMode === 1) {
    return "dark"
  }

  // 4. 检查思源笔记 head 中注入的主题样式表链接
  const themeLink = ownerDocument.getElementById("themeDefaultStyle")
    || ownerDocument.getElementById("themeStyle")
    || ownerDocument.querySelector('link[href*="/theme/"]')
  if (themeLink) {
    const href = themeLink.getAttribute("href") || ""
    if (href.includes("light")) return "light"
    if (href.includes("dark")) return "dark"
  }

  // 5. 兜底匹配系统色彩偏好
  if (typeof window !== "undefined" && window.matchMedia) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark"
    }
    if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light"
    }
  }

  return "light"
}

// 全局响应式主题状态与订阅总线
const currentSiyuanTheme = ref<SiyuanThemeMode>(
  (typeof document !== "undefined" && resolveSiyuanThemeMode()) || "light",
)

const themeListeners = new Set<(theme: SiyuanThemeMode) => void>()

export function notifyThemeListeners(theme: SiyuanThemeMode) {
  currentSiyuanTheme.value = theme
  for (const listener of themeListeners) {
    try {
      listener(theme)
    } catch (e) {
      console.error("[SQB] theme listener error", e)
    }
  }
}

export function useSiyuanTheme(): { currentTheme: Ref<SiyuanThemeMode> } {
  return { currentTheme: currentSiyuanTheme }
}

export function onSiyuanThemeChange(listener: (theme: SiyuanThemeMode) => void): () => void {
  themeListeners.add(listener)
  return () => {
    themeListeners.delete(listener)
  }
}

export function syncSiyuanThemeMarkers(element: HTMLElement): SiyuanThemeMode {
  if (isSyncing) {
    return (element.dataset.sqbTheme as SiyuanThemeMode) || "light"
  }

  isSyncing = true
  try {
    const theme = resolveSiyuanThemeMode(element) || "light"
    if (element.dataset.sqbTheme === theme && element.classList.contains(`b3-theme-${theme}`)) {
      return theme
    }

    element.classList.remove("b3-theme-light", "b3-theme-dark")
    element.classList.add(`b3-theme-${theme}`)
    element.dataset.sqbTheme = theme
    return theme
  } finally {
    isSyncing = false
  }
}

export function observeSiyuanTheme(element: HTMLElement, onChange?: (theme: SiyuanThemeMode) => void) {
  let currentTheme = syncSiyuanThemeMarkers(element)

  const ownerDocument = element.ownerDocument || document
  const targetHost = ownerDocument.documentElement

  const checkTheme = () => {
    if (isSyncing) return
    const newTheme = resolveSiyuanThemeMode(element) || "light"
    if (newTheme !== currentTheme) {
      currentTheme = syncSiyuanThemeMarkers(element)
      notifyThemeListeners(currentTheme)
      if (onChange && currentTheme) {
        onChange(currentTheme)
      }
    }
  }

  const observer = new MutationObserver(() => {
    checkTheme()
  })

  // 监听 html 与 body 上的属性（类名、主题属性等）
  observer.observe(targetHost, {
    attributes: true,
    attributeFilter: ["class", "data-theme-mode", "data-theme"],
    subtree: false,
  })

  if (ownerDocument.body) {
    observer.observe(ownerDocument.body, {
      attributes: true,
      attributeFilter: ["class", "data-theme-mode", "data-theme"],
      subtree: false,
    })
  }

  if (ownerDocument.head) {
    observer.observe(ownerDocument.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href"],
    })
  }

  let mediaMatcher: MediaQueryList | null = null
  const mediaHandler = () => checkTheme()
  if (typeof window !== "undefined" && window.matchMedia) {
    mediaMatcher = window.matchMedia("(prefers-color-scheme: dark)")
    mediaMatcher.addEventListener?.("change", mediaHandler)
  }

  return () => {
    observer.disconnect()
    mediaMatcher?.removeEventListener?.("change", mediaHandler)
  }
}
