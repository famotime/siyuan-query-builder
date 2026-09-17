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

// 缓存正在进行的动态加载 Promise，防止同一页面多个图表并发触发多次脚本注入
let echartsLoadingPromise: Promise<any> | null = null

/**
 * 动态加载脚本文件并设置超时保护
 */
function loadScriptWithTimeout(src: string, scriptId: string, timeoutMs = 3500): Promise<boolean> {
  if (typeof document === "undefined") {
    return Promise.resolve(false)
  }

  return new Promise((resolve) => {
    let timer: any = null
    const cleanup = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    // 检查 DOM 中是否已经存在相同 ID 的 script
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null
    if (existing) {
      if (typeof window !== "undefined" && (window as any).echarts) {
        resolve(true)
        return
      }
      existing.addEventListener("load", () => {
        cleanup()
        resolve(true)
      }, { once: true })
      existing.addEventListener("error", () => {
        cleanup()
        resolve(false)
      }, { once: true })
      timer = setTimeout(() => {
        resolve(false)
      }, timeoutMs)
      return
    }

    const script = document.createElement("script")
    script.id = scriptId
    script.type = "text/javascript"
    script.src = src
    script.async = true

    script.onload = () => {
      cleanup()
      resolve(true)
    }
    script.onerror = () => {
      cleanup()
      script.remove()
      resolve(false)
    }

    timer = setTimeout(() => {
      script.remove()
      resolve(false)
    }, timeoutMs)

    document.head.appendChild(script)
  })
}

/**
 * 获取 ECharts 脚本的探测候选路径列表
 * 离线优先：优先利用思源笔记安装包内置的 stage 静态资源，避免任何外网网络依赖
 */
function getEChartsCandidateUrls(): string[] {
  const urls: string[] = []

  // 1. 若当前页面已有其他 protyle 资源，自动提取其相对或反代部署基础前缀
  if (typeof document !== "undefined") {
    const existingElements = Array.from(
      document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>("script[src], link[href]"),
    )
    for (const el of existingElements) {
      const path = (el as HTMLScriptElement).src || (el as HTMLLinkElement).href || ""
      const match = path.match(/^(.*\/stage\/protyle\/)/)
      if (match && match[1]) {
        urls.push(`${match[1]}js/echarts/echarts.min.js?v=5.3.2`)
        urls.push(`${match[1]}js/echarts/echarts.min.js`)
        break
      }
    }
  }

  // 2. 思源笔记标准的本地绝对服务路径（桌面端与标准 Web 端默认静态资源根路径）
  urls.push("/stage/protyle/js/echarts/echarts.min.js?v=5.3.2")
  urls.push("/stage/protyle/js/echarts/echarts.min.js")

  // 3. 相对路径兜底（部分相对路径子页面或特殊打包窗口）
  urls.push("stage/protyle/js/echarts/echarts.min.js")

  // 4. 公共 CDN 兜底（仅用于非思源纯开发环境或独立组件调试）
  urls.push("https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js")
  urls.push("https://unpkg.com/echarts@5.5.0/dist/echarts.min.js")

  return Array.from(new Set(urls))
}

/**
 * 获取 ECharts 实例对象
 * 若环境尚未载入 window.echarts，将自动按需加载思源本地静态资源，避免手动添加图表块的前置要求
 */
export async function getEChartsInstance(forceReload = false): Promise<any> {
  if (typeof window !== "undefined" && (window as any).echarts && !forceReload) {
    return (window as any).echarts
  }

  // 并发请求合并：如果有正在进行中的加载任务，复用该 Promise
  if (echartsLoadingPromise && !forceReload) {
    return echartsLoadingPromise
  }

  const candidateUrls = getEChartsCandidateUrls()
  const scriptId = "protyleEchartsScript"

  echartsLoadingPromise = (async () => {
    try {
      for (const url of candidateUrls) {
        const ok = await loadScriptWithTimeout(url, scriptId, 3500)
        if (ok && typeof window !== "undefined" && (window as any).echarts) {
          return (window as any).echarts
        }
      }
    } catch (e) {
      console.warn("[SQB] Failed to auto-load ECharts:", e)
    }
    return null
  })().finally(() => {
    // 任务结束后清空进行中标志，后续读取直接走 window.echarts，若失败也支持按需重试
    echartsLoadingPromise = null
  })

  return echartsLoadingPromise
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
