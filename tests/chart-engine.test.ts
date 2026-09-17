import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import { getEChartsInstance } from "@/core/view/chart"
import ResultsChartView from "@/components/query-builder/ResultsChartView.vue"

describe("ECharts engine loader and ResultsChartView", () => {
  const originalECharts = (window as any).echarts

  beforeEach(() => {
    delete (window as any).echarts
    document.querySelectorAll("script#protyleEchartsScript").forEach(el => el.remove())
  })

  afterEach(() => {
    if (originalECharts) {
      ;(window as any).echarts = originalECharts
    } else {
      delete (window as any).echarts
    }
    document.querySelectorAll("script#protyleEchartsScript").forEach(el => el.remove())
    vi.restoreAllMocks()
  })

  it("returns window.echarts immediately when already present", async () => {
    const fakeECharts = { version: "5.3.2", init: vi.fn() }
    ;(window as any).echarts = fakeECharts

    const instance = await getEChartsInstance()
    expect(instance).toBe(fakeECharts)
    expect(document.getElementById("protyleEchartsScript")).toBeNull()
  })

  it("dynamically injects script and resolves when script loads and mounts window.echarts", async () => {
    const fakeECharts = { version: "5.3.2", init: vi.fn() }

    const promise = getEChartsInstance(true)

    // 观察到 script 标签被注入到 head
    const scriptEl = document.getElementById("protyleEchartsScript") as HTMLScriptElement
    expect(scriptEl).not.toBeNull()
    expect(scriptEl.src).toContain("stage/protyle/js/echarts/echarts.min.js")

    // 模拟 script onload 并挂载全局 window.echarts
    ;(window as any).echarts = fakeECharts
    scriptEl.dispatchEvent(new Event("load"))

    const instance = await promise
    expect(instance).toBe(fakeECharts)
  })

  it("reuses same loading promise on concurrent calls without creating duplicate scripts", async () => {
    const fakeECharts = { version: "5.3.2", init: vi.fn() }

    const p1 = getEChartsInstance()
    const p2 = getEChartsInstance()
    const p3 = getEChartsInstance()

    const scripts = document.querySelectorAll("script#protyleEchartsScript")
    expect(scripts.length).toBe(1)

    ;(window as any).echarts = fakeECharts
    ;(scripts[0] as HTMLScriptElement).dispatchEvent(new Event("load"))

    const [res1, res2, res3] = await Promise.all([p1, p2, p3])
    expect(res1).toBe(fakeECharts)
    expect(res2).toBe(fakeECharts)
    expect(res3).toBe(fakeECharts)
  })

  it("returns null when all candidate scripts fail and allows subsequent retry", async () => {
    // 拦截 createElement 模拟全部 onerror 快速失败
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName)
      if (tagName.toLowerCase() === "script") {
        setTimeout(() => {
          el.dispatchEvent(new Event("error"))
        }, 0)
      }
      return el
    })

    const instance1 = await getEChartsInstance(true)
    expect(instance1).toBeNull()

    // 再次调用时，由于之前失败重置了 promise，允许再次发起尝试
    const fakeECharts = { version: "5.3.2", init: vi.fn() }
    vi.restoreAllMocks()

    const promise2 = getEChartsInstance()
    const script = document.getElementById("protyleEchartsScript") as HTMLScriptElement
    expect(script).not.toBeNull()

    ;(window as any).echarts = fakeECharts
    script.dispatchEvent(new Event("load"))

    const instance2 = await promise2
    expect(instance2).toBe(fakeECharts)
  })

  it("renders chart in ResultsChartView when echarts engine is ready", async () => {
    const mockInit = vi.fn().mockReturnValue({
      setOption: vi.fn(),
      on: vi.fn(),
      dispose: vi.fn(),
      resize: vi.fn(),
    })
    ;(window as any).echarts = { init: mockInit }

    const wrapper = mount(ResultsChartView, {
      props: {
        option: { title: { text: "2026 年写作热力图" } },
      },
    })

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))
    await nextTick()

    expect(wrapper.find(".chart-view__container").exists()).toBe(true)
    expect(wrapper.find(".chart-view__fallback").exists()).toBe(false)
    expect(mockInit).toHaveBeenCalled()
  })

  it("shows fallback with retry button in ResultsChartView when echarts cannot be loaded", async () => {
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName)
      if (tagName.toLowerCase() === "script") {
        setTimeout(() => {
          el.dispatchEvent(new Event("error"))
        }, 0)
      }
      return el
    })

    const wrapper = mount(ResultsChartView, {
      props: {
        option: { title: { text: "2026 年逐日写作贡献墙" } },
      },
    })

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 80))
    await nextTick()

    expect(wrapper.find(".chart-view__fallback").exists()).toBe(true)
    expect(wrapper.find(".chart-view__fallback-title").text()).toBe("2026 年逐日写作贡献墙")
    expect(wrapper.find(".chart-view__retry-btn").exists()).toBe(true)
  })
})
