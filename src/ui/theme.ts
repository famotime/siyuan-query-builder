export type SiyuanThemeMode = "light" | "dark"

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
  const themeHost = element?.closest(".b3-theme-light, .b3-theme-dark")
    || ownerDocument.body?.closest(".b3-theme-light, .b3-theme-dark")
    || ownerDocument.documentElement?.closest(".b3-theme-light, .b3-theme-dark")

  const classTheme = themeFromClassList(themeHost?.classList)
    || themeFromClassList(ownerDocument.body?.classList)
    || themeFromClassList(ownerDocument.documentElement?.classList)

  if (classTheme) {
    return classTheme
  }

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

  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return "light"
  }

  return null
}

export function syncSiyuanThemeMarkers(element: HTMLElement) {
  element.classList.remove("b3-theme-light", "b3-theme-dark")
  delete element.dataset.sqbTheme

  const theme = resolveSiyuanThemeMode(element)
  if (!theme) {
    return null
  }

  element.classList.add(`b3-theme-${theme}`)
  element.dataset.sqbTheme = theme
  return theme
}
