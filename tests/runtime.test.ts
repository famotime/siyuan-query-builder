import { describe, expect, it } from "vitest"

import { createQueryRuntime } from "@/core/runtime/query-runtime"
import type { CompiledQuery, FieldMappings } from "@/core/query/types"

class FakeKernelAdapter {
  public lastSql = ""
  public attrUpdates: Array<{ id: string, attrs: Record<string, string> }> = []
  public appendedBlocks: Array<{ dataType: "markdown" | "dom", data: string, parentID: string }> = []

  async sql(statement: string) {
    this.lastSql = statement
    return [
      {
        id: "block-1",
        content: "Implement query builder",
        attr_status: "Doing",
        attr_dueDate: "2026-03-24",
      },
    ]
  }

  async setBlockAttrs(id: string, attrs: Record<string, string>) {
    this.attrUpdates.push({ id, attrs })
  }

  async appendBlock(dataType: "markdown" | "dom", data: string, parentID: string) {
    this.appendedBlocks.push({ dataType, data, parentID })
  }
}

describe("createQueryRuntime", () => {
  const mappings: FieldMappings = {
    status: "status",
    dueDate: "dueDate",
    priority: "priority",
    project: "project",
    owner: "owner",
  }

  it("executes compiled SQL and normalizes attribute aliases into attrs", async () => {
    const adapter = new FakeKernelAdapter()
    const runtime = createQueryRuntime(adapter)
    const compiled: CompiledQuery = {
      sql: "SELECT * FROM blocks LIMIT 1",
      meta: {
        selectedFields: ["content", "attr:status", "attr:dueDate"],
      },
    }

    const result = await runtime.execute(compiled)

    expect(adapter.lastSql).toBe(compiled.sql)
    expect(result.rows[0]?.attrs.status).toBe("Doing")
    expect(result.rows[0]?.attrs.dueDate).toBe("2026-03-24")
  })

  it("updates mapped block attrs for quick-edit fields", async () => {
    const adapter = new FakeKernelAdapter()
    const runtime = createQueryRuntime(adapter)

    await runtime.updateField("block-1", "status", "Done", mappings)

    expect(adapter.attrUpdates).toEqual([
      {
        id: "block-1",
        attrs: {
          "custom-status": "Done",
        },
      },
    ])
  })

  it("creates a SiYuan JS embed block in markdown mode", async () => {
    const adapter = new FakeKernelAdapter()
    const runtime = createQueryRuntime(adapter)

    await runtime.insertEmbedBlock({
      parentID: "doc-1",
      templateId: "template-1",
      title: "任务看板",
      viewType: "board",
    })

    expect(adapter.appendedBlocks[0]?.parentID).toBe("doc-1")
    expect(adapter.appendedBlocks[0]?.data).toContain("{{//!js")
    expect(adapter.appendedBlocks[0]?.data).toContain("template-1")
  })

  it("passes the selected view id into embed markdown payload", async () => {
    const adapter = new FakeKernelAdapter()
    const runtime = createQueryRuntime(adapter)

    await runtime.insertEmbedBlock({
      parentID: "doc-2",
      templateId: "template-2",
      viewId: "view-2",
      title: "任务列表",
      viewType: "table",
    })

    expect(adapter.appendedBlocks[0]?.data).toContain("\"viewId\":\"view-2\"")
  })
})
