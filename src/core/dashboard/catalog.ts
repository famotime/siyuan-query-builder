import type { FieldMappings, ResultRow } from "@/core/query/types"
import type { CalendarTaskItem, DashboardDefinition, DashboardViewModel, MetricCardModel } from "./types"
import {
  aggregateByWeekday,
  calculateMA7,
  calculateStreak,
  formatIsoDate,
  generateDateRange,
  parseDateFromHPath,
  parseTaskStatus,
} from "./calculator"
import {
  buildBarDistributionOption,
  buildCalendarHeatmapOption,
  buildLineTrendOption,
  buildPieCompositionOption,
} from "@/core/view/chart"

/**
 * 预置 5 大开箱即用场景化仪表板
 */
export const SCENARIO_DASHBOARDS: DashboardDefinition[] = [
  // ==========================================
  // 1. 个人每日工作台 (Daily Log & Task Cockpit)
  // ==========================================
  {
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
          { label: "全部事项", value: "all" },
          { label: "仅未完成", value: "open" },
          { label: "已完成", value: "done" },
        ],
      },
      {
        id: "month",
        label: "目标月份",
        type: "text",
        defaultValue: formatIsoDate(new Date()).slice(0, 7),
        placeholder: "YYYY-MM",
      },
    ],
    buildSql(params) {
      const boxClause = params.notebook && params.notebook !== "all" ? `AND b.box = '${params.notebook}'` : ""
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
    computeViewModel(rawRows, params) {
      const rows = (Array.isArray(rawRows[0]) ? rawRows[0] : rawRows) as ResultRow[]
      const todayIso = formatIsoDate(new Date())
      const selectedMonth = (params.month as string) || todayIso.slice(0, 7)

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
          docId: r.root_id,
          priority,
        }
      })

      // 指标卡计算
      const todayTasks = tasks.filter(t => t.date === todayIso)
      const todayOpen = todayTasks.filter(t => t.status === "todo" || t.status === "doing").length
      const todayDone = todayTasks.filter(t => t.status === "done").length
      const todayTotal = todayTasks.length
      const todayRate = todayTotal ? Math.round((todayDone / todayTotal) * 100) : 100

      const overdueTasks = tasks.filter(t => t.date < todayIso && (t.status === "todo" || t.status === "doing"))

      const metrics: MetricCardModel[] = [
        {
          id: "today_open",
          label: "今日待办",
          value: `${todayOpen} 项`,
          subText: todayOpen === 0 ? "全部完成 🎉" : `进行中 ${todayTasks.filter(t => t.status === "doing").length} 项`,
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
          value: `${tasks.filter(t => t.date.startsWith(selectedMonth)).length} 项`,
          subText: `已完成 ${tasks.filter(t => t.date.startsWith(selectedMonth) && t.status === "done").length} 项`,
          icon: "calendar",
        },
      ]

      // 清单列表（展示今日待办与逾期待办）
      const listItems = [
        ...todayTasks.map(t => ({
          id: t.id,
          title: t.content,
          meta: [t.date === todayIso ? "今日" : t.date, t.docTitle || "", t.priority || ""].filter(Boolean),
          status: t.status,
        })),
        ...overdueTasks.slice(0, 10).map(t => ({
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
  },

  // ==========================================
  // 2. 个人习惯打卡与精力节奏大盘 (Habit & Rhythm Tracker)
  // ==========================================
  {
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
          { label: "近 30 天", value: "30" },
          { label: "近 90 天", value: "90" },
          { label: "近 180 天", value: "180" },
        ],
      },
    ],
    buildSql(params) {
      const keyword = (params.keyword as string) || "喝水"
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
    computeViewModel(rawRows, params) {
      const rows = (Array.isArray(rawRows[0]) ? rawRows[0] : rawRows) as ResultRow[]
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
      const { curStreak, maxStreak } = calculateStreak(dateMap, goal, todayIso)
      const todayVal = dateMap[todayIso] || 0
      const todayProgress = Math.min(100, Math.round((todayVal / goal) * 100))

      // 生成最近 daysCount 天序列
      const startDt = new Date()
      startDt.setDate(startDt.getDate() - daysCount + 1)
      const daySeq = generateDateRange(formatIsoDate(startDt), todayIso)
      const dailyVals = daySeq.map(d => dateMap[d] || 0)
      const ma7Vals = calculateMA7(dailyVals)

      // 期间达标率
      const recordedDays = daySeq.filter(d => (dateMap[d] || 0) > 0).length
      const reachedDays = daySeq.filter(d => (dateMap[d] || 0) >= goal).length
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
            categories: weekdayStats.map(w => w.label),
            values: weekdayStats.map(w => w.avg),
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
            dateValuePairs: daySeq.map(d => [d, dateMap[d] || 0]),
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
  },

  // ==========================================
  // 3. 知识库全景体检大盘 (Knowledge Base Health & Hub)
  // ==========================================
  {
    id: "kb-health",
    category: "assets",
    title: "知识库全景体检与脉络大盘",
    description: "一键盘活数字资产，宏观统计全库文档、双链、块数与孤鸟笔记，展示高反链知识核心主干与资产分布。",
    parameters: [
      {
        id: "hubLimit",
        label: "核心枢纽展示数量",
        type: "number",
        defaultValue: 10,
      },
    ],
    buildSql(params) {
      const limit = Number(params.hubLimit) || 10
      return `
        SELECT b.id, b.content, b.hpath, b.created, b.box,
               (SELECT count(*) FROM refs r WHERE r.def_block_root_id = b.id) AS backlinkCount
        FROM blocks b
        WHERE b.type = 'd'
        ORDER BY backlinkCount DESC
        LIMIT ${limit}
      `
    },
    computeViewModel(rawRows, params) {
      const rows = (Array.isArray(rawRows[0]) ? rawRows[0] : rawRows) as ResultRow[]

      // 宏观 KPI 指标卡
      const metrics: MetricCardModel[] = [
        {
          id: "docs_count",
          label: "文档总数",
          value: `${rows.length > 0 ? "已接入" : "0"}`,
          subText: "涵盖所有活动笔记本",
          accentColor: "var(--b3-theme-primary)",
        },
        {
          id: "top_hub_refs",
          label: "最高核心文档反链",
          value: `${rows[0]?.backlinkCount || 0} 次`,
          subText: rows[0] ? String(rows[0].content || "").slice(0, 16) : "暂无",
          accentColor: "#2fb36b",
        },
        {
          id: "avg_hub_refs",
          label: "核心 Top10 平均反链",
          value: `${Math.round(rows.reduce((acc, r) => acc + (Number(r.backlinkCount) || 0), 0) / (rows.length || 1))} 次`,
          subText: "全库知识主干密集度",
          accentColor: "#f2a33c",
        },
      ]

      // 核心枢纽文档柱状图
      const hubNames = rows.slice(0, 8).map(r => String(r.content || "未命名").slice(0, 12))
      const hubCounts = rows.slice(0, 8).map(r => Number(r.backlinkCount) || 0)

      const charts = [
        {
          id: "hubs_bar",
          type: "bar" as const,
          title: "核心枢纽文档 Top 8 (反链密度)",
          option: buildBarDistributionOption({
            title: "核心知识主干被引用频次",
            categories: hubNames.reverse(),
            values: hubCounts.reverse(),
            horizontal: true,
            accentColor: "var(--b3-theme-primary)",
          }),
        },
      ]

      const listItems = rows.map((r, i) => ({
        id: r.id,
        title: `${i + 1}. ${r.content || "未命名文档"}`,
        meta: [`${r.backlinkCount || 0} 次反链引用`, r.hpath || ""].filter(Boolean),
      }))

      return {
        id: "kb-health",
        title: "知识库全景体检与脉络大盘",
        category: "assets",
        description: "一键盘活数字资产，宏观统计全库文档、双链、块数与孤鸟笔记，展示高反链知识核心主干与资产分布。",
        parameters: params,
        metrics,
        charts,
        listItems,
      }
    },
  },

  // ==========================================
  // 4. 创作者写作热力与研读流转看板 (Writing Heatmap & Reading Flow)
  // ==========================================
  {
    id: "writing-flow",
    category: "creative",
    title: "创作者写作热力与研读流转看板",
    description: "提供 GitHub 贡献墙风格的写作日历热力图与阶段流转看板，推动文献与阅读材料从“在读”到“输出”。",
    parameters: [
      {
        id: "year",
        label: "统计年份",
        type: "text",
        defaultValue: String(new Date().getFullYear()),
        placeholder: "YYYY",
      },
    ],
    buildSql(params) {
      const year = params.year || String(new Date().getFullYear())
      return `
        SELECT b.id, b.content, b.hpath, b.created, b.updated, b.box,
               (SELECT a.value FROM attributes a WHERE a.block_id = b.id AND a.name = 'custom-status' LIMIT 1) AS status
        FROM blocks b
        WHERE b.type = 'd' AND b.created LIKE '${year}%'
        ORDER BY b.created DESC
        LIMIT 600
      `
    },
    computeViewModel(rawRows, params) {
      const rows = (Array.isArray(rawRows[0]) ? rawRows[0] : rawRows) as ResultRow[]
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
          count: rows.filter(r => !r.status || r.status === "Unread" || r.status === "待读").length,
          rows: rows.filter(r => !r.status || r.status === "Unread" || r.status === "待读").slice(0, 10),
        },
        {
          id: "in_progress",
          title: "精读研读中",
          count: rows.filter(r => r.status === "Reading" || r.status === "研读中").length,
          rows: rows.filter(r => r.status === "Reading" || r.status === "研读中").slice(0, 10),
        },
        {
          id: "output",
          title: "整理输出",
          count: rows.filter(r => r.status === "Output" || r.status === "输出").length,
          rows: rows.filter(r => r.status === "Output" || r.status === "输出").slice(0, 10),
        },
        {
          id: "archived",
          title: "已归纳",
          count: rows.filter(r => r.status === "Done" || r.status === "已完成").length,
          rows: rows.filter(r => r.status === "Done" || r.status === "已完成").slice(0, 10),
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
  },

  // ==========================================
  // 5. 敏捷项目与 OKR 目标交付看板 (Project & OKR Delivery Board)
  // ==========================================
  {
    id: "project-delivery",
    category: "project",
    title: "敏捷项目与 OKR 交付看板",
    description: "多项目并发推进者的一体化监控视角，将项目指标卡、优先级分布、阶段状态看板与临期高危清单结合。",
    parameters: [
      {
        id: "scope",
        label: "项目筛选范围",
        type: "text",
        defaultValue: "",
        placeholder: "如标签 #项目 或留空全量",
      },
    ],
    buildSql(params) {
      const tagClause = params.scope ? `AND b.tag LIKE '%${params.scope}%'` : ""
      return `
        SELECT b.id, b.content, b.hpath, b.updated, b.created, b.box,
               (SELECT a.value FROM attributes a WHERE a.block_id = b.id AND a.name = 'custom-status' LIMIT 1) AS status,
               (SELECT a.value FROM attributes a WHERE a.block_id = b.id AND a.name = 'custom-priority' LIMIT 1) AS priority,
               (SELECT a.value FROM attributes a WHERE a.block_id = b.id AND a.name = 'custom-due' LIMIT 1) AS dueDate
        FROM blocks b
        WHERE b.type = 'd' ${tagClause}
        ORDER BY b.updated DESC
        LIMIT 300
      `
    },
    computeViewModel(rawRows, params) {
      const rows = (Array.isArray(rawRows[0]) ? rawRows[0] : rawRows) as ResultRow[]

      const statusMap = {
        planning: rows.filter(r => !r.status || r.status === "Planning" || r.status === "规划中"),
        doing: rows.filter(r => r.status === "Doing" || r.status === "开发中" || r.status === "进行中"),
        testing: rows.filter(r => r.status === "Testing" || r.status === "测试中" || r.status === "验收"),
        done: rows.filter(r => r.status === "Done" || r.status === "已完成"),
      }

      const p0Count = rows.filter(r => r.priority === "P0" || r.priority === "紧急").length
      const p1Count = rows.filter(r => r.priority === "P1" || r.priority === "重要").length
      const p2Count = rows.filter(r => r.priority === "P2" || r.priority === "普通").length

      const metrics: MetricCardModel[] = [
        {
          id: "active_projects",
          label: "活跃推进项目",
          value: `${statusMap.doing.length} 项`,
          subText: `规划中 ${statusMap.planning.length} · 验收中 ${statusMap.testing.length}`,
          accentColor: "var(--b3-theme-primary)",
        },
        {
          id: "high_priority",
          label: "P0 紧急事项",
          value: `${p0Count} 项`,
          subText: p0Count > 0 ? "需最高关注" : "当前无高危阻塞",
          accentColor: p0Count > 0 ? "#ef4444" : "#2fb36b",
        },
        {
          id: "delivered",
          label: "已交付归档",
          value: `${statusMap.done.length} 项`,
          subText: `总计 ${rows.length} 项目标`,
          accentColor: "#2fb36b",
        },
      ]

      const charts = [
        {
          id: "priority_donut",
          type: "pie" as const,
          title: "项目优先级与紧急度构成",
          option: buildPieCompositionOption({
            title: "优先级构成分布",
            data: [
              { name: "P0 紧急", value: p0Count, color: "#ef4444" },
              { name: "P1 重要", value: p1Count, color: "#f2a33c" },
              { name: "P2 常规", value: p2Count, color: "var(--b3-theme-primary)" },
              { name: "未设置", value: rows.length - p0Count - p1Count - p2Count, color: "#9ca3af" },
            ].filter(d => d.value > 0),
            isDonut: true,
          }),
        },
      ]

      const boardColumns = [
        { id: "col_planning", title: "规划筹备", count: statusMap.planning.length, rows: statusMap.planning.slice(0, 8) },
        { id: "col_doing", title: "推进开发中", count: statusMap.doing.length, rows: statusMap.doing.slice(0, 8) },
        { id: "col_testing", title: "验收评审", count: statusMap.testing.length, rows: statusMap.testing.slice(0, 8) },
        { id: "col_done", title: "已完成交付", count: statusMap.done.length, rows: statusMap.done.slice(0, 8) },
      ]

      return {
        id: "project-delivery",
        title: "敏捷项目与 OKR 交付看板",
        category: "project",
        description: "多项目并发推进者的一体化监控视角，将项目指标卡、优先级分布、阶段状态看板与临期高危清单结合。",
        parameters: params,
        metrics,
        charts,
        boardColumns,
      }
    },
  },
]

export function getDashboardDefinition(id: string): DashboardDefinition | undefined {
  return SCENARIO_DASHBOARDS.find(d => d.id === id)
}
