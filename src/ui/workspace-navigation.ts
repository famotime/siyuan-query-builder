import type { InjectionKey } from "vue"
import type { WorkspaceOpenMode } from "@/core/plugin-settings"

import { inject } from "vue"

/**
 * 工作台导航动作的注入契约。
 * 由 main.ts 在挂载 Dock 时提供,组件通过 inject 消费,
 * 避免组件直接 import @/main 的动作函数形成环依赖。
 */
export interface WorkspaceNavigationActions {
  openWorkspaceWithDashboard: (dashboardId?: string, openMode?: WorkspaceOpenMode) => Promise<void>
  openWorkspaceWithPreset: (snapshot: any, openMode?: WorkspaceOpenMode) => Promise<void>
  openWorkspaceWithTemplate: (templateId: string, openMode?: WorkspaceOpenMode) => Promise<void>
  openDashboardTab: (dashboardId: string) => Promise<void>
}

export const workspaceNavigationKey: InjectionKey<WorkspaceNavigationActions> = Symbol("workspace-navigation")

export function useWorkspaceNavigation(): WorkspaceNavigationActions {
  const actions = inject(workspaceNavigationKey)
  if (!actions) {
    throw new Error("Workspace navigation actions are not provided")
  }
  return actions
}
