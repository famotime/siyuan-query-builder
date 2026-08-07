import type {
  CompiledQuery,
  FieldId,
  QueryAggregation,
  QueryFilter,
  QueryScope,
  QuerySort,
  QueryTemplate,
} from "./types"
import { AGGREGATE_VALUE_FIELD, ASSET_COUNT_FIELD, BACKLINK_COUNT_FIELD, LINK_COUNT_FIELD, OUT_LINK_COUNT_FIELD, TAG_COUNT_FIELD, TEXT_LENGTH_FIELD } from "./catalog"
import { CUSTOM_ATTR_PREFIX, toStorageAttrName } from "./attributes"

const BASE_FIELD_MAP: Record<string, string> = {
  id: "blocks.id",
  content: "blocks.content",
  box: "blocks.box",
  path: "COALESCE(blocks.hpath, blocks.path)",
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

function isSiyuanTimestampField(field: FieldId) {
  return field === "created" || field === "updated"
}

function getDateComparableExpression(field: FieldId, fieldExpression: string) {
  if (isSiyuanTimestampField(field)) {
    return `substr(${fieldExpression}, 1, 8)`
  }

  return `date(${fieldExpression})`
}

function getFieldExpression(field: FieldId) {
  if (field === TAG_COUNT_FIELD) {
    return "(length(COALESCE(blocks.tag, '')) - length(replace(COALESCE(blocks.tag, ''), '#', ''))) / 2"
  }

  if (field === TEXT_LENGTH_FIELD) {
    return "blocks.length"
  }

  if (field === BACKLINK_COUNT_FIELD) {
    return `(SELECT COUNT(DISTINCT refs.root_id) FROM refs WHERE refs.def_block_root_id = blocks.id AND refs.root_id <> '' AND refs.root_id <> blocks.id)`
  }

  if (field === ASSET_COUNT_FIELD) {
    return "(SELECT COUNT(DISTINCT assets.path) FROM assets WHERE assets.root_id = blocks.id)"
  }

  if (field === OUT_LINK_COUNT_FIELD) {
    return `(SELECT COUNT(DISTINCT refs.def_block_root_id) FROM refs WHERE refs.root_id = blocks.id AND refs.def_block_root_id <> '' AND refs.def_block_root_id <> blocks.id)`
  }

  if (field === LINK_COUNT_FIELD) {
    return `(${getFieldExpression(BACKLINK_COUNT_FIELD)} + ${getFieldExpression(OUT_LINK_COUNT_FIELD)})`
  }

  if (isAttrField(field)) {
    const attrName = escapeSqlLiteral(toStorageAttrName(getAttrName(field)))
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
    return 100
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
    case "attribute": {
      const attrName = String(scope.value || "").trim()
      if (!attrName) {
        return `EXISTS (SELECT 1 FROM attributes WHERE attributes.block_id = blocks.id AND attributes.name LIKE '${escapeSqlLiteral(CUSTOM_ATTR_PREFIX)}%')`
      }
      return `EXISTS (SELECT 1 FROM attributes WHERE attributes.block_id = blocks.id AND attributes.name = '${escapeSqlLiteral(toStorageAttrName(attrName))}')`
    }
    default:
      return ""
  }
}

function buildDateRangeClause(field: FieldId, fieldExpression: string, operator: "next_days" | "last_days", value: unknown) {
  const days = Number(value)
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error(`${operator} requires a positive day count`)
  }

  const comparableExpression = getDateComparableExpression(field, fieldExpression)

  if (isSiyuanTimestampField(field)) {
    if (operator === "next_days") {
      return `${comparableExpression} BETWEEN strftime('%Y%m%d', 'now') AND strftime('%Y%m%d', 'now', '+${days} day')`
    }

    return `${comparableExpression} BETWEEN strftime('%Y%m%d', 'now', '-${days} day') AND strftime('%Y%m%d', 'now')`
  }

  if (operator === "next_days") {
    return `${comparableExpression} BETWEEN date('now') AND date('now', '+${days} day')`
  }

  return `${comparableExpression} BETWEEN date('now', '-${days} day') AND date('now')`
}

function buildFilterClause(filter: QueryFilter) {
  const expression = getFieldExpression(filter.field)

  switch (filter.operator) {
    case "eq":
      return `${expression} = '${escapeSqlLiteral(String(filter.value || ""))}'`
    case "neq":
      return `COALESCE(${expression}, '') <> '${escapeSqlLiteral(String(filter.value || ""))}'`
    case "gt": {
      const number = Number(filter.value)
      if (!Number.isFinite(number)) {
        throw new Error("gt requires a numeric value")
      }
      return `CAST(COALESCE(${expression}, 0) AS REAL) > ${number}`
    }
    case "lt": {
      const number = Number(filter.value)
      if (!Number.isFinite(number)) {
        throw new Error("lt requires a numeric value")
      }
      return `CAST(COALESCE(${expression}, 0) AS REAL) < ${number}`
    }
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
      if (isSiyuanTimestampField(filter.field)) {
        return `${getDateComparableExpression(filter.field, expression)} BETWEEN replace('${escapeSqlLiteral(String(start))}', '-', '') AND replace('${escapeSqlLiteral(String(end))}', '-', '')`
      }
      return `${getDateComparableExpression(filter.field, expression)} BETWEEN date('${escapeSqlLiteral(String(start))}') AND date('${escapeSqlLiteral(String(end))}')`
    }
    case "next_days":
    case "last_days":
      return buildDateRangeClause(filter.field, expression, filter.operator, filter.value)
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

const RANDOM_FIELD = "random"

function getOrderExpression(field: FieldId) {
  if (field === RANDOM_FIELD) {
    return "RANDOM()"
  }

  if (isAggregateValueField(field) || field === TAG_COUNT_FIELD || field === ASSET_COUNT_FIELD || field === TEXT_LENGTH_FIELD) {
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
    if (sort.direction === "random") {
      orderParts.push("RANDOM()")
    } else {
      orderParts.push(`${getOrderExpression(sort.field)} ${sort.direction.toUpperCase()}`)
    }
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
