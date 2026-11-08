import type {
  DashboardDefinition,
  DashboardViewModel,
  MetricCardModel,
} from "../types"
import type { ResultRow } from "@/core/query/types"
import {
  buildBarDistributionOption,
  buildCalendarHeatmapOption,
  buildLineTrendOption,
} from "@/core/view/chart"
import {
  aggregateByWeekday,
  calculateMA7,
  calculateStreak,
  escapeSqlLiteral,
  formatIsoDate,
  generateDateRange,
  parseDateFromHPath,
} from "../calculator"

export interface HabitTrackerParams {
  keyword?: string
  goal?: number
  days?: string
}

export const habitTrackerDashboard: DashboardDefinition = {
  id: "habit-tracker",
  category: "habit",
  title: "微习惯打卡与精力大盘",
  description: "追踪日常习惯（喝水、晨跑、读书、冥想等），提供环形进度卡、连续打卡天数（Streak）、7日趋势与日历热力图。",
  parameters: [
    {
      id: "keyword",
      label: "打卡关键词/词条",
      type: "text",
      defaultValue: "喝水",
      placeholder: "如：喝水、跑步、阅读",
    },
    {
      id: "goal",
      label: "每日达标次数",
      type: "number",
      defaultValue: 8,
    },
    {
      id: "days",
      label: "回溯天数",
      type: "select",
      defaultValue: "90",
      options: [
        {
          label: "近 30 天",
          value: "30",
        },
        {
          label: "近 90 天",
          value: "90",
        },
        {
          label: "近 180 天",
          value: "180",
        },
      ],
    },
  ],
  buildSql(params: HabitTrackerParams) {
    const keyword = escapeSqlLiteral(params.keyword || "喝水")
    return `
        SELECT b.id, b.content, b.hpath, b.created, b.root_id,
               COALESCE(
                 SUBSTR((SELECT a.value FROM attributes a WHERE a.block_id = b.root_id AND a.name LIKE 'custom-dailynote-%' LIMIT 1), 1, 8),
                 REPLACE(SUBSTR((SELECT d.content FROM blocks d WHERE d.id = b.root_id), 1, 10), '-', '')
               ) AS day
        FROM blocks b
        WHERE b.content LIKE '%${keyword}%'
          AND b.type = 'p'
        ORDER BY b.created DESC
        LIMIT 800
      `
  },
  computeViewModel(rows: ResultRow[], params: HabitTrackerParams): DashboardViewModel {
    const goal = Number(params.goal) || 8
    const daysCount = Number(params.days) || 90
    const todayIso = formatIsoDate(new Date())

    // 聚合按天的打卡频次
    const dateMap: Record<string, number> = {}
    for (const r of rows) {
      let dayStr = String(r.day || "")
      if (dayStr.length === 8) {
        dayStr = `${dayStr.slice(0, 4)}-${dayStr.slice(4, 6)}-${dayStr.slice(6, 8)}`
      } else {
        const parsed = parseDateFromHPath(String(r.hpath || ""))
        if (parsed) dayStr = parsed
      }
      if (dayStr && /^\d{4}-\d{2}-\d{2}$/.test(dayStr)) {
        dateMap[dayStr] = (dateMap[dayStr] || 0) + 1
      }
    }

    // 连续达标天数与指标计算
    const {
      curStreak,
      maxStreak,
    } = calculateStreak(dateMap, goal, todayIso)
    const todayVal = dateMap[todayIso] || 0
    const todayProgress = Math.min(100, Math.round((todayVal / goal) * 100))

    // 生成最近 daysCount 天序列
    const startDt = new Date()
    startDt.setDate(startDt.getDate() - daysCount + 1)
    const daySeq = generateDateRange(formatIsoDate(startDt), todayIso)
    const dailyVals = daySeq.map((d) => dateMap[d] || 0)
    const ma7Vals = calculateMA7(dailyVals)

    // 期间达标率
    const recordedDays = daySeq.filter((d) => (dateMap[d] || 0) > 0).length
    const reachedDays = daySeq.filter((d) => (dateMap[d] || 0) >= goal).length
    const reachRate = recordedDays ? Math.round((reachedDays / recordedDays) * 100) : 0

    const metrics: MetricCardModel[] = [
      {
        id: "today_progress",
        label: `今日${params.keyword || "习惯"}`,
        value: `${todayVal} / ${goal} 次`,
        progress: todayProgress,
        subText: todayVal >= goal ? "✅ 今日已达标，继续保持！" : `还差 ${goal - todayVal} 次达标`,
        accentColor: todayVal >= goal ? "#2fb36b" : "var(--b3-theme-primary)",
      },
      {
        id: "streak",
        label: "连续达标天数",
        value: `🔥 ${curStreak} 天`,
        subText: `历史最长连续: ${maxStreak} 天`,
        accentColor: "#f2a33c",
      },
      {
        id: "reach_rate",
        label: "期间达标率",
        value: `${reachRate}%`,
        progress: reachRate,
        subText: `打卡 ${recordedDays} 天 · 达标 ${reachedDays} 天`,
        accentColor: "#2fb36b",
      },
      {
        id: "total_times",
        label: "累计打卡总量",
        value: `${dailyVals.reduce((a, b) => a + b, 0)} 次`,
        subText: `日均 ${(dailyVals.reduce((a, b) => a + b, 0) / (daySeq.length || 1)).toFixed(1)} 次`,
      },
    ]

    // 星期分布
    const weekdayStats = aggregateByWeekday(dateMap, daySeq, goal)

    // 图表组装
    const charts = [
      {
        id: "trend_line",
        type: "line" as const,
        title: `${params.keyword || "打卡"}趋势走势 (近 ${daysCount} 天)`,
        option: buildLineTrendOption({
          title: `${params.keyword || "打卡"}走势与 7 日移动均线`,
          dates: daySeq,
          values: dailyVals,
          ma7Values: ma7Vals,
          goalValue: goal,
          unit: "次",
        }),
      },
      {
        id: "weekday_bar",
        type: "bar" as const,
        title: "周中习惯规律分析",
        option: buildBarDistributionOption({
          title: "周一至周日平均频次",
          categories: weekdayStats.map((w) => w.label),
          values: weekdayStats.map((w) => w.avg),
          goalValue: goal,
          accentColor: "var(--b3-theme-primary)",
        }),
      },
      {
        id: "heatmap",
        type: "heatmap" as const,
        title: "日历贡献热力图",
        option: buildCalendarHeatmapOption({
          title: "逐日打卡分布热力图",
          startDate: daySeq[0],
          endDate: daySeq[daySeq.length - 1],
          dateValuePairs: daySeq.map((d) => [d, dateMap[d] || 0]),
          maxVal: goal,
        }),
      },
    ]

    return {
      id: "habit-tracker",
      title: "微习惯打卡与精力大盘",
      category: "habit",
      description: "追踪日常习惯，提供环形进度卡、连续打卡天数（Streak）、7日走势与日历热力图。",
      parameters: params,
      metrics,
      charts,
      tableRows: rows.slice(0, 15),
    }
  },
}
