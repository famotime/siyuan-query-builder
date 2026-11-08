import type { CalendarTaskItem } from "@/core/dashboard/types"
import type { ResultRow } from "@/core/query/types"
import {
  parseDateFromHPath,
  parseTaskStatus,
} from "@/core/dashboard/calculator"
import { buildBarDistributionOption } from "@/core/view/chart"

/**
 * 面板(QueryBuilderResults)与内联组件(InlineQueryWidget)共享的任务条目构建规则。
 */
export function buildCalendarTaskItems(rows: ResultRow[] | null | undefined): CalendarTaskItem[] {
  if (!rows?.length) {
    return []
  }
  return rows.map((r) => {
    const text = String(r.markdown || r.content || "")
    const status = parseTaskStatus(text)
    const date = parseDateFromHPath(String(r.hpath || "")) || String(r.created || "").slice(0, 8).replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3")
    return {
      id: r.id,
      content: text.replace(/^\[[^\]]*\]\s*/, "").trim() || "未命名块",
      status,
      date,
      docTitle: r.hpath ? String(r.hpath).split("/").pop() : undefined,
      docId: r.root_id == null ? undefined : String(r.root_id),
    }
  })
}

/**
 * 分组分布图 option 的统一构建规则:
 * - 有基础标题时统一为 `${title} - 分组统计`,无标题时为 "统计图表";
 * - 汇总卡片多于 1 张(首张为总数卡)时按分组条目绘制,否则回退为"总结果数"单柱。
 */
export function buildGroupDistributionChartOption(params: {
  title: string
  summary: Array<{ label: string, value: string | number }> | null | undefined
  totalRows: number
}): Record<string, any> {
  const summary = params.summary || []
  const title = params.title ? `${params.title} - 分组统计` : "统计图表"

  if (summary.length > 1) {
    return buildBarDistributionOption({
      title,
      categories: summary.slice(1).map((c) => c.label),
      values: summary.slice(1).map((c) => Number(c.value) || 0),
    })
  }

  return buildBarDistributionOption({
    title,
    categories: ["总结果数"],
    values: [params.totalRows],
  })
}
