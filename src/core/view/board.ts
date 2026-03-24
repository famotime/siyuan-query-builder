import type { FieldId, ResultRow } from "@/core/query/types"

export interface BoardColumn {
  id: string
  title: string
  rows: ResultRow[]
}

interface BoardValueFormatter {
  (row: ResultRow, field: FieldId, rawValue: string): string
}

function getFieldValue(row: ResultRow, field: FieldId) {
  if (field.startsWith("attr:")) {
    return row.attrs[field.slice("attr:".length)] || ""
  }

  const value = row[field]
  return typeof value === "string" ? value : ""
}

export function buildBoardColumns(
  rows: ResultRow[],
  groupBy: FieldId,
  formatValue?: BoardValueFormatter,
): BoardColumn[] {
  const columns = new Map<string, BoardColumn>()
  const ungroupedId = "__ungrouped__"

  for (const row of rows) {
    const rawValue = getFieldValue(row, groupBy).trim()
    const columnId = rawValue || ungroupedId
    const displayValue = rawValue
      ? (formatValue?.(row, groupBy, rawValue) || rawValue)
      : "未分组"
    if (!columns.has(columnId)) {
      columns.set(columnId, {
        id: columnId,
        title: displayValue,
        rows: [],
      })
    }
    columns.get(columnId)!.rows.push(row)
  }

  return [...columns.values()]
}
