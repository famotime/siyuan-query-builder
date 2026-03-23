import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"

import InlineQueryWidget from "@/inline/InlineQueryWidget.vue"

describe("InlineQueryWidget", () => {
  it("renders embedded results without a hardcoded theme class", () => {
    const wrapper = mount(InlineQueryWidget, {
      props: {
        title: "任务概览",
        viewType: "table",
        result: {
          rows: [],
          total: 0,
          executedAt: "2026-03-23T00:00:00.000Z",
        },
        fields: ["content"],
        fieldMappings: {
          status: "status",
          dueDate: "dueDate",
          priority: "priority",
          project: "project",
          owner: "owner",
        },
      },
    })

    expect(wrapper.get(".inline-widget").classes()).toEqual(["inline-widget"])
  })

  it("renders user-friendly Chinese table headers for built-in and mapped fields", () => {
    const wrapper = mount(InlineQueryWidget, {
      props: {
        title: "任务概览",
        viewType: "table",
        result: {
          rows: [
            {
              id: "block-1",
              content: "任务 A",
              attrs: {
                status: "Doing",
              },
            },
          ],
          total: 1,
          executedAt: "2026-03-23T00:00:00.000Z",
        },
        fields: ["content", "updated", "tagCount", "attr:status", "box"],
        fieldMappings: {
          status: "status",
          dueDate: "dueDate",
          priority: "priority",
          project: "project",
          owner: "owner",
        },
      },
    })

    const headers = wrapper.findAll("th").map(cell => cell.text())

    expect(headers).toEqual(["标题 / 内容", "更新时间", "标签数量", "状态", "笔记本"])
  })

  it("falls back to Chinese attribute labels for unmapped custom fields", () => {
    const wrapper = mount(InlineQueryWidget, {
      props: {
        title: "任务概览",
        viewType: "table",
        result: {
          rows: [
            {
              id: "block-1",
              content: "任务 A",
              attrs: {
                source_url: "https://example.com",
              },
            },
          ],
          total: 1,
          executedAt: "2026-03-23T00:00:00.000Z",
        },
        fields: ["attr:source_url"],
        fieldMappings: {
          status: "status",
          dueDate: "dueDate",
          priority: "priority",
          project: "project",
          owner: "owner",
        },
      },
    })

    expect(wrapper.get("th").text()).toBe("属性：source_url")
  })
})
