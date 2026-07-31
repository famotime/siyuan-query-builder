type I18nParams = string | Record<string, string | number>

export type I18nHelper = (key: string, params?: I18nParams) => string

export function createI18nHelper(plugin: { i18n?: Record<string, string> } | null | undefined): I18nHelper {
  const dict = plugin?.i18n || {}
  return (key, params) => {
    let text = typeof dict[key] === "string" ? dict[key] as string : key
    if (params) {
      const values = typeof params === "string" ? { error: params } : params
      for (const [name, value] of Object.entries(values)) {
        text = text.split(`{${name}}`).join(String(value))
      }
    }
    return text
  }
}
