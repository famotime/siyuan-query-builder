import { describe, expect, it } from "vitest"
import {
  buildBarDistributionOption,
  buildCalendarHeatmapOption,
  buildLineTrendOption,
  buildPieCompositionOption,
  getSiYuanThemeColors,
} from "@/core/view/chart"

describe("chart options builders", () => {
  it("provides theme colors with fallback defaults", () => {
    const colors = getSiYuanThemeColors()
    expect(colors.primary).toContain("var(--b3-theme-primary")
    expect(colors.success).toBe("#2fb36b")
    expect(colors.danger).toBe("#ef4444")
  })

  it("builds line trend option with markLine when goal is set", () => {
    const opt = buildLineTrendOption({
      title: "每日打卡走势",
      dates: ["2026-09-01", "2026-09-02"],
      values: [5, 8],
      ma7Values: [5, 6.5],
      goalValue: 8,
      unit: "杯",
    })

    expect(opt.title.text).toBe("每日打卡走势")
    expect(opt.series.length).toBe(2) // actual + ma7
    expect(opt.series[0].markLine).toBeDefined()
    expect(opt.series[0].markLine.data[0].yAxis).toBe(8)
    expect(opt.series[1].name).toBe("7日均线")
  })

  it("builds bar distribution option horizontal and vertical", () => {
    const vertical = buildBarDistributionOption({
      title: "星期分布",
      categories: ["周一", "周二"],
      values: [3, 6],
    })
    expect(vertical.xAxis.type).toBe("category")
    expect(vertical.yAxis.type).toBe("value")

    const horizontal = buildBarDistributionOption({
      title: "各笔记本统计",
      categories: ["工作", "读书"],
      values: [10, 5],
      horizontal: true,
    })
    expect(horizontal.xAxis.type).toBe("value")
    expect(horizontal.yAxis.type).toBe("category")
  })

  it("builds calendar heatmap option", () => {
    const opt = buildCalendarHeatmapOption({
      title: "写作热力图",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      dateValuePairs: [["2026-09-17", 4]],
    })

    expect(opt.calendar.range).toEqual(["2026-01-01", "2026-12-31"])
    expect(opt.series[0].type).toBe("heatmap")
  })

  it("builds pie composition option with donut radius", () => {
    const opt = buildPieCompositionOption({
      title: "任务状态分布",
      data: [
        { name: "已完成", value: 10, color: "#2fb36b" },
        { name: "待办", value: 5, color: "#f2a33c" },
      ],
      isDonut: true,
    })

    expect(opt.series[0].radius).toEqual(["38%", "62%"])
    expect(opt.series[0].data[0].itemStyle.color).toBe("#2fb36b")
  })
})
