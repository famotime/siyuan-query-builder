import type { Ref } from "vue"
import type { DashboardViewModel } from "@/core/dashboard/types"

import type { QueryBuilderSnapshot } from "@/core/query/types"
import {
  reactive,
  ref,
} from "vue"
import {
  getDashboardDefinition,
  resolveDashboardParamDefault,
  SCENARIO_DASHBOARDS,
} from "@/core/dashboard/catalog"
import { executeDashboard } from "@/core/dashboard/runtime"
import { kernelAdapter } from "@/core/runtime/kernel-adapter"

interface TemplateViewsPort {
  saveTemplate: () => Promise<void>
}

interface QueryBuilderDashboardControllerOptions {
  draft: QueryBuilderSnapshot
  advancedMode: Ref<boolean>
  advancedSql: Ref<string>
  templateViews: TemplateViewsPort
}

export function createQueryBuilderDashboardController(options: QueryBuilderDashboardControllerOptions) {
  const {
    draft,
    advancedMode,
    advancedSql,
    templateViews,
  } = options

  const dashboards = ref(SCENARIO_DASHBOARDS)
  const activeDashboardId = ref<string | null>(null)
  const activeDashboardParams = reactive<Record<string, any>>({})
  const activeDashboardViewModel = ref<DashboardViewModel | null>(null)
  const activeDashboardLoading = ref(false)

  async function runActiveDashboard() {
    if (!activeDashboardId.value) return
    activeDashboardLoading.value = true
    try {
      const vm = await executeDashboard(activeDashboardId.value, activeDashboardParams, {
        kernelAdapter,
      })
      activeDashboardViewModel.value = vm
    } catch (err) {
      console.error("[SQB] execute dashboard failed", err)
    } finally {
      activeDashboardLoading.value = false
    }
  }

  async function loadDashboard(id: string) {
    const def = getDashboardDefinition(id)
    if (!def) return
    activeDashboardId.value = id
    for (const k of Object.keys(activeDashboardParams)) {
      delete activeDashboardParams[k]
    }
    for (const p of def.parameters) {
      // 惰性默认值在加载时求值,保证跨日/跨年长会话中的月份/年份默认值仍然有效
      activeDashboardParams[p.id] = resolveDashboardParamDefault(p)
    }
    await runActiveDashboard()
  }

  function updateDashboardParam(key: string, val: any) {
    activeDashboardParams[key] = val
    void runActiveDashboard()
  }

  function closeDashboard() {
    activeDashboardId.value = null
    activeDashboardViewModel.value = null
  }

  async function saveDashboardAsTemplate() {
    if (!activeDashboardViewModel.value || !activeDashboardId.value) return
    const def = getDashboardDefinition(activeDashboardId.value)
    if (!def) return
    const sql = def.buildSql(activeDashboardParams)
    const sqlStr = typeof sql === "string" ? sql : sql[0]
    activeDashboardId.value = null
    activeDashboardViewModel.value = null
    advancedMode.value = true
    advancedSql.value = sqlStr
    draft.template.name = `${def.title} (定制)`
    draft.template.viewType = "dashboard"
    await templateViews.saveTemplate()
  }

  return {
    dashboards,
    activeDashboardId,
    activeDashboardParams,
    activeDashboardViewModel,
    activeDashboardLoading,
    loadDashboard,
    runActiveDashboard,
    updateDashboardParam,
    closeDashboard,
    saveDashboardAsTemplate,
  }
}
