import type { FieldId, ResultRow } from "@/core/query/types"

export interface SummaryCard {
  label: string
  value: string
}

export interface ListItemModel {
  id: string
  title: string
  meta: string[]
}

interface ResultValueFormatter {
  (row: ResultRow, field: FieldId, rawValue: string): string
}

function fieldValue(row: ResultRow, field: FieldId) {
  if (field.startsWith("attr:")) {
    return row.attrs[field.slice("attr:".length)] || ""
  }
  return typeof row[field] === "string" ? String(row[field]) : ""
}

export function buildCardsSummary(
  rows: ResultRow[],
  groupField: FieldId,
  formatValue?: ResultValueFormatter,
): SummaryCard[] {
  const groups = new Map<string, number>()

  for (const row of rows) {
    const rawValue = fieldValue(row, groupField)
    const value = rawValue
      ? (formatValue?.(row, groupField, rawValue) || rawValue)
      : "未设置"
    groups.set(value, (groups.get(value) || 0) + 1)
  }

  return [
    { label: "总结果", value: String(rows.length) },
    ...[...groups.entries()].map(([label, count]) => ({
      label,
      value: String(count),
    })),
  ]
}

export function buildListItems(
  rows: ResultRow[],
  metaFields: FieldId[],
  formatValue?: ResultValueFormatter,
): ListItemModel[] {
  return rows.map(row => ({
    id: row.id,
    title: row.content,
    meta: metaFields
      .map((field) => {
        const rawValue = fieldValue(row, field)
        if (!rawValue) {
          return ""
        }
        return formatValue?.(row, field, rawValue) || rawValue
      })
      .filter(Boolean),
  }))
}
