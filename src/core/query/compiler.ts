import type {
  CompiledQuery,
  FieldId,
  QueryFilter,
  QueryScope,
  QuerySort,
  QueryTemplate,
} from "./types"

const BASE_FIELD_MAP: Record<string, string> = {
  id: "blocks.id",
  content: "blocks.content",
  box: "blocks.box",
  path: "blocks.path",
  root_id: "blocks.root_id",
  hpath: "blocks.hpath",
  type: "blocks.type",
  subtype: "blocks.subtype",
  tag: "blocks.tag",
  created: "blocks.created",
  updated: "blocks.updated",
}

function escapeSqlLiteral(value: string) {
  return value.replaceAll("'", "''")
}

function isAttrField(field: FieldId) {
  return field.startsWith("attr:")
}

function getAttrName(field: FieldId) {
  return field.slice("attr:".length)
}

function getFieldExpression(field: FieldId) {
  if (isAttrField(field)) {
    const attrName = escapeSqlLiteral(getAttrName(field))
    return `(SELECT value FROM attributes WHERE attributes.block_id = blocks.id AND attributes.name = '${attrName}' LIMIT 1)`
  }

  const expression = BASE_FIELD_MAP[field]
  if (!expression) {
    throw new Error(`Unsupported field: ${field}`)
  }
  return expression
}

function getFieldAlias(field: FieldId) {
  if (isAttrField(field)) {
    return `attr_${getAttrName(field).replaceAll(/[^a-zA-Z0-9_]/g, "_")}`
  }
  return field
}

function buildSelectFields(fields: FieldId[]) {
  const selected = ["blocks.id AS id", "blocks.content AS content"]
  const seen = new Set(["id", "content"])

  for (const field of fields) {
    const alias = getFieldAlias(field)
    if (seen.has(alias))
      continue

    selected.push(`${getFieldExpression(field)} AS ${alias}`)
    seen.add(alias)
  }

  return selected
}

function buildScopeClause(scope: QueryScope) {
  switch (scope.type) {
    case "all_blocks":
      return ""
    case "notebook":
      return `blocks.box = '${escapeSqlLiteral(scope.value || "")}'`
    case "document":
      return `blocks.root_id = '${escapeSqlLiteral(scope.value || "")}'`
    case "block_type":
      return `blocks.type = '${escapeSqlLiteral(scope.value || "")}'`
    case "tag":
      return `instr(blocks.tag, '${escapeSqlLiteral(scope.value || "")}') > 0`
    case "attribute":
      return `EXISTS (SELECT 1 FROM attributes WHERE attributes.block_id = blocks.id AND attributes.name = '${escapeSqlLiteral(scope.value || "")}')`
    default:
      return ""
  }
}

function buildDateRangeClause(fieldExpression: string, operator: "next_days" | "last_days", value: unknown) {
  const days = Number(value)
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error(`${operator} requires a positive day count`)
  }

  if (operator === "next_days") {
    return `date(${fieldExpression}) BETWEEN date('now') AND date('now', '+${days} day')`
  }

  return `date(${fieldExpression}) BETWEEN date('now', '-${days} day') AND date('now')`
}

function buildFilterClause(filter: QueryFilter) {
  const expression = getFieldExpression(filter.field)

  switch (filter.operator) {
    case "eq":
      return `${expression} = '${escapeSqlLiteral(String(filter.value || ""))}'`
    case "neq":
      return `COALESCE(${expression}, '') <> '${escapeSqlLiteral(String(filter.value || ""))}'`
    case "contains":
      return `instr(COALESCE(${expression}, ''), '${escapeSqlLiteral(String(filter.value || ""))}') > 0`
    case "not_contains":
      return `instr(COALESCE(${expression}, ''), '${escapeSqlLiteral(String(filter.value || ""))}') = 0`
    case "empty":
      return `COALESCE(${expression}, '') = ''`
    case "not_empty":
      return `COALESCE(${expression}, '') <> ''`
    case "date_between": {
      if (!Array.isArray(filter.value) || filter.value.length !== 2) {
        throw new Error("date_between requires a date range")
      }
      const [start, end] = filter.value
      return `date(${expression}) BETWEEN date('${escapeSqlLiteral(String(start))}') AND date('${escapeSqlLiteral(String(end))}')`
    }
    case "next_days":
    case "last_days":
      return buildDateRangeClause(expression, filter.operator, filter.value)
    default:
      throw new Error(`Unsupported operator: ${filter.operator satisfies never}`)
  }
}

function buildOrderClause(sorts: QuerySort[], groupBy?: FieldId) {
  const orderParts: string[] = []

  if (groupBy) {
    orderParts.push(`${getFieldExpression(groupBy)} ASC`)
  }

  for (const sort of sorts) {
    orderParts.push(`${getFieldExpression(sort.field)} ${sort.direction.toUpperCase()}`)
  }

  if (!orderParts.length) {
    orderParts.push("blocks.updated DESC")
  }

  return `ORDER BY ${orderParts.join(", ")}`
}

export function buildQuery(template: QueryTemplate): CompiledQuery {
  const selectFields = buildSelectFields(template.fields)
  const whereClauses = [
    "blocks.type != 'd'",
    buildScopeClause(template.scope),
    ...template.filters.map(buildFilterClause),
  ].filter(Boolean)

  const sql = [
    "SELECT",
    `  ${selectFields.join(",\n  ")}`,
    "FROM blocks",
    whereClauses.length ? `WHERE ${whereClauses.join("\n  AND ")}` : "",
    buildOrderClause(template.sorts, template.groupBy),
    "LIMIT 200",
  ].filter(Boolean).join("\n")

  return {
    sql,
    meta: {
      selectedFields: template.fields,
      groupBy: template.groupBy,
    },
  }
}
