import { mount } from "@vue/test-utils"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { defineComponent, nextTick } from "vue"
import { hideTooltip, showTooltip, vSqbTooltip } from "@/ui/tooltip"

describe("vSqbTooltip directive and tooltip manager", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = ""
  })

  afterEach(() => {
    hideTooltip()
    vi.useRealTimers()
    document.body.innerHTML = ""
  })

  it("removes native title attribute on showTooltip to prevent native tooltip duplicate collision", () => {
    const btn = document.createElement("button")
    btn.setAttribute("title", "测试提示")
    btn.textContent = "Button"
    document.body.appendChild(btn)

    showTooltip(btn, "测试提示")

    // 原生 title 必须被移除或暂存，以防系统原生黄色/黑灰色方块在延迟后重复弹出
    expect(btn.hasAttribute("title")).toBe(false)
    expect(btn.dataset.sqbNativeTitle).toBe("测试提示")
    expect(btn.getAttribute("aria-label")).toBe("测试提示")

    const bubble = document.getElementById("sqb-tooltip-root")
    expect(bubble).not.toBeNull()
    expect(bubble?.textContent).toBe("测试提示")
    expect(bubble?.getAttribute("aria-hidden")).toBe("false")

    // 隐藏后还原
    hideTooltip()
    expect(btn.getAttribute("title")).toBe("测试提示")
    expect(bubble?.getAttribute("aria-hidden")).toBe("true")
  })

  it("mounts tooltip on body and positions correctly without being clipped by overflow", async () => {
    const Component = defineComponent({
      directives: {
        sqbTooltip: vSqbTooltip,
      },
      template: `
        <div style="overflow: hidden; width: 100px; height: 100px;">
          <button v-sqb-tooltip="'操作按钮提示'" class="test-btn">点击</button>
        </div>
      `,
    })

    const wrapper = mount(Component, { attachTo: document.body })
    const btn = wrapper.get(".test-btn")

    // 初始状态下 aria-label 已被规范化填充
    expect(btn.attributes("aria-label")).toBe("操作按钮提示")

    // 触发 pointerenter
    await btn.trigger("pointerenter")
    vi.advanceTimersByTime(200)
    await nextTick()

    const bubble = document.getElementById("sqb-tooltip-root")
    expect(bubble).not.toBeNull()
    expect(bubble?.parentElement).toBe(document.body) // 保证 Teleport 在 body 根节点，绝不被 overflow: hidden 截断
    expect(bubble?.textContent).toBe("操作按钮提示")

    // 触发离开
    btn.element.dispatchEvent(new Event("mouseleave"))
    vi.advanceTimersByTime(200)
    await nextTick()

    expect(bubble?.getAttribute("aria-hidden")).toBe("true")
    wrapper.unmount()
  })
})
