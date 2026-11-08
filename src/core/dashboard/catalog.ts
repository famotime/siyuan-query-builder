import type {
  DashboardDefinition,
  DashboardParameterDefinition,
} from "./types"
import { dailyCockpitDashboard } from "./scenarios/daily-cockpit"
import { habitTrackerDashboard } from "./scenarios/habit-tracker"
import { kbHealthDashboard } from "./scenarios/kb-health"
import { projectDeliveryDashboard } from "./scenarios/project-delivery"
import { writingFlowDashboard } from "./scenarios/writing-flow"

/**
 * 预置 5 大开箱即用场景化仪表板
 */
export const SCENARIO_DASHBOARDS: DashboardDefinition[] = [
  dailyCockpitDashboard,
  habitTrackerDashboard,
  kbHealthDashboard,
  writingFlowDashboard,
  projectDeliveryDashboard,
]

export function getDashboardDefinition(id: string): DashboardDefinition | undefined {
  return SCENARIO_DASHBOARDS.find((d) => d.id === id)
}

/**
 * 解析参数默认值:惰性函数在调用时求值,保证长会话中月份/年份默认值跟随当前时间。
 */
export function resolveDashboardParamDefault(param: DashboardParameterDefinition): string | number {
  return typeof param.defaultValue === "function" ? param.defaultValue() : param.defaultValue
}
