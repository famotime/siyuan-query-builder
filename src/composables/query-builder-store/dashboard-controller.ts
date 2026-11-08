import { reactive, ref } from "vue"
import type { Ref } from "vue"

import { SCENARIO_DASHBOARDS, getDashboardDefinition } from "@/core/dashboard/catalog"
import { executeDashboard } from "@/core/dashboard/runtime"
import type { DashboardViewModel } from "@/core/dashboard/types"
import { kernelAdapter } from "@/core/runtime/kernel-adapter"
import type { QueryBuilderSnapshot } from "@/core/query/types"

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
  const { draft, advancedMode, advancedSql, templateViews } = options

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
      activeDashboardParams[p.id] = p.defaultValue
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
