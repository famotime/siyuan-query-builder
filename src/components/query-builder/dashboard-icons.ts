import { Flame, HeartPulse, LayoutDashboard, Target, TrendingUp } from "lucide-vue-next"

/**
 * 场景仪表板图标的单一映射来源(Dock 与 Sidebar 共用)。
 */
export function getDashboardIcon(id: string) {
  switch (id) {
    case "daily-cockpit":
      return LayoutDashboard
    case "habit-tracker":
      return Flame
    case "kb-health":
      return HeartPulse
    case "writing-flow":
      return TrendingUp
    case "project-delivery":
      return Target
    default:
      return LayoutDashboard
  }
}
