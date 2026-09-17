import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"
import DashboardView from "@/components/query-builder/DashboardView.vue"
import ResultsCalendarView from "@/components/query-builder/ResultsCalendarView.vue"
import { getDashboardDefinition } from "@/core/dashboard/catalog"
import type { DashboardViewModel } from "@/core/dashboard/types"

describe("dashboard integration and components rendering", () => {
  it("renders DashboardView with metrics, charts, and calendar", () => {
    const def = getDashboardDefinition("daily-cockpit")
    expect(def).toBeDefined()

    const mockViewModel: DashboardViewModel = {
      id: "daily-cockpit",
      title: "个人每日工作台",
      category: "daily",
      description: "每日工作流聚合看板",
      parameters: { notebook: "all", month: "2026-09" },
      metrics: [
        { id: "m1", label: "今日待办", value: "3 项", accentColor: "#2fb36b" },
        { id: "m2", label: "今日完成度", value: "66%", progress: 66 },
      ],
      charts: [],
      calendar: {
        tasks: [
          { id: "t1", content: "完成设计文档", status: "todo", date: "2026-09-17" },
          { id: "t2", content: "进行单元测试", status: "doing", date: "2026-09-17" },
        ],
        selectedMonth: "2026-09",
      },
      listItems: [
        { id: "t1", title: "完成设计文档", meta: ["今日"], status: "todo" },
      ],
    }

    const wrapper = mount(DashboardView, {
      props: {
        viewModel: mockViewModel,
        notebooks: [{ id: "box1", name: "工作笔记" }],
      },
    })

    expect(wrapper.text()).toContain("个人每日工作台")
    expect(wrapper.text()).toContain("今日待办")
    expect(wrapper.text()).toContain("3 项")
    expect(wrapper.text()).toContain("今日完成度")
    expect(wrapper.text()).toContain("66%")
    expect(wrapper.text()).toContain("事项月历总览")
    expect(wrapper.text()).toContain("完成设计文档")
  })

  it("renders ResultsCalendarView and handles block click emission", async () => {
    const tasks = [
      { id: "task-101", content: "阅读学术论文", status: "todo" as const, date: "2026-09-17" },
    ]

    const wrapper = mount(ResultsCalendarView, {
      props: {
        tasks,
        initialMonth: "2026-09",
      },
    })

    expect(wrapper.text()).toContain("2026年9月")
    expect(wrapper.text()).toContain("阅读学术论文")

    const taskEl = wrapper.find(".calendar-view__task-card")
    expect(taskEl.exists()).toBe(true)
    await taskEl.trigger("click")

    expect(wrapper.emitted("openBlock")).toBeTruthy()
    expect(wrapper.emitted("openBlock")![0]).toEqual(["task-101"])
  })

  it("emits updateParam when parameter changes in DashboardView", async () => {
    const mockViewModel: DashboardViewModel = {
      id: "habit-tracker",
      title: "微习惯打卡与精力大盘",
      category: "habit",
      description: "习惯追踪",
      parameters: { keyword: "喝水", goal: 8, days: "30" },
      metrics: [],
      charts: [],
    }

    const wrapper = mount(DashboardView, {
      props: {
        viewModel: mockViewModel,
      },
    })

    const input = wrapper.find<HTMLInputElement>(".tuning-bar__text")
    expect(input.exists()).toBe(true)
    await input.setValue("晨跑")
    await input.trigger("change")

    expect(wrapper.emitted("updateParam")).toBeTruthy()
    expect(wrapper.emitted("updateParam")![0]).toEqual(["keyword", "晨跑"])
  })
})
