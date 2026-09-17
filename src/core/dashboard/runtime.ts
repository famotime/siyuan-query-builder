import type { FieldMappings, ResultRow } from "@/core/query/types"
import type { KernelAdapter } from "@/core/runtime/kernel-adapter"
import type { DashboardViewModel } from "./types"
import { getDashboardDefinition } from "./catalog"

export interface DashboardRuntimeOptions {
  kernelAdapter: KernelAdapter
  fieldMappings?: FieldMappings
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

  const mappings = options.fieldMappings || {
    status: "status",
    dueDate: "due",
    priority: "priority",
    project: "project",
    owner: "owner",
  }

  const sqlQuery = def.buildSql(parameters, mappings)
  let rawRows: ResultRow[] = []

  if (typeof sqlQuery === "string") {
    rawRows = await options.kernelAdapter.sql(sqlQuery)
  } else if (Array.isArray(sqlQuery)) {
    const results = await Promise.all(sqlQuery.map(q => options.kernelAdapter.sql(q)))
    return def.computeViewModel(results, parameters, mappings)
  }

  return def.computeViewModel(rawRows, parameters, mappings)
}
