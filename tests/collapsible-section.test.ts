import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"

import CollapsibleSection from "@/components/query-builder/CollapsibleSection.vue"

describe("CollapsibleSection", () => {
  function mountSection(props: Record<string, unknown> = {}, lead = "<div class=\"lead-mock\">标题</div>") {
    return mount(CollapsibleSection, {
      props: {
        expanded: true,
        expandLabel: "展开测试区块",
        collapseLabel: "收起测试区块",
        toggleAttrs: { "data-section-toggle": "mock" },
        ...props,
      },
      slots: {
        lead,
        default: "<div class=\"body-mock\">正文</div>",
      },
    })
  }

  it("renders the head with lead content and the toggle button inside", () => {
    const wrapper = mountSection()

    expect(wrapper.find(".section-head").exists()).toBe(true)
    expect(wrapper.find(".lead-mock").exists()).toBe(true)
    const toggle = wrapper.get("[data-section-toggle=\"mock\"]")
    expect(toggle.classes()).toContain("section-toggle")
    expect(toggle.attributes("type")).toBe("button")
    expect(toggle.attributes("aria-expanded")).toBe("true")
    expect(toggle.attributes("aria-label")).toBe("收起测试区块")
  })

  it("switches tooltip/aria label with the expanded state", async () => {
    const wrapper = mountSection({ expanded: false })
    const toggle = wrapper.get("[data-section-toggle=\"mock\"]")
    expect(toggle.attributes("aria-label")).toBe("展开测试区块")

    await wrapper.setProps({ expanded: true })
    expect(wrapper.get("[data-section-toggle=\"mock\"]").attributes("aria-label")).toBe("收起测试区块")
  })

  it("emits toggle when the button is clicked", async () => {
    const wrapper = mountSection()
    await wrapper.get("[data-section-toggle=\"mock\"]").trigger("click")
    expect(wrapper.emitted("toggle")).toHaveLength(1)
  })

  it("toggles the chevron is-expanded class with the state", async () => {
    const wrapper = mountSection({ expanded: false })
    const svg = wrapper.get("[data-section-toggle=\"mock\"]").find("svg")
    expect(svg.classes()).not.toContain("is-expanded")

    await wrapper.setProps({ expanded: true })
    expect(wrapper.get("[data-section-toggle=\"mock\"]").find("svg").classes()).toContain("is-expanded")
  })

  it("merges the head class prop and supports custom body-less usage", () => {
    const wrapper = mountSection({ headClass: "sqb-dock__section-head" })
    expect(wrapper.get(".sqb-dock__section-head").classes()).toContain("sqb-dock__section-head")
    // 组件只渲染头部;正文由宿主自行控制
    expect(wrapper.find(".body-mock").exists()).toBe(false)
  })

  it("supports an arbitrary toggle class and chevron override slot", () => {
    const wrapper = mount(CollapsibleSection, {
      props: {
        expanded: true,
        toggleClass: "preset-group__toggle",
        toggleAttrs: { "data-preset-category-toggle": "daily" },
      },
      slots: {
        chevron: "<span class=\"chevron-mock\" data-custom-chevron />",
      },
    })

    const toggle = wrapper.get("[data-preset-category-toggle=\"daily\"]")
    expect(toggle.classes()).toContain("preset-group__toggle")
    expect(toggle.find(".chevron-mock").exists()).toBe(true)
    expect(wrapper.get("[data-preset-category-toggle=\"daily\"]").find("svg").exists()).toBe(false)
  })

  it("omits tooltip and aria-label when no labels are provided", () => {
    const wrapper = mount(CollapsibleSection, {
      props: {
        expanded: true,
        toggleAttrs: { "data-section-toggle": "bare" },
      },
      slots: { lead: "<span />" },
    })

    const toggle = wrapper.get("[data-section-toggle=\"bare\"]")
    expect(toggle.attributes("aria-label")).toBeUndefined()
    // 指令在无文案时不注入 tooltip
    expect(document.getElementById("sqb-tooltip-root")).toBeNull()
  })

  it("hides the built-in toggle for actions-nested usage", () => {
    const wrapper = mount(CollapsibleSection, {
      props: {
        expanded: true,
        hideToggle: true,
      },
      slots: {
        lead: "<span />",
        actions: "<div class=\"actions-mock\" />",
      },
    })

    expect(wrapper.find(".section-toggle").exists()).toBe(false)
    expect(wrapper.find(".actions-mock").exists()).toBe(true)
  })

  it("forwards dynamic head classes via fallthrough attrs", () => {
    const wrapper = mount(CollapsibleSection, {
      props: { expanded: true },
      attrs: {
        class: { "section-head--collapsed": true },
      },
      slots: { lead: "<span />" },
    })

    expect(wrapper.get(".section-head").classes()).toContain("section-head--collapsed")
  })
})
