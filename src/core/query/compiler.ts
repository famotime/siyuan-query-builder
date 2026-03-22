import type {
  CompiledQuery,
  FieldId,
  QueryAggregation,
  QueryFilter,
  QueryScope,
  QuerySort,
  QueryTemplate,
} from "./types"
import { AGGREGATE_VALUE_FIELD, TAG_COUNT_FIELD } from "./catalog"

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

function isAggregateValueField(field: FieldId) {
  return field === AGGREGATE_VALUE_FIELD
}

function getAttrName(field: FieldId) {
  return field.slice("attr:".length)
}

function getFieldExpression(field: FieldId) {
  if (field === TAG_COUNT_FIELD) {
    return "(length(COALESCE(blocks.tag, '')) - length(replace(COALESCE(blocks.tag, ''), '#', ''))) / 2"
  }

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
  if (isAggregateValueField(field)) {
    return "agg_value"
  }
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

function normalizeLimit(limit?: number) {
  if (limit == null) {
    return 200
  }

  const normalized = Math.trunc(Number(limit))
  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error("limit requires a positive integer")
  }

  return normalized
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

function buildFiltersClause(filters: QueryFilter[]) {
  if (!filters.length) {
    return ""
  }

  let clause = buildFilterClause(filters[0]!)

  for (let index = 1; index < filters.length; index += 1) {
    const filter = filters[index]!
    const operator = filter.condition === "or" ? "OR" : "AND"
    clause = `(${clause} ${operator} ${buildFilterClause(filter)})`
  }

  return clause
}

function buildAggregationExpression(aggregation: QueryAggregation) {
  switch (aggregation.function) {
    case "count":
      return "COUNT(*)"
    case "sum":
    case "avg":
    case "min":
    case "max":
      if (!aggregation.field) {
        throw new Error(`${aggregation.function} requires a field`)
      }
      return `${aggregation.function.toUpperCase()}(${getFieldExpression(aggregation.field)})`
    default:
      throw new Error(`Unsupported aggregation: ${aggregation.function satisfies never}`)
  }
}

function buildGroupClause(groupBy?: FieldId) {
  if (!groupBy) {
    return ""
  }

  return `GROUP BY ${getFieldExpression(groupBy)}`
}

function buildAggregateSelectFields(template: QueryTemplate, aggregation: QueryAggregation) {
  const selected: string[] = []

  if (template.groupBy) {
    const groupExpression = getFieldExpression(template.groupBy)
    const groupAlias = getFieldAlias(template.groupBy)
    selected.push(`COALESCE(CAST(${groupExpression} AS TEXT), '') AS id`)
    selected.push(`COALESCE(CAST(${groupExpression} AS TEXT), '') AS content`)
    if (!["id", "content"].includes(groupAlias)) {
      selected.push(`${groupExpression} AS ${groupAlias}`)
    }
  } else {
    selected.push("'aggregate-row' AS id")
    selected.push("'统计结果' AS content")
  }

  selected.push(`${buildAggregationExpression(aggregation)} AS ${getFieldAlias(AGGREGATE_VALUE_FIELD)}`)
  return selected
}

function getOrderExpression(field: FieldId) {
  if (isAggregateValueField(field) || field === TAG_COUNT_FIELD) {
    return getFieldAlias(field)
  }

  return getFieldExpression(field)
}

function buildOrderClause(sorts: QuerySort[], groupBy?: FieldId, aggregation?: QueryAggregation) {
  const orderParts: string[] = []

  if (groupBy && !aggregation) {
    orderParts.push(`${getFieldExpression(groupBy)} ASC`)
  }

  for (const sort of sorts) {
    orderParts.push(`${getOrderExpression(sort.field)} ${sort.direction.toUpperCase()}`)
  }

  if (!orderParts.length) {
    if (aggregation) {
      orderParts.push(`${getFieldAlias(AGGREGATE_VALUE_FIELD)} DESC`)
    } else {
      orderParts.push("blocks.updated DESC")
    }
  }

  return `ORDER BY ${orderParts.join(", ")}`
}

export function buildQuery(template: QueryTemplate): CompiledQuery {
  const aggregation = template.aggregation
  const selectFields = aggregation
    ? buildAggregateSelectFields(template, aggregation)
    : buildSelectFields(template.fields)
  const whereClauses = [
    template.scope.type === "block_type" && template.scope.value === "d" ? "" : "blocks.type != 'd'",
    buildScopeClause(template.scope),
    buildFiltersClause(template.filters),
  ].filter(Boolean)
  const limit = normalizeLimit(template.limit)

  const sql = [
    "SELECT",
    `  ${selectFields.join(",\n  ")}`,
    "FROM blocks",
    whereClauses.length ? `WHERE ${whereClauses.join("\n  AND ")}` : "",
    aggregation ? buildGroupClause(template.groupBy) : "",
    buildOrderClause(template.sorts, template.groupBy, aggregation),
    `LIMIT ${limit}`,
  ].filter(Boolean).join("\n")

  return {
    sql,
    meta: {
      selectedFields: template.fields,
      groupBy: template.groupBy,
      aggregation,
    },
  }
}
