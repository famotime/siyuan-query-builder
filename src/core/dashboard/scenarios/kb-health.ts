import type {
  DashboardDefinition,
  DashboardViewModel,
  MetricCardModel,
} from "../types"
import type { ResultRow } from "@/core/query/types"
import { buildBarDistributionOption } from "@/core/view/chart"

export interface KbHealthParams {
  hubLimit?: number
}

export const kbHealthDashboard: DashboardDefinition = {
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
  buildSql(params: KbHealthParams) {
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
  computeViewModel(rows: ResultRow[], params: KbHealthParams): DashboardViewModel {
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
    const hubNames = rows.slice(0, 8).map((r) => String(r.content || "未命名").slice(0, 12))
    const hubCounts = rows.slice(0, 8).map((r) => Number(r.backlinkCount) || 0)

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
      meta: [`${r.backlinkCount || 0} 次反链引用`, r.hpath ? String(r.hpath) : ""].filter(Boolean),
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
}
