import { createEmbedBlockMarkdown } from "@/core/embed"
import type {
  CompiledQuery,
  FieldMappings,
  ResultRow,
  ResultSet,
  ViewType,
} from "@/core/query/types"

interface KernelAdapter {
  sql(statement: string): Promise<Record<string, unknown>[]>
  setBlockAttrs(id: string, attrs: Record<string, string>): Promise<unknown>
  appendBlock(dataType: "markdown" | "dom", data: string, parentID: string): Promise<unknown>
}

function normalizeResultRow(row: Record<string, unknown>): ResultRow {
  const attrs: Record<string, string> = {}
  const result: ResultRow = {
    id: String(row.id || ""),
    content: String(row.content || ""),
    attrs,
  }

  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith("attr_")) {
      attrs[key.slice("attr_".length)] = value == null ? "" : String(value)
      continue
    }
    result[key] = value
  }

  return result
}

export function createQueryRuntime(adapter: KernelAdapter) {
  return {
    async execute(compiled: CompiledQuery): Promise<ResultSet> {
      const rows = await adapter.sql(compiled.sql)
      return {
        rows: rows.map(normalizeResultRow),
        total: rows.length,
        executedAt: new Date().toISOString(),
      }
    },
    async updateField(blockId: string, field: keyof FieldMappings, value: string, mappings: FieldMappings) {
      const attrKey = mappings[field]
      await adapter.setBlockAttrs(blockId, {
        [attrKey]: value,
      })
    },
    async insertEmbedBlock(payload: {
      parentID: string
      templateId: string
      viewId?: string
      title?: string
      viewType: ViewType
    }) {
      const markdown = createEmbedBlockMarkdown({
        templateId: payload.templateId,
        viewId: payload.viewId,
        title: payload.title,
        viewType: payload.viewType,
      })

      await adapter.appendBlock("markdown", markdown, payload.parentID)
    },
  }
}
