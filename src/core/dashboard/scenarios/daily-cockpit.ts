import type {
  CalendarTaskItem,
  DashboardDefinition,
  DashboardViewModel,
  MetricCardModel,
} from "../types"
import type { ResultRow } from "@/core/query/types"
import {
  escapeSqlLiteral,
  formatIsoDate,
  parseDateFromHPath,
  parseTaskStatus,
} from "../calculator"

export interface DailyCockpitParams {
  notebook?: string
  statusFilter?: string
  month?: string
}

export const dailyCockpitDashboard: DashboardDefinition = {
  id: "daily-cockpit",
  category: "daily",
  title: "个人每日工作台",
  description: "聚合散落在各篇日记和文档中的任务，提供日程月历网格与核心待办清单，支持直接在卡片上完成并回写。",
  parameters: [
    {
      id: "notebook",
      label: "目标笔记本",
      type: "notebook",
      defaultValue: "all",
    },
    {
      id: "statusFilter",
      label: "月历任务状态",
      type: "select",
      defaultValue: "all",
      options: [
        {
          label: "全部事项",
          value: "all",
        },
        {
          label: "仅未完成",
          value: "open",
        },
        {
          label: "已完成",
          value: "done",
        },
      ],
    },
    {
      id: "month",
      label: "目标月份",
      type: "text",
      // 惰性求值:避免长会话跨日后默认月份过期
      defaultValue: () => formatIsoDate(new Date()).slice(0, 7),
      placeholder: "YYYY-MM",
    },
  ],
  buildSql(params: DailyCockpitParams) {
    const boxClause = params.notebook && params.notebook !== "all" ? `AND b.box = '${escapeSqlLiteral(params.notebook)}'` : ""
    return `
        SELECT b.id, b.content, b.markdown, b.hpath, b.updated, b.created, b.box,
               (SELECT d.content FROM blocks d WHERE d.id = b.root_id) AS docTitle,
               (SELECT a.value FROM attributes a WHERE a.block_id = b.id AND a.name = 'custom-priority' LIMIT 1) AS priority,
               (SELECT a.value FROM attributes a WHERE a.block_id = b.id AND a.name = 'custom-status' LIMIT 1) AS customStatus
        FROM blocks b
        WHERE b.type = 'i' AND b.subtype = 't' ${boxClause}
        ORDER BY b.updated DESC
        LIMIT 600
      `
  },
  computeViewModel(rows: ResultRow[], params: DailyCockpitParams): DashboardViewModel {
    const todayIso = formatIsoDate(new Date())
    const selectedMonth = params.month || todayIso.slice(0, 7)

    // 解析任务
    const tasks: CalendarTaskItem[] = rows.map((r) => {
      const text = String(r.markdown || r.content || "")
      const status = parseTaskStatus(text)
      const date = parseDateFromHPath(String(r.hpath || "")) || String(r.created || "").slice(0, 8).replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3")
      const priority = r.priority ? String(r.priority) : undefined

      return {
        id: r.id,
        content: text.replace(/^\[[^\]]*\]\s*/, "").trim() || "未命名待办",
        status,
        date,
        docTitle: String(r.docTitle || "无标题文档"),
        docId: r.root_id == null ? undefined : String(r.root_id),
        priority,
      }
    })

    // 指标卡计算
    const todayTasks = tasks.filter((t) => t.date === todayIso)
    const todayOpen = todayTasks.filter((t) => t.status === "todo" || t.status === "doing").length
    const todayDone = todayTasks.filter((t) => t.status === "done").length
    const todayTotal = todayTasks.length
    const todayRate = todayTotal ? Math.round((todayDone / todayTotal) * 100) : 100

    const overdueTasks = tasks.filter((t) => t.date < todayIso && (t.status === "todo" || t.status === "doing"))

    const metrics: MetricCardModel[] = [
      {
        id: "today_open",
        label: "今日待办",
        value: `${todayOpen} 项`,
        subText: todayOpen === 0 ? "全部完成 🎉" : `进行中 ${todayTasks.filter((t) => t.status === "doing").length} 项`,
        accentColor: todayOpen > 0 ? "var(--b3-theme-primary)" : "#2fb36b",
        icon: "check-circle",
      },
      {
        id: "today_rate",
        label: "今日完成度",
        value: `${todayRate}%`,
        progress: todayRate,
        subText: `今日共 ${todayTotal} 项 · 已完成 ${todayDone} 项`,
        accentColor: "#2fb36b",
        icon: "percent",
      },
      {
        id: "overdue",
        label: "逾期未完",
        value: `${overdueTasks.length} 项`,
        subText: overdueTasks.length > 0 ? "需要关注处理" : "暂无历史遗留",
        accentColor: overdueTasks.length > 0 ? "#ef4444" : "var(--b3-theme-on-surface-light)",
        icon: "alert-triangle",
      },
      {
        id: "month_total",
        label: "本月事项",
        value: `${tasks.filter((t) => t.date.startsWith(selectedMonth)).length} 项`,
        subText: `已完成 ${tasks.filter((t) => t.date.startsWith(selectedMonth) && t.status === "done").length} 项`,
        icon: "calendar",
      },
    ]

    // 清单列表（展示今日待办与逾期待办）
    const listItems = [
      ...todayTasks.map((t) => ({
        id: t.id,
        title: t.content,
        meta: [t.date === todayIso ? "今日" : t.date, t.docTitle || "", t.priority || ""].filter(Boolean),
        status: t.status,
      })),
      ...overdueTasks.slice(0, 10).map((t) => ({
        id: t.id,
        title: t.content,
        meta: [`逾期 (${t.date})`, t.docTitle || ""].filter(Boolean),
        status: t.status,
      })),
    ]

    return {
      id: "daily-cockpit",
      title: "个人每日工作台",
      category: "daily",
      description: "聚合散落在各篇日记和文档中的任务，提供日程月历网格与核心待办清单，支持直接在卡片上完成并回写。",
      parameters: params,
      metrics,
      charts: [],
      calendar: {
        tasks,
        selectedMonth,
      },
      listItems,
    }
  },
}
