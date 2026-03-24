import { Setting } from "siyuan"
import { describe, expect, it, vi } from "vitest"

const {
  init,
  openPanel,
  destroy,
} = vi.hoisted(() => ({
  init: vi.fn(),
  openPanel: vi.fn(async () => {}),
  destroy: vi.fn(),
}))

const renderer = vi.hoisted(() => ({
  start: vi.fn(),
  destroy: vi.fn(),
}))

vi.mock("@/main", () => ({
  init,
  openPanel,
  destroy,
}))

vi.mock("@/inline/service", () => ({
  createInlineBlockRenderer: vi.fn(() => renderer),
}))

import PluginClass from "@/index"
import { PLUGIN_SETTINGS_STORAGE_KEY } from "@/core/plugin-settings"

describe("plugin settings entry", () => {
  it("opens a settings page instead of the workspace and persists open mode changes", async () => {
    const plugin = new PluginClass({
      app: { appId: "app-1" },
      name: "siyuan-query-builder",
      i18n: {
        addTopBarIcon: "打开查询构建器",
      },
    } as any)

    await plugin.saveData(PLUGIN_SETTINGS_STORAGE_KEY, {
      openMode: "tab",
    })

    await plugin.onload()
    plugin.openSetting()

    expect(openPanel).not.toHaveBeenCalled()
    expect(plugin.setting).toBeInstanceOf(Setting)
    expect(plugin.setting.openedName).toBe("siyuan-query-builder")
    expect(plugin.setting.items).toHaveLength(1)
    expect(plugin.setting.items[0]?.title).toBe("打开方式")

    const select = plugin.setting.items[0]?.actionElement as HTMLSelectElement
    expect(select.value).toBe("tab")

    select.value = "dialog"
    select.dispatchEvent(new Event("change"))
    await Promise.resolve()

    expect(await plugin.loadData(PLUGIN_SETTINGS_STORAGE_KEY)).toEqual({
      openMode: "dialog",
    })
  })

  it("uses the stored open mode when launching the workspace from the top bar", async () => {
    const plugin = new PluginClass({
      app: { appId: "app-1" },
      name: "siyuan-query-builder",
      i18n: {
        addTopBarIcon: "打开查询构建器",
      },
    } as any)

    await plugin.saveData(PLUGIN_SETTINGS_STORAGE_KEY, {
      openMode: "tab",
    })

    await plugin.onload()
    plugin.topBarItems[0]?.callback(new MouseEvent("click"))
    await Promise.resolve()
    await Promise.resolve()

    expect(openPanel).toHaveBeenCalledWith(false, "tab")
  })
})
