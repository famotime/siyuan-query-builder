export type WorkspaceOpenMode = "dialog" | "tab"

export interface QueryBuilderPluginSettings {
  openMode: WorkspaceOpenMode
}

export const PLUGIN_SETTINGS_STORAGE_KEY = "query-builder.settings.v1"

export const DEFAULT_PLUGIN_SETTINGS: QueryBuilderPluginSettings = {
  openMode: "dialog",
}

interface SettingsStorage {
  loadData(key: string): Promise<unknown>
  saveData(key: string, value: unknown): Promise<void>
}

export function normalizePluginSettings(value: unknown): QueryBuilderPluginSettings {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_PLUGIN_SETTINGS }
  }

  const openMode = (value as { openMode?: unknown }).openMode
  if (openMode !== "dialog" && openMode !== "tab") {
    return { ...DEFAULT_PLUGIN_SETTINGS }
  }

  return { openMode }
}

export async function loadPluginSettings(storage: SettingsStorage): Promise<QueryBuilderPluginSettings> {
  return normalizePluginSettings(await storage.loadData(PLUGIN_SETTINGS_STORAGE_KEY))
}

export async function savePluginSettings(
  storage: SettingsStorage,
  settings: QueryBuilderPluginSettings,
): Promise<QueryBuilderPluginSettings> {
  const normalized = normalizePluginSettings(settings)
  await storage.saveData(PLUGIN_SETTINGS_STORAGE_KEY, normalized)
  return normalized
}
