import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"

import InlineQueryWidget from "@/inline/InlineQueryWidget.vue"

describe("InlineQueryWidget", () => {
  it("renders embedded results with the dark widget theme class", () => {
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

    expect(wrapper.get(".inline-widget").classes()).toContain("inline-widget--dark")
  })
})
