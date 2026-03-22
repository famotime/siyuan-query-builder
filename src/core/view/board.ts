import type { FieldId, ResultRow } from "@/core/query/types"

export interface BoardColumn {
  id: string
  title: string
  rows: ResultRow[]
}

function getFieldValue(row: ResultRow, field: FieldId) {
  if (field.startsWith("attr:")) {
    return row.attrs[field.slice("attr:".length)] || ""
  }

  const value = row[field]
  return typeof value === "string" ? value : ""
}

export function buildBoardColumns(rows: ResultRow[], groupBy: FieldId): BoardColumn[] {
  const columns = new Map<string, BoardColumn>()
  const ungroupedId = "__ungrouped__"

  for (const row of rows) {
    const rawValue = getFieldValue(row, groupBy).trim()
    const columnId = rawValue || ungroupedId
    if (!columns.has(columnId)) {
      columns.set(columnId, {
        id: columnId,
        title: rawValue || "未分组",
        rows: [],
      })
    }
    columns.get(columnId)!.rows.push(row)
  }

  return [...columns.values()]
}
