import type {
  DashboardDefinition,
  DashboardViewModel,
  MetricCardModel,
} from "../types"
import type { ResultRow } from "@/core/query/types"
import { buildPieCompositionOption } from "@/core/view/chart"
import { escapeSqlLiteral } from "../calculator"

export interface ProjectDeliveryParams {
  scope?: string
}

export const projectDeliveryDashboard: DashboardDefinition = {
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
  buildSql(params: ProjectDeliveryParams) {
    const tagClause = params.scope ? `AND b.tag LIKE '%${escapeSqlLiteral(params.scope)}%'` : ""
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
  computeViewModel(rows: ResultRow[], params: ProjectDeliveryParams): DashboardViewModel {
    const statusMap = {
      planning: rows.filter((r) => !r.status || r.status === "Planning" || r.status === "规划中"),
      doing: rows.filter((r) => r.status === "Doing" || r.status === "开发中" || r.status === "进行中"),
      testing: rows.filter((r) => r.status === "Testing" || r.status === "测试中" || r.status === "验收"),
      done: rows.filter((r) => r.status === "Done" || r.status === "已完成"),
    }

    const p0Count = rows.filter((r) => r.priority === "P0" || r.priority === "紧急").length
    const p1Count = rows.filter((r) => r.priority === "P1" || r.priority === "重要").length
    const p2Count = rows.filter((r) => r.priority === "P2" || r.priority === "普通").length

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
            {
              name: "P0 紧急",
              value: p0Count,
              color: "#ef4444",
            },
            {
              name: "P1 重要",
              value: p1Count,
              color: "#f2a33c",
            },
            {
              name: "P2 常规",
              value: p2Count,
              color: "var(--b3-theme-primary)",
            },
            {
              name: "未设置",
              value: rows.length - p0Count - p1Count - p2Count,
              color: "#9ca3af",
            },
          ].filter((d) => d.value > 0),
          isDonut: true,
        }),
      },
    ]

    const boardColumns = [
      {
        id: "col_planning",
        title: "规划筹备",
        count: statusMap.planning.length,
        rows: statusMap.planning.slice(0, 8),
      },
      {
        id: "col_doing",
        title: "推进开发中",
        count: statusMap.doing.length,
        rows: statusMap.doing.slice(0, 8),
      },
      {
        id: "col_testing",
        title: "验收评审",
        count: statusMap.testing.length,
        rows: statusMap.testing.slice(0, 8),
      },
      {
        id: "col_done",
        title: "已完成交付",
        count: statusMap.done.length,
        rows: statusMap.done.slice(0, 8),
      },
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
}
