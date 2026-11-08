import type { ResultRow } from "@/core/query/types"
import type { KernelAdapter } from "@/core/runtime/kernel-adapter"
import type { DashboardViewModel } from "./types"
import { getDashboardDefinition } from "./catalog"

export interface DashboardRuntimeOptions {
  kernelAdapter: KernelAdapter
}

export async function executeDashboard(
  dashboardId: string,
  parameters: Record<string, any>,
  options: DashboardRuntimeOptions,
): Promise<DashboardViewModel> {
  const def = getDashboardDefinition(dashboardId)
  if (!def) {
    throw new Error(`未找到仪表板定义: ${dashboardId}`)
  }

  const sqlQuery = def.buildSql(parameters)

  if (typeof sqlQuery === "string") {
    const rows = await options.kernelAdapter.sql(sqlQuery)
    return def.computeViewModel(rows, parameters)
  }

  // 多条 SQL:并发执行后归一为扁平 rows 再交给场景计算
  const results = await Promise.all(sqlQuery.map(q => options.kernelAdapter.sql(q)))
  return def.computeViewModel(results.flat() as ResultRow[], parameters)
}
