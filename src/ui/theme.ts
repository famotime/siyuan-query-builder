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
  const ownerDocument = element?.ownerDocument || document

  // 1. Check element or ancestor elements
  const themeHost = element?.closest(".b3-theme-light, .b3-theme-dark")
    || ownerDocument.body?.closest(".b3-theme-light, .b3-theme-dark")
    || ownerDocument.documentElement?.closest(".b3-theme-light, .b3-theme-dark")
    || ownerDocument.querySelector(".b3-theme-light, .b3-theme-dark")

  const classTheme = themeFromClassList(themeHost?.classList)
    || themeFromClassList(ownerDocument.body?.classList)
    || themeFromClassList(ownerDocument.documentElement?.classList)

  if (classTheme) {
    return classTheme
  }

  // 2. Check HTML / Body data attributes
  const themeAttr = ownerDocument.documentElement.getAttribute("data-theme-mode")
    || ownerDocument.body.getAttribute("data-theme-mode")
    || ownerDocument.documentElement.getAttribute("data-theme")
    || ownerDocument.body.getAttribute("data-theme")

  if (themeAttr === "light") return "light"
  if (themeAttr === "dark") return "dark"

  // 3. Check SiYuan window config
  const appearanceMode = (window as Window & {
    siyuan?: {
      config?: {
        appearance?: {
          mode?: unknown
        }
      }
    }
  }).siyuan?.config?.appearance?.mode

  if (appearanceMode === 0) {
    return "light"
  }
  if (appearanceMode === 1) {
    return "dark"
  }

  // 4. System media query fallback
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return "light"
  }

  return "light"
}

export function syncSiyuanThemeMarkers(element: HTMLElement) {
  if (isSyncing) {
    return (element.dataset.sqbTheme as SiyuanThemeMode) || null
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

  const observer = new MutationObserver(() => {
    if (isSyncing) return
    const newTheme = resolveSiyuanThemeMode(element) || "light"
    if (newTheme !== currentTheme) {
      currentTheme = syncSiyuanThemeMarkers(element)
      if (onChange && currentTheme) {
        onChange(currentTheme)
      }
    }
  })

  // Observe ONLY html and body attributes without subtree to avoid observing element's own mutations
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

  return () => {
    observer.disconnect()
  }
}
