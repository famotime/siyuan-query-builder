import type { QueryBuilderSnapshot } from "./types"

export interface ValidationIssue {
  level: "error" | "warning"
  code: string
  message: string
  field?: string
}

function hasText(value: unknown) {
  return String(value || "").trim().length > 0
}

export function validateSnapshot(snapshot: QueryBuilderSnapshot): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const { template, view } = snapshot
  const statusField = `attr:${view.fieldMappings.status}`

  if (template.scope.type !== "all_blocks" && !hasText(template.scope.value)) {
    issues.push({
      level: "error",
      code: "scope-value-required",
      message: "当前范围类型需要填写范围值。",
      field: "scope.value",
    })
  }

  for (const filter of template.filters) {
    if (filter.operator === "date_between") {
      const range = Array.isArray(filter.value) ? filter.value : []
      if (!hasText(range[0]) || !hasText(range[1])) {
        issues.push({
          level: "error",
          code: "filter-date-range-incomplete",
          message: "日期区间条件需要同时填写开始和结束日期。",
          field: filter.id,
        })
      }
    }
  }

  if (template.aggregation && template.aggregation.function !== "count" && !hasText(template.aggregation.field)) {
    issues.push({
      level: "error",
      code: "aggregation-field-required",
      message: "当前统计函数需要指定统计字段。",
      field: "aggregation.field",
    })
  }

  const normalizedLimit = Math.trunc(Number(template.limit))
  if (template.limit != null && (!Number.isFinite(normalizedLimit) || normalizedLimit <= 0)) {
    issues.push({
      level: "error",
      code: "limit-invalid",
      message: "结果上限必须是大于 0 的整数。",
      field: "limit",
    })
  }

  if (view.type === "board" && !hasText(template.groupBy)) {
    issues.push({
      level: "error",
      code: "board-group-by-required",
      message: "看板视图需要设置分组字段。",
      field: "groupBy",
    })
  }

  if (view.type === "board" && hasText(template.groupBy) && template.groupBy !== statusField) {
    issues.push({
      level: "warning",
      code: "board-drag-writeback-disabled",
      message: "当前分组不支持拖拽回写，只有按状态分组时才能拖拽改状态。",
      field: "groupBy",
    })
  }

  if (!hasText(view.fieldMappings.status)) {
    issues.push({
      level: "warning",
      code: "field-mapping-status-missing",
      message: "状态属性名为空时，状态快速编辑和状态看板能力可能不可用。",
      field: "fieldMappings.status",
    })
  }

  if (!hasText(view.fieldMappings.dueDate)) {
    issues.push({
      level: "warning",
      code: "field-mapping-due-date-missing",
      message: "日期属性名为空时，日期快速编辑能力可能不可用。",
      field: "fieldMappings.dueDate",
    })
  }

  if (!hasText(view.fieldMappings.priority)) {
    issues.push({
      level: "warning",
      code: "field-mapping-priority-missing",
      message: "优先级属性名为空时，优先级快速编辑能力可能不可用。",
      field: "fieldMappings.priority",
    })
  }

  return issues
}
