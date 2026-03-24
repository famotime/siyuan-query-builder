import { describe, expect, it } from "vitest"

import {
  DEFAULT_PLUGIN_SETTINGS,
  PLUGIN_SETTINGS_STORAGE_KEY,
  loadPluginSettings,
  normalizePluginSettings,
  savePluginSettings,
} from "@/core/plugin-settings"

class FakePluginStorage {
  private storage = new Map<string, unknown>()

  async loadData(key: string) {
    return this.storage.get(key) ?? null
  }

  async saveData(key: string, value: unknown) {
    this.storage.set(key, value)
  }

  read(key: string) {
    return this.storage.get(key)
  }
}

describe("plugin settings", () => {
  it("defaults to dialog open mode when no settings are stored", async () => {
    const storage = new FakePluginStorage()

    const settings = await loadPluginSettings(storage)

    expect(settings).toEqual(DEFAULT_PLUGIN_SETTINGS)
  })

  it("normalizes invalid settings back to dialog open mode", () => {
    expect(normalizePluginSettings(null)).toEqual(DEFAULT_PLUGIN_SETTINGS)
    expect(normalizePluginSettings({ openMode: "sidebar" })).toEqual(DEFAULT_PLUGIN_SETTINGS)
  })

  it("persists the selected open mode", async () => {
    const storage = new FakePluginStorage()

    const settings = await savePluginSettings(storage, {
      openMode: "tab",
    })

    expect(settings).toEqual({ openMode: "tab" })
    expect(storage.read(PLUGIN_SETTINGS_STORAGE_KEY)).toEqual({ openMode: "tab" })
  })
})
