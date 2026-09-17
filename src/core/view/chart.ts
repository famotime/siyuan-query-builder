/**
 * ECharts 引擎与 Option 构造适配器
 * 优先复用宿主环境内置的 window.echarts，无缝集成思源主题色彩
 */

export interface ThemeColors {
  background: string
  text: string
  subText: string
  primary: string
  border: string
  success: string
  warning: string
  danger: string
}

export function getSiYuanThemeColors(): ThemeColors {
  return {
    background: "transparent",
    text: "var(--b3-theme-on-background, #333333)",
    subText: "var(--b3-theme-on-surface-light, #888888)",
    primary: "var(--b3-theme-primary, #3b82f6)",
    border: "var(--b3-border-color, #e5e7eb)",
    success: "#2fb36b",
    warning: "#f2a33c",
    danger: "#ef4444",
  }
}

/**
 * 获取 ECharts 实例对象
 */
export async function getEChartsInstance(): Promise<any> {
  if (typeof window !== "undefined" && (window as any).echarts) {
    return (window as any).echarts
  }
  return null
}

/**
 * 构造趋势折线图配置（支持 7 日均线与达标阈值虚线）
 */
export function buildLineTrendOption(params: {
  title: string
  dates: string[]
  values: number[]
  ma7Values?: number[]
  goalValue?: number
  unit?: string
}): Record<string, any> {
  const c = getSiYuanThemeColors()
  const series: any[] = [
    {
      name: "实际",
      type: "line",
      data: params.values,
      smooth: true,
      showSymbol: params.dates.length <= 15,
      symbolSize: 6,
      lineStyle: { width: 2.5, color: c.primary },
      itemStyle: { color: c.primary },
      areaStyle: {
        color: "rgba(59, 130, 246, 0.12)",
      },
      ...(params.goalValue != null
        ? {
            markLine: {
              symbol: "none",
              silent: true,
              data: [{ yAxis: params.goalValue }],
              lineStyle: { color: c.danger, type: "dashed" },
              label: {
                formatter: `目标 ${params.goalValue}${params.unit || ""}`,
                position: "insideEndTop",
                fontSize: 10,
                color: c.danger,
              },
            },
          }
        : {}),
    },
  ]

  if (params.ma7Values && params.ma7Values.length === params.values.length) {
    series.push({
      name: "7日均线",
      type: "line",
      data: params.ma7Values,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2, color: c.warning, type: "dashed" },
      itemStyle: { color: c.warning },
    })
  }

  return {
    title: {
      text: params.title,
      left: 10,
      top: 8,
      textStyle: { fontSize: 13, fontWeight: 600, color: c.text },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "var(--b3-theme-background, #fff)",
      borderColor: "var(--b3-border-color, #eee)",
      textStyle: { color: "var(--b3-theme-on-background, #333)", fontSize: 12 },
    },
    legend: {
      right: 12,
      top: 8,
      textStyle: { fontSize: 11, color: c.subText },
    },
    grid: { left: 40, right: 24, top: 46, bottom: 28, containLabel: true },
    xAxis: {
      type: "category",
      data: params.dates.map(d => (d.length > 5 ? d.slice(5) : d)),
      axisLabel: { fontSize: 10, color: c.subText },
      axisLine: { lineStyle: { color: c.border } },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontSize: 10, color: c.subText },
      splitLine: { lineStyle: { color: "rgba(128,128,128,0.12)" } },
    },
    series,
  }
}

/**
 * 构造柱状分布图（支持纵向或横向）
 */
export function buildBarDistributionOption(params: {
  title: string
  categories: string[]
  values: number[]
  horizontal?: boolean
  goalValue?: number
  accentColor?: string
}): Record<string, any> {
  const c = getSiYuanThemeColors()
  const barColor = params.accentColor || c.primary

  const isH = !!params.horizontal

  const categoryAxis = {
    type: "category",
    data: params.categories,
    axisLabel: { fontSize: 10, color: c.subText },
    axisLine: { lineStyle: { color: c.border } },
  }
  const valueAxis = {
    type: "value",
    minInterval: 1,
    axisLabel: { fontSize: 10, color: c.subText },
    splitLine: { lineStyle: { color: "rgba(128,128,128,0.12)" } },
  }

  return {
    title: {
      text: params.title,
      left: 10,
      top: 8,
      textStyle: { fontSize: 13, fontWeight: 600, color: c.text },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "var(--b3-theme-background, #fff)",
      borderColor: "var(--b3-border-color, #eee)",
      textStyle: { color: "var(--b3-theme-on-background, #333)", fontSize: 12 },
    },
    grid: { left: 40, right: 30, top: 44, bottom: 26, containLabel: true },
    xAxis: isH ? valueAxis : categoryAxis,
    yAxis: isH ? categoryAxis : valueAxis,
    series: [
      {
        type: "bar",
        data: params.values,
        barMaxWidth: isH ? 16 : 28,
        itemStyle: {
          color: (p: any) =>
            params.goalValue && p.value >= params.goalValue
              ? c.success
              : barColor,
          borderRadius: isH ? [0, 4, 4, 0] : [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: isH ? "right" : "top",
          fontSize: 10,
          color: c.subText,
        },
      },
    ],
  }
}

/**
 * 构造日历热力图（GitHub 贡献墙风格）
 */
export function buildCalendarHeatmapOption(params: {
  title: string
  startDate: string
  endDate: string
  dateValuePairs: Array<[string, number]> // [ "YYYY-MM-DD", count ]
  maxVal?: number
}): Record<string, any> {
  const c = getSiYuanThemeColors()
  const max = params.maxVal || Math.max(1, ...params.dateValuePairs.map(p => p[1]))

  return {
    title: {
      text: params.title,
      left: 10,
      top: 6,
      textStyle: { fontSize: 13, fontWeight: 600, color: c.text },
    },
    tooltip: {
      formatter: (p: any) => `${p.value[0]}：${p.value[1]} 次`,
      backgroundColor: "var(--b3-theme-background, #fff)",
      borderColor: "var(--b3-border-color, #eee)",
      textStyle: { color: "var(--b3-theme-on-background, #333)", fontSize: 12 },
    },
    visualMap: {
      min: 0,
      max,
      show: false,
      inRange: {
        color: ["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"],
      },
    },
    calendar: {
      top: 36,
      left: 42,
      right: 18,
      bottom: 8,
      range: [params.startDate, params.endDate],
      cellSize: ["auto", 13],
      itemStyle: {
        borderWidth: 2,
        borderColor: "var(--b3-theme-background, #ffffff)",
      },
      yearLabel: { show: false },
      monthLabel: { nameMap: "ZH", color: c.subText, fontSize: 10 },
      dayLabel: {
        nameMap: ["日", "一", "二", "三", "四", "五", "六"],
        firstDay: 1,
        color: c.subText,
        fontSize: 10,
      },
    },
    series: [
      {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: params.dateValuePairs,
      },
    ],
  }
}

/**
 * 构造环形比例/饼图
 */
export function buildPieCompositionOption(params: {
  title: string
  data: Array<{ name: string; value: number; color?: string }>
  isDonut?: boolean
}): Record<string, any> {
  const c = getSiYuanThemeColors()
  return {
    title: {
      text: params.title,
      left: "center",
      top: 8,
      textStyle: { fontSize: 13, fontWeight: 600, color: c.text },
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}：{c} ({d}%)",
      backgroundColor: "var(--b3-theme-background, #fff)",
      borderColor: "var(--b3-border-color, #eee)",
      textStyle: { color: "var(--b3-theme-on-background, #333)", fontSize: 12 },
    },
    legend: {
      bottom: 4,
      icon: "circle",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 11, color: c.subText },
    },
    series: [
      {
        type: "pie",
        radius: params.isDonut !== false ? ["38%", "62%"] : "60%",
        center: ["50%", "48%"],
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 600,
            formatter: "{b}\n{d}%",
          },
        },
        data: params.data.map(d => ({
          ...d,
          itemStyle: d.color ? { color: d.color } : undefined,
        })),
      },
    ],
  }
}
