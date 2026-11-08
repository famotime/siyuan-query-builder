import type {
  DashboardDefinition,
  DashboardViewModel,
  MetricCardModel,
} from "../types"
import type { ResultRow } from "@/core/query/types"
import { buildCalendarHeatmapOption } from "@/core/view/chart"
import { escapeSqlLiteral } from "../calculator"

export interface WritingFlowParams {
  year?: string
}

export const writingFlowDashboard: DashboardDefinition = {
  id: "writing-flow",
  category: "creative",
  title: "创作者写作热力与研读流转看板",
  description: "提供 GitHub 贡献墙风格的写作日历热力图与阶段流转看板，推动文献与阅读材料从“在读”到“输出”。",
  parameters: [
    {
      id: "year",
      label: "统计年份",
      type: "text",
      // 惰性求值:避免长会话跨年后默认年份过期
      defaultValue: () => String(new Date().getFullYear()),
      placeholder: "YYYY",
    },
  ],
  buildSql(params: WritingFlowParams) {
    const year = escapeSqlLiteral(params.year || String(new Date().getFullYear()))
    return `
        SELECT b.id, b.content, b.hpath, b.created, b.updated, b.box,
               (SELECT a.value FROM attributes a WHERE a.block_id = b.id AND a.name = 'custom-status' LIMIT 1) AS status
        FROM blocks b
        WHERE b.type = 'd' AND b.created LIKE '${year}%'
        ORDER BY b.created DESC
        LIMIT 600
      `
  },
  computeViewModel(rows: ResultRow[], params: WritingFlowParams): DashboardViewModel {
    const year = String(params.year || new Date().getFullYear())

    // 按天汇聚文档新建数
    const dayCounts: Record<string, number> = {}
    for (const r of rows) {
      const d = String(r.created || "").slice(0, 8)
      if (d.length === 8) {
        const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
        dayCounts[iso] = (dayCounts[iso] || 0) + 1
      }
    }

    const totalDocs = rows.length
    const activeDays = Object.keys(dayCounts).length

    const metrics: MetricCardModel[] = [
      {
        id: "year_docs",
        label: `${year} 年新建文档`,
        value: `${totalDocs} 篇`,
        subText: `活跃写作天数: ${activeDays} 天`,
        accentColor: "var(--b3-theme-primary)",
        icon: "file-text",
      },
      {
        id: "active_rate",
        label: "年度写作覆盖率",
        value: `${Math.round((activeDays / 365) * 100)}%`,
        progress: Math.round((activeDays / 365) * 100),
        subText: `共 365 天 · 活跃 ${activeDays} 天`,
        accentColor: "#2fb36b",
        icon: "activity",
      },
    ]

    const dayPairs: Array<[string, number]> = Object.entries(dayCounts)

    const charts = [
      {
        id: "writing_heatmap",
        type: "heatmap" as const,
        title: `${year} 年逐日写作贡献热力图`,
        option: buildCalendarHeatmapOption({
          title: `${year} 年逐日写作贡献墙`,
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`,
          dateValuePairs: dayPairs,
        }),
      },
    ]

    // 阶段看板列
    const boardColumns = [
      {
        id: "reading",
        title: "待读 / 收集",
        count: rows.filter((r) => !r.status || r.status === "Unread" || r.status === "待读").length,
        rows: rows.filter((r) => !r.status || r.status === "Unread" || r.status === "待读").slice(0, 10),
      },
      {
        id: "in_progress",
        title: "精读研读中",
        count: rows.filter((r) => r.status === "Reading" || r.status === "研读中").length,
        rows: rows.filter((r) => r.status === "Reading" || r.status === "研读中").slice(0, 10),
      },
      {
        id: "output",
        title: "整理输出",
        count: rows.filter((r) => r.status === "Output" || r.status === "输出").length,
        rows: rows.filter((r) => r.status === "Output" || r.status === "输出").slice(0, 10),
      },
      {
        id: "archived",
        title: "已归纳",
        count: rows.filter((r) => r.status === "Done" || r.status === "已完成").length,
        rows: rows.filter((r) => r.status === "Done" || r.status === "已完成").slice(0, 10),
      },
    ]

    return {
      id: "writing-flow",
      title: "创作者写作热力与研读流转看板",
      category: "creative",
      description: "提供 GitHub 贡献墙风格的写作日历热力图与阶段流转看板，推动文献与阅读材料从“在读”到“输出”。",
      parameters: params,
      metrics,
      charts,
      boardColumns,
    }
  },
}
