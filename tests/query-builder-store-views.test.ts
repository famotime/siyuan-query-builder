import { beforeEach, describe, expect, it, vi } from "vitest"

class FakePluginStorage {
  private data = new Map<string, unknown>()

  async loadData(key: string) {
    return this.data.get(key)
  }

  async saveData(key: string, value: unknown) {
    this.data.set(key, value)
  }

  async removeData(key: string) {
    this.data.delete(key)
  }

  seed(key: string, value: unknown) {
    this.data.set(key, value)
  }

  read(key: string) {
    return this.data.get(key)
  }
}

let currentPlugin = new FakePluginStorage()

const runtime = {
  execute: vi.fn(async () => ({
    rows: [],
    total: 0,
    executedAt: "2026-03-22T00:00:00.000Z",
  })),
  updateField: vi.fn(async () => {}),
  insertEmbedBlock: vi.fn(async () => {}),
}

const { showMessage } = vi.hoisted(() => ({
  showMessage: vi.fn(),
}))

vi.mock("@/external/siyuan", () => ({
  Dialog: class {},
  showMessage,
}))

vi.mock("@/main", () => ({
  usePlugin: () => currentPlugin,
}))

vi.mock("@/api", () => ({
  appendBlock: vi.fn(async () => []),
  getBlockByID: vi.fn(async () => null),
  lsNotebooks: vi.fn(async () => ({
    notebooks: [],
  })),
  setBlockAttrs: vi.fn(async () => []),
  sql: vi.fn(async () => []),
}))

vi.mock("@/core/runtime/query-runtime", () => ({
  createQueryRuntime: () => runtime,
}))

import { getBlockByID, lsNotebooks } from "@/api"
import { createQueryBuilderStore } from "@/composables/query-builder-store"
import { QUERY_TEMPLATE_STORAGE_KEY } from "@/core/storage/query-template-store"
import { VIEW_CONFIG_STORAGE_KEY } from "@/core/storage/view-config-store"

async function flushMetricsWrites() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe("createQueryBuilderStore view management", () => {
  beforeEach(() => {
    currentPlugin = new FakePluginStorage()
    showMessage.mockReset()
    runtime.execute.mockClear()
    runtime.updateField.mockClear()
    runtime.insertEmbedBlock.mockClear()
    vi.mocked(lsNotebooks).mockResolvedValue({
      notebooks: [],
    })
    vi.mocked(getBlockByID).mockResolvedValue(null)
    window.siyuan = undefined
  })

  it("builds template summaries from v2 storage and restores the default view when loading a template", async () => {
    currentPlugin.seed(QUERY_TEMPLATE_STORAGE_KEY, [
      {
        id: "template-1",
        version: 1,
        name: "项目看板",
        scope: {
          type: "all_blocks",
        },
        filters: [],
        sorts: [],
        fields: ["content"],
        viewType: "table",
      },
    ])
    currentPlugin.seed(VIEW_CONFIG_STORAGE_KEY, [
      {
        id: "view-table",
        queryTemplateId: "template-1",
        type: "table",
        defaultView: false,
        fieldMappings: {
          status: "status",
          dueDate: "dueDate",
          priority: "priority",
          project: "project",
          owner: "owner",
        },
      },
      {
        id: "view-board",
        queryTemplateId: "template-1",
        type: "board",
        defaultView: true,
        fieldMappings: {
          status: "status",
          dueDate: "dueDate",
          priority: "priority",
          project: "project",
          owner: "owner",
        },
      },
    ])
    const store = createQueryBuilderStore()

    await store.refreshSavedTemplateSummaries()

    expect(store.savedTemplateSummaries).toEqual([
      {
        templateId: "template-1",
        templateName: "项目看板",
        defaultViewId: "view-board",
        defaultViewType: "board",
        viewCount: 2,
      },
    ])

    await store.loadTemplate("template-1")

    expect(store.draft.template.id).toBe("template-1")
    expect(store.draft.view.id).toBe("view-board")
    expect(store.draft.view.type).toBe("board")
  })

  it("promotes a replacement default view after deleting the current default view", async () => {
    currentPlugin.seed(QUERY_TEMPLATE_STORAGE_KEY, [
      {
        id: "template-1",
        version: 1,
        name: "任务清单",
        scope: {
          type: "all_blocks",
        },
        filters: [],
        sorts: [],
        fields: ["content"],
        viewType: "table",
      },
    ])
    currentPlugin.seed(VIEW_CONFIG_STORAGE_KEY, [
      {
        id: "view-table",
        queryTemplateId: "template-1",
        type: "table",
        defaultView: true,
        fieldMappings: {
          status: "status",
          dueDate: "dueDate",
          priority: "priority",
          project: "project",
          owner: "owner",
        },
      },
      {
        id: "view-board",
        queryTemplateId: "template-1",
        type: "board",
        defaultView: false,
        fieldMappings: {
          status: "status",
          dueDate: "dueDate",
          priority: "priority",
          project: "project",
          owner: "owner",
        },
      },
    ])
    const store = createQueryBuilderStore()

    await store.loadTemplate("template-1")
    await store.refreshSavedViews("template-1")
    await store.deleteSavedView("view-table")

    expect(store.savedViews).toEqual([
      {
        id: "view-board",
        queryTemplateId: "template-1",
        type: "board",
        defaultView: true,
        fieldMappings: {
          status: "status",
          dueDate: "dueDate",
          priority: "priority",
          project: "project",
          owner: "owner",
        },
      },
    ])
    expect(store.draft.view.id).toBe("view-board")
    expect(store.draft.view.defaultView).toBe(true)
  })

  it("records metrics for view switches, query runs, template saves and saved views", async () => {
    const store = createQueryBuilderStore()

    store.setViewType("board")
    store.draft.template.groupBy = `attr:${store.draft.view.fieldMappings.status}`
    await store.runQuery()
    await store.saveTemplate()
    await store.saveViewAs()
    await flushMetricsWrites()

    expect(currentPlugin.read("query-builder.metrics.v1")).toEqual({
      queryRuns: 1,
      templateSaves: 1,
      viewSaves: 1,
      embedInsertions: 0,
      quickEdits: 0,
      boardDrags: 0,
      viewSwitches: {
        board: 1,
      },
    })
  })

  it("includes added custom attributes in selectable output fields", () => {
    const store = createQueryBuilderStore()

    store.customFieldName = "sprint"
    store.addCustomField()

    expect(store.draft.template.fields).toContain("attr:sprint")
    expect(store.selectableFieldOptions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        value: "attr:sprint",
      }),
    ]))
  })

  it("restores distinct fields and grouping from different saved views under one template", async () => {
    const store = createQueryBuilderStore()

    store.draft.template.name = "任务清单"
    store.draft.template.fields = ["content", "updated"]
    store.draft.template.sorts = [
      {
        field: "updated",
        direction: "desc",
      },
    ]
    await store.saveTemplate()
    const tableViewId = store.draft.view.id

    store.setViewType("board")
    store.draft.template.fields = ["content", `attr:${store.draft.view.fieldMappings.status}`]
    store.draft.template.groupBy = `attr:${store.draft.view.fieldMappings.status}`
    store.draft.template.sorts = [
      {
        field: `attr:${store.draft.view.fieldMappings.status}`,
        direction: "asc",
      },
    ]
    await store.saveViewAs()
    const boardViewId = store.draft.view.id

    expect(boardViewId).not.toBe(tableViewId)

    await store.loadSavedView(tableViewId)
    expect(store.draft.view.type).toBe("table")
    expect(store.draft.template.fields).toEqual(["content", "updated"])
    expect(store.draft.template.groupBy).toBeUndefined()
    expect(store.draft.template.sorts).toEqual([
      {
        field: "updated",
        direction: "desc",
      },
    ])

    await store.loadSavedView(boardViewId)
    expect(store.draft.view.type).toBe("board")
    expect(store.draft.template.fields).toEqual(["content", "attr:status"])
    expect(store.draft.template.groupBy).toBe("attr:status")
    expect(store.draft.template.sorts).toEqual([
      {
        field: "attr:status",
        direction: "asc",
      },
    ])
  })

  it("initializes notebooks and embed target state from persisted preferences", async () => {
    currentPlugin.seed("query-builder.embed-target.v1", {
      lastParentId: "20260322194501-abc1234",
      recentParentIds: [
        "20260322194501-abc1234",
        "20260322195501-def5678",
        "invalid",
      ],
    })
    vi.mocked(lsNotebooks).mockResolvedValue({
      notebooks: [
        {
          id: "box-1",
          name: "Projects",
        } as Notebook,
      ],
    })
    vi.mocked(getBlockByID).mockImplementation(async (id: string) => {
      if (id === "20260322194501-abc1234") {
        return {
          id,
          type: "d",
          content: "日报",
          name: "日报",
        } as Block
      }

      if (id === "20260322195501-def5678") {
        return {
          id,
          type: "p",
          content: "需要回顾的任务",
        } as Block
      }

      return null
    })
    window.siyuan = {
      getActiveEditor: () => ({
        rootId: "20260322201501-hij9012",
        title: "当前文档",
      }),
    }

    const store = createQueryBuilderStore()
    await store.initialize()

    expect(store.notebooks).toEqual([
      {
        id: "box-1",
        name: "Projects",
      },
    ])
    expect(store.currentDocumentTarget).toEqual({
      id: "20260322201501-hij9012",
      title: "当前文档",
    })
    expect(store.embedParentId).toBe("20260322194501-abc1234")
    expect(store.recentEmbedTargets).toEqual([
      expect.objectContaining({
        id: "20260322194501-abc1234",
        type: "document",
        title: "日报",
      }),
      expect.objectContaining({
        id: "20260322195501-def5678",
        type: "block",
        content: "需要回顾的任务",
      }),
    ])
    expect(store.embedTargetHint).toBe("文档：日报")
  })

  it("selects the current document as embed target and persists recent ids", async () => {
    window.siyuan = {
      getActiveEditor: () => ({
        rootId: "20260322195501-def5678",
        title: "项目周报",
      }),
    }

    const store = createQueryBuilderStore()

    await expect(store.selectCurrentDocumentTarget()).resolves.toBe(true)
    await flushMetricsWrites()

    expect(store.currentDocumentTarget).toEqual({
      id: "20260322195501-def5678",
      title: "项目周报",
    })
    expect(store.embedParentId).toBe("20260322195501-def5678")
    expect(currentPlugin.read("query-builder.embed-target.v1")).toEqual({
      lastParentId: "20260322195501-def5678",
      recentParentIds: ["20260322195501-def5678"],
    })
  })

  it("surfaces runtime query failures without leaving loading state behind", async () => {
    runtime.execute.mockRejectedValueOnce(new Error("SQL broken"))
    const store = createQueryBuilderStore()

    await store.runQuery()

    expect(store.loading).toBe(false)
    expect(store.error).toBe("SQL broken")
    expect(showMessage).toHaveBeenCalledWith("SQL broken", 5000, "error")
  })

  it("updates the current result row after a successful quick edit", async () => {
    const store = createQueryBuilderStore()
    store.resultSet = {
      rows: [
        {
          id: "block-1",
          content: "Task",
          attrs: {
            status: "Doing",
          },
        },
      ],
      total: 1,
      executedAt: "2026-03-22T00:00:00.000Z",
    }

    await store.quickEdit("block-1", "status", "Done")
    await flushMetricsWrites()

    expect(runtime.updateField).toHaveBeenCalledWith(
      "block-1",
      "status",
      "Done",
      store.draft.view.fieldMappings,
    )
    expect(store.resultSet.rows[0]?.attrs.status).toBe("Done")
    expect(currentPlugin.read("query-builder.metrics.v1")).toEqual(expect.objectContaining({
      quickEdits: 1,
    }))
  })

  it("blocks board drag writeback when the grouping field is not the mapped status field", async () => {
    const store = createQueryBuilderStore()
    store.draggingRowId = "block-1"
    store.draft.view.type = "board"
    store.draft.template.groupBy = "attr:priority"

    await store.dropToColumn("Done")

    expect(runtime.updateField).not.toHaveBeenCalled()
    expect(store.draggingRowId).toBe("")
    expect(showMessage).toHaveBeenCalledWith("只有按状态分组时才支持拖拽回写", 3500, "error")
  })

  it("inserts embed blocks and remembers the selected parent target", async () => {
    const store = createQueryBuilderStore()
    store.embedParentId = "20260322194501-abc1234"
    store.draft.template.name = "任务看板"

    await store.insertEmbed()
    await flushMetricsWrites()

    expect(runtime.insertEmbedBlock).toHaveBeenCalledWith({
      parentID: "20260322194501-abc1234",
      templateId: store.draft.template.id,
      viewId: store.draft.view.id,
      title: "任务看板",
      viewType: store.draft.view.type,
    })
    expect(currentPlugin.read("query-builder.embed-target.v1")).toEqual({
      lastParentId: "20260322194501-abc1234",
      recentParentIds: ["20260322194501-abc1234"],
    })
    expect(currentPlugin.read("query-builder.metrics.v1")).toEqual(expect.objectContaining({
      embedInsertions: 1,
    }))
  })
})
