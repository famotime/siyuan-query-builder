import { createFieldOptions } from "@/core/query/catalog"
import type { FieldId, FieldMappings, ResultRow } from "@/core/query/types"
import { buildBoardColumns } from "@/core/view/board"
import { buildCardsSummary, buildListItems } from "@/inline/view-models"

interface CreateResultPresentationOptions {
  fieldMappings: FieldMappings
  notebookNameById?: Record<string, string>
}

function formatSiyuanTimestamp(value: unknown) {
  const text = String(value ?? "").trim()
  if (/^\d{14}$/.test(text)) {
    return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)} ${text.slice(8, 10)}:${text.slice(10, 12)}:${text.slice(12, 14)}`
  }
  if (/^\d{8}$/.test(text)) {
    return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`
  }
  return text
}

function formatBlockType(value: unknown) {
  switch (String(value ?? "").trim()) {
    case "d":
      return "文档"
    case "h":
      return "标题"
    case "i":
      return "列表项"
    case "l":
      return "列表"
    case "p":
      return "段落"
    case "t":
      return "表格"
    default:
      return String(value ?? "")
  }
}

function createKnownLabels(fieldMappings: FieldMappings) {
  return new Map(
    createFieldOptions(fieldMappings).map(option => [option.value, option.label]),
  )
}

export function resolveResultFieldLabel(field: string, options: {
  fieldMappings: FieldMappings
  knownLabels?: Map<string, string> | Record<string, string>
}) {
  const knownLabel = options.knownLabels instanceof Map
    ? options.knownLabels.get(field)
    : options.knownLabels?.[field]

  if (knownLabel) {
    return knownLabel
  }

  if (field.startsWith("attr:")) {
    const attrName = field.slice("attr:".length).trim()
    if (!attrName) {
      return "属性"
    }

    const mappedLabel = Object.entries(options.fieldMappings).find(([, value]) => value === attrName)?.[0]
    if (mappedLabel) {
      switch (mappedLabel) {
        case "status":
          return "状态"
        case "dueDate":
          return "截止日期"
        case "priority":
          return "优先级"
        case "project":
          return "项目"
        case "owner":
          return "负责人"
      }
    }

    return `属性：${attrName}`
  }

  return field
}

export function formatResultValue(row: ResultRow, field: string, options: {
  notebookNameById?: Record<string, string>
} = {}) {
  if (field === "agg:value") {
    return String(row.agg_value ?? "")
  }
  if (field.startsWith("attr:")) {
    return row.attrs[field.slice("attr:".length)] || ""
  }
  if (field === "created" || field === "updated") {
    return formatSiyuanTimestamp(row[field])
  }
  if (field === "box") {
    const boxId = String(row[field] ?? "")
    return options.notebookNameById?.[boxId] || boxId
  }
  if (field === "path") {
    return String(row.hpath ?? row[field] ?? "")
  }
  if (field === "type") {
    return formatBlockType(row[field])
  }
  return String(row[field] ?? "")
}

export function createResultPresentation(options: CreateResultPresentationOptions) {
  const knownLabels = createKnownLabels(options.fieldMappings)

  return {
    buildBoardColumns(rows: ResultRow[], groupBy: FieldId) {
      return buildBoardColumns(rows, groupBy, (row, field) => formatResultValue(row, field, {
        notebookNameById: options.notebookNameById,
      }))
    },
    buildCardsSummary(rows: ResultRow[], groupField: FieldId) {
      return buildCardsSummary(rows, groupField, (row, field) => formatResultValue(row, field, {
        notebookNameById: options.notebookNameById,
      }))
    },
    buildListItems(rows: ResultRow[], metaFields: FieldId[]) {
      return buildListItems(rows, metaFields, (row, field) => formatResultValue(row, field, {
        notebookNameById: options.notebookNameById,
      }))
    },
    displayValue(row: ResultRow, field: string) {
      return formatResultValue(row, field, {
        notebookNameById: options.notebookNameById,
      })
    },
    fieldLabel(field: string) {
      return resolveResultFieldLabel(field, {
        knownLabels,
        fieldMappings: options.fieldMappings,
      })
    },
    knownLabels,
    notebookNameById: options.notebookNameById || {},
  }
}

export type ResultPresentation = ReturnType<typeof createResultPresentation>
export type ResultPresentationField = FieldId
