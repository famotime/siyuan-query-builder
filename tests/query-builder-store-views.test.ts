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
  createDocWithMd: vi.fn(async () => "20260323093000-example"),
  getChildBlocks: vi.fn(async () => []),
  getBlockByID: vi.fn(async () => null),
  getNotebookConf: vi.fn(async () => ({
    box: "box-work",
    name: "工作笔记",
    conf: {
      name: "工作笔记",
      closed: false,
      refCreateSavePath: "/",
      createDocNameTemplate: "2006-01-02",
      dailyNoteSavePath: "/日记/{{now | date \"2006/03\"}}/{{now | date \"2006-01-02\"}}",
      dailyNoteTemplatePath: "",
    },
  })),
  lsNotebooks: vi.fn(async () => ({
    notebooks: [],
  })),
  renderSprig: vi.fn(async (template: string) => template
    .replace('{{now | date "2006/03"}}', "2026/03")
    .replace('{{now | date "2006/01"}}', "2026/03")
    .replace('{{now | date "2006-01-02"}}', "2026-03-23")),
  setBlockAttrs: vi.fn(async () => []),
  sql: vi.fn(async () => []),
}))

vi.mock("@/core/runtime/query-runtime", () => ({
  createQueryRuntime: () => runtime,
}))

import { createDocWithMd, getBlockByID, getChildBlocks, getNotebookConf, lsNotebooks, renderSprig, setBlockAttrs } from "@/api"
import { createQueryBuilderStore } from "@/composables/query-builder-store"
import { QUERY_HISTORY_STORAGE_KEY } from "@/core/storage/query-history-store"
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
    vi.mocked(getNotebookConf).mockResolvedValue({
      box: "box-work",
      name: "工作笔记",
      conf: {
        name: "工作笔记",
        closed: false,
        refCreateSavePath: "/",
        createDocNameTemplate: "2006-01-02",
        dailyNoteSavePath: "/日记/{{now | date \"2006/03\"}}/{{now | date \"2006-01-02\"}}",
        dailyNoteTemplatePath: "",
      },
    })
    vi.mocked(createDocWithMd).mockClear()
    vi.mocked(createDocWithMd).mockResolvedValue("20260323093000-example")
    vi.mocked(renderSprig).mockClear()
    vi.mocked(renderSprig).mockImplementation(async (template: string) => template
      .replace('{{now | date "2006/03"}}', "2026/03")
      .replace('{{now | date "2006/01"}}', "2026/03")
      .replace('{{now | date "2006-01-02"}}', "2026-03-23"))
    vi.mocked(getChildBlocks).mockClear()
    vi.mocked(getChildBlocks).mockResolvedValue([])
    vi.mocked(setBlockAttrs).mockClear()
    vi.mocked(setBlockAttrs).mockResolvedValue([])
    vi.mocked(getBlockByID).mockClear()
    vi.mocked(getBlockByID).mockResolvedValue(null)
    window.siyuan = undefined
    window.confirm = vi.fn(() => true)
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

  it("builds saved template summaries from legacy snapshot storage after migration", async () => {
    currentPlugin.seed("query-builder.templates.v1", [
      {
        template: {
          id: "template-1",
          version: 1,
          name: "遗留任务视图",
          scope: {
            type: "all_blocks",
          },
          filters: [],
          sorts: [],
          fields: ["content"],
          viewType: "table",
        },
        view: {
          id: "view-legacy",
          queryTemplateId: "template-1",
          type: "list",
          defaultView: true,
          fieldMappings: {
            status: "status",
            dueDate: "dueDate",
            priority: "priority",
            project: "project",
            owner: "owner",
          },
        },
      },
    ])

    const store = createQueryBuilderStore()
    await store.refreshSavedTemplateSummaries()

    expect(store.savedTemplateSummaries).toEqual([
      {
        templateId: "template-1",
        templateName: "遗留任务视图",
        defaultViewId: "view-legacy",
        defaultViewType: "list",
        viewCount: 1,
      },
    ])
  })

  it("exports a saved template bundle with all of its saved views", async () => {
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
    const bundle = await (store as any).exportTemplateBundle("template-1")

    expect(bundle).toEqual(expect.objectContaining({
      schema: "siyuan-query-builder/template-bundle",
      version: 1,
      template: expect.objectContaining({
        id: "template-1",
        name: "项目看板",
      }),
      views: [
        expect.objectContaining({
          id: "view-table",
        }),
        expect.objectContaining({
          id: "view-board",
        }),
      ],
    }))
  })

  it("hydrates missing view state when exporting a template bundle", async () => {
    currentPlugin.seed(QUERY_TEMPLATE_STORAGE_KEY, [
      {
        id: "template-1",
        version: 1,
        name: "项目看板",
        scope: {
          type: "all_blocks",
        },
        filters: [],
        sorts: [
          {
            field: "updated",
            direction: "desc",
          },
        ],
        fields: ["content", "updated"],
        groupBy: "attr:status",
        viewType: "board",
      },
    ])
    currentPlugin.seed(VIEW_CONFIG_STORAGE_KEY, [
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
    const bundle = await (store as any).exportTemplateBundle("template-1")

    expect(bundle.views).toEqual([
      expect.objectContaining({
        id: "view-board",
        type: "board",
        fields: ["content", "updated"],
        sorts: [
          {
            field: "updated",
            direction: "desc",
          },
        ],
        groupBy: "attr:status",
      }),
    ])
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
    store.resultSet = {
      rows: [
        {
          id: "block-1",
          content: "任务 A",
          attrs: {
            status: "Doing",
          },
        },
      ],
      total: 1,
      executedAt: "2026-03-22T00:00:00.000Z",
    }
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
    expect(store.resultSet?.rows).toEqual([
      {
        id: "block-1",
        content: "任务 A",
        attrs: {
          status: "Doing",
        },
      },
    ])
  })

  it("imports a template bundle as a new saved template with remapped ids", async () => {
    const store = createQueryBuilderStore()

    const importedTemplateId = await (store as any).importTemplateBundle(JSON.stringify({
      schema: "siyuan-query-builder/template-bundle",
      version: 1,
      template: {
        id: "template-old",
        version: 1,
        name: "周报模板",
        scope: {
          type: "all_blocks",
        },
        filters: [],
        sorts: [],
        fields: ["content", "updated"],
        viewType: "table",
      },
      views: [
        {
          id: "view-old-1",
          queryTemplateId: "template-old",
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
          id: "view-old-2",
          queryTemplateId: "template-old",
          type: "list",
          defaultView: false,
          fieldMappings: {
            status: "status",
            dueDate: "dueDate",
            priority: "priority",
            project: "project",
            owner: "owner",
          },
        },
      ],
    }))

    expect(importedTemplateId).toBeTruthy()
    expect(importedTemplateId).not.toBe("template-old")
    expect(store.savedTemplateSummaries).toEqual([
      expect.objectContaining({
        templateId: importedTemplateId,
        templateName: "周报模板",
        viewCount: 2,
      }),
    ])

    const storedTemplates = currentPlugin.read(QUERY_TEMPLATE_STORAGE_KEY) as any[]
    const storedViews = currentPlugin.read(VIEW_CONFIG_STORAGE_KEY) as any[]

    expect(storedTemplates[0]?.id).toBe(importedTemplateId)
    expect(storedViews).toHaveLength(2)
    expect(storedViews.every(view => view.queryTemplateId === importedTemplateId)).toBe(true)
    expect(storedViews.some(view => view.id === "view-old-1" || view.id === "view-old-2")).toBe(false)
  })

  it("keeps a saved template when deletion is canceled", async () => {
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
    vi.mocked(window.confirm).mockReturnValue(false)
    const store = createQueryBuilderStore()

    await store.refreshSavedTemplateSummaries()
    await store.deleteTemplate("template-1")

    expect(window.confirm).toHaveBeenCalled()
    expect(currentPlugin.read(QUERY_TEMPLATE_STORAGE_KEY)).toEqual([
      expect.objectContaining({
        id: "template-1",
      }),
    ])
    expect(showMessage).not.toHaveBeenCalledWith("已删除模板", 3000, "info")
  })

  it("resets the active draft and clears saved views after deleting the active template", async () => {
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
    ])

    const store = createQueryBuilderStore()
    await store.loadTemplate("template-1")
    await store.refreshSavedViews("template-1")

    await store.deleteTemplate("template-1")

    expect(store.draft.template.id).not.toBe("template-1")
    expect(store.savedViews).toEqual([])
    expect(currentPlugin.read(QUERY_TEMPLATE_STORAGE_KEY)).toBeUndefined()
    expect(currentPlugin.read(VIEW_CONFIG_STORAGE_KEY)).toBeUndefined()
  })

  it("sets one default saved view and syncs template state to the promoted view", async () => {
    currentPlugin.seed(QUERY_TEMPLATE_STORAGE_KEY, [
      {
        id: "template-1",
        version: 1,
        name: "任务清单",
        scope: {
          type: "all_blocks",
        },
        filters: [],
        sorts: [
          {
            field: "updated",
            direction: "desc",
          },
        ],
        fields: ["content", "updated"],
        viewType: "table",
      },
    ])
    currentPlugin.seed(VIEW_CONFIG_STORAGE_KEY, [
      {
        id: "view-table",
        queryTemplateId: "template-1",
        type: "table",
        defaultView: true,
        fields: ["content", "updated"],
        sorts: [
          {
            field: "updated",
            direction: "desc",
          },
        ],
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
        fields: ["content", "attr:status"],
        groupBy: "attr:status",
        sorts: [
          {
            field: "attr:status",
            direction: "asc",
          },
        ],
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
    await store.refreshSavedViews("template-1")

    await expect(store.setDefaultSavedView("view-board")).resolves.toBe(true)

    const storedTemplates = currentPlugin.read(QUERY_TEMPLATE_STORAGE_KEY) as any[]
    const storedViews = currentPlugin.read(VIEW_CONFIG_STORAGE_KEY) as any[]

    expect(storedViews.filter(view => view.defaultView)).toEqual([
      expect.objectContaining({
        id: "view-board",
        defaultView: true,
      }),
    ])
    expect(storedTemplates[0]).toEqual(expect.objectContaining({
      id: "template-1",
      viewType: "board",
      fields: ["content", "attr:status"],
      groupBy: "attr:status",
      sorts: [
        {
          field: "attr:status",
          direction: "asc",
        },
      ],
    }))
  })

  it("records metrics for view switches, query runs, template saves and saved views", async () => {
    const store = createQueryBuilderStore()

    store.setViewType("board")
    store.draft.template.groupBy = `attr:${store.draft.view.fieldMappings.status}`
    await store.runQuery()
    await store.saveTemplate()
    store.setViewType("list")
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
        list: 1,
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

  it("keeps the existing query result set when switching between saved views of the same template", async () => {
    const store = createQueryBuilderStore()

    runtime.execute.mockResolvedValueOnce({
      rows: [
        {
          id: "block-1",
          content: "任务 A",
          attrs: {
            status: "Doing",
          },
        },
      ],
      total: 1,
      executedAt: "2026-03-24T00:00:00.000Z",
    })

    store.draft.template.name = "任务清单"
    await store.saveTemplate()
    const tableViewId = store.draft.view.id

    store.setViewType("board")
    store.draft.template.groupBy = `attr:${store.draft.view.fieldMappings.status}`
    await store.saveViewAs()
    const boardViewId = store.draft.view.id

    await store.loadSavedView(tableViewId)
    await store.runQuery()

    expect(store.resultSet?.rows).toHaveLength(1)
    expect(store.resultSet?.rows[0]?.id).toBe("block-1")

    await store.loadSavedView(boardViewId)

    expect(store.draft.view.id).toBe(boardViewId)
    expect(store.draft.view.type).toBe("board")
    expect(store.resultSet?.rows).toHaveLength(1)
    expect(store.resultSet?.rows[0]?.id).toBe("block-1")
  })

  it("appends a newly added saved view to the right instead of inserting it before existing views", async () => {
    const store = createQueryBuilderStore()

    store.draft.template.name = "任务清单"
    await store.saveTemplate()
    const initialViewId = store.draft.view.id

    store.setViewType("board")
    store.draft.template.groupBy = `attr:${store.draft.view.fieldMappings.status}`

    await store.saveViewAs()

    expect(store.savedViews.map(view => view.id)).toEqual([
      initialViewId,
      store.draft.view.id,
    ])
    expect(store.savedViews.map(view => view.type)).toEqual([
      "table",
      "board",
    ])
  })

  it("prevents adding a duplicate saved view of the same type for one template", async () => {
    const store = createQueryBuilderStore()

    store.draft.template.name = "任务清单"
    await store.saveTemplate()
    const originalViewId = store.draft.view.id

    await expect(store.saveViewAs()).resolves.toBe(false)

    expect(store.savedViews).toHaveLength(1)
    expect(store.savedViews[0]?.id).toBe(originalViewId)
    expect(showMessage).toHaveBeenCalledWith("该视图类型已存在，无需重复添加", 3500, "error")
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

  it("initializes query history, template summaries, and saved views together", async () => {
    currentPlugin.seed(QUERY_HISTORY_STORAGE_KEY, [
      {
        id: "history-1",
        templateName: "最近查询",
        summary: "全部内容 · 1 个条件 · 表格",
        executedAt: "2026-03-24T00:00:00.000Z",
        snapshot: {
          template: {
            id: "template-history",
            version: 1,
            name: "最近查询",
            scope: {
              type: "all_blocks",
            },
            filters: [],
            sorts: [],
            fields: ["content"],
            viewType: "table",
          },
          view: {
            id: "view-history",
            queryTemplateId: "template-history",
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
        },
      },
    ])
    const store = createQueryBuilderStore()
    const initialTemplateId = store.draft.template.id
    currentPlugin.seed(QUERY_TEMPLATE_STORAGE_KEY, [
      {
        id: initialTemplateId,
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
        queryTemplateId: initialTemplateId,
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
    ])

    await store.initialize()

    expect(store.recentQueryHistory).toEqual([
      expect.objectContaining({
        id: "history-1",
        templateName: "最近查询",
      }),
    ])
    expect(store.savedTemplateSummaries).toEqual([
      expect.objectContaining({
        templateId: initialTemplateId,
        templateName: "项目看板",
      }),
    ])
    expect(store.savedViews).toEqual([
      expect.objectContaining({
        id: "view-table",
        queryTemplateId: initialTemplateId,
      }),
    ])
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

  it("records the 10 most recent query snapshots and restores one from history", async () => {
    const store = createQueryBuilderStore()

    for (let index = 1; index <= 12; index += 1) {
      store.draft.template.name = `查询 ${index}`
      store.draft.template.filters = [
        {
          id: `filter-${index}`,
          field: "content",
          operator: "contains",
          condition: "and",
          value: `任务 ${index}`,
        },
      ]
      await store.runQuery()
    }

    const recentQueryHistory = (store as any).recentQueryHistory

    expect(recentQueryHistory).toHaveLength(10)
    expect(recentQueryHistory[0]).toEqual(expect.objectContaining({
      templateName: "查询 12",
      summary: expect.stringContaining("1 个条件"),
    }))
    expect(recentQueryHistory[9]).toEqual(expect.objectContaining({
      templateName: "查询 3",
    }))
    expect(currentPlugin.read("query-builder.history.v1")).toHaveLength(10)

    await (store as any).restoreQueryHistory(recentQueryHistory[9].id)

    expect(store.draft.template.name).toBe("查询 3")
    expect(store.draft.template.filters).toEqual([
      expect.objectContaining({
        value: "任务 3",
      }),
    ])
  })

  it("applies an external snapshot by refreshing the target template views and clearing stale results", async () => {
    currentPlugin.seed(QUERY_TEMPLATE_STORAGE_KEY, [
      {
        id: "template-2",
        version: 1,
        name: "项目看板",
        scope: {
          type: "all_blocks",
        },
        filters: [],
        sorts: [],
        fields: ["content", "attr:status"],
        viewType: "board",
      },
    ])
    currentPlugin.seed(VIEW_CONFIG_STORAGE_KEY, [
      {
        id: "view-board",
        queryTemplateId: "template-2",
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
    store.resultSet = {
      rows: [
        {
          id: "block-1",
          content: "旧结果",
          attrs: {},
        },
      ],
      total: 1,
      executedAt: "2026-03-24T00:00:00.000Z",
    }
    store.advancedSql = "select * from blocks"
    store.error = "旧错误"

    store.applySnapshot({
      template: {
        id: "template-2",
        version: 1,
        name: "项目看板",
        scope: {
          type: "all_blocks",
        },
        filters: [],
        sorts: [],
        fields: ["content", "attr:status"],
        groupBy: "attr:status",
        viewType: "board",
      },
      view: {
        id: "view-board",
        queryTemplateId: "template-2",
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
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(store.draft.template.id).toBe("template-2")
    expect(store.draft.view.id).toBe("view-board")
    expect(store.savedViews).toEqual([
      expect.objectContaining({
        id: "view-board",
        queryTemplateId: "template-2",
      }),
    ])
    expect(store.resultSet).toBe(null)
    expect(store.advancedSql).toBe("")
    expect(store.error).toBe("")
  })

  it("moves a filter after the target row when dropping into the lower half", () => {
    const store = createQueryBuilderStore()
    store.draft.template.filters = [
      {
        id: "filter-1",
        field: "content",
        operator: "contains",
        condition: "and",
        value: "任务",
      },
      {
        id: "filter-2",
        field: "attr:status",
        operator: "eq",
        condition: "or",
        value: "Doing",
      },
      {
        id: "filter-3",
        field: "updated",
        operator: "last_days",
        condition: "and",
        value: "7",
      },
    ]

    store.moveFilter("filter-1", "filter-2", "after")

    expect(store.draft.template.filters.map(filter => filter.id)).toEqual([
      "filter-2",
      "filter-1",
      "filter-3",
    ])
    expect(store.draft.template.filters[0]?.condition).toBe("and")
    expect(store.draft.template.filters[1]?.condition).toBe("and")
  })

  it("creates a preset-ready example document in the daily note directory", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-23T09:30:00.000Z"))
    vi.mocked(getChildBlocks).mockResolvedValue([
      { id: "p-1", type: "p", content: "修复登录页视觉样式 #task #frontend" },
      { id: "p-2", type: "p", content: "同步 API 文档给前端 #task #backend" },
      { id: "p-3", type: "p", content: "整理迭代复盘行动项 #task #ops" },
      { id: "p-4", type: "p", content: "归档旧版埋点脚本 #task #maintenance" },
      { id: "p-5", type: "p", content: "官网改版第一阶段排期确认" },
      { id: "p-6", type: "p", content: "开放平台 SDK 发布准备" },
      { id: "p-7", type: "p", content: "知识库迁移收尾" },
      { id: "p-8", type: "p", content: "阅读《Designing Data-Intensive Applications》 #reading #backend" },
      { id: "p-9", type: "p", content: "跟进《Refactoring UI》案例 #reading #design" },
      { id: "p-10", type: "p", content: "浏览 SiYuan API 变更记录 #reading #siyuan" },
    ] as any)
    const store = createQueryBuilderStore()
    store.notebooks = [
      {
        id: "box-work",
        name: "工作笔记",
        icon: "",
        sort: 0,
        closed: false,
      },
    ]
    store.draft.template.scope = {
      type: "notebook",
      value: "box-work",
    }

    await (store as any).generateExampleDocument()

    expect(getNotebookConf).toHaveBeenCalledWith("box-work")
    expect(renderSprig).toHaveBeenCalledWith("/日记/{{now | date \"2006/03\"}}/{{now | date \"2006-01-02\"}}")
    expect(createDocWithMd).toHaveBeenCalledWith(
      "box-work",
      "/日记/2026/03/2026-03-23 Query Builder 示例",
      expect.stringContaining("## 任务清单示例"),
    )
    expect(vi.mocked(createDocWithMd).mock.calls[0]?.[2]).not.toContain('status="Todo"')
    expect(getChildBlocks).toHaveBeenCalledWith("20260323093000-example")
    expect(setBlockAttrs).toHaveBeenCalledWith("p-1", expect.objectContaining({
      "custom-status": "Todo",
      "custom-dueDate": "2026-03-24",
      "custom-project": "官网改版",
    }))
    expect(setBlockAttrs).toHaveBeenCalledWith("p-8", expect.objectContaining({
      "custom-status": "Unread",
      "custom-priority": "P1",
    }))
    expect(showMessage).toHaveBeenCalledWith(
      "已生成预设示例文档：2026-03-23 Query Builder 示例（路径：/日记/2026/03/2026-03-23 Query Builder 示例）",
      3500,
      "info",
    )

    vi.useRealTimers()
  })

  it("uses the current document notebook daily-note config before falling back to scoped notebook config", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-23T09:30:00.000Z"))
    window.siyuan = {
      getActiveEditor: () => ({
        rootId: "20260323080000-active1",
        title: "当前日报",
      }),
    } as any
    vi.mocked(getBlockByID).mockImplementation(async (id: string) => {
      if (id === "20260323080000-active1") {
        return {
          id,
          box: "box-current",
          type: "d",
          content: "当前日报",
        } as any
      }
      return null
    })
    vi.mocked(getNotebookConf).mockImplementation(async (notebookId: string) => ({
      box: notebookId,
      name: notebookId,
      conf: {
        name: notebookId,
        closed: false,
        refCreateSavePath: "/",
        createDocNameTemplate: "2006-01-02",
        dailyNoteSavePath: notebookId === "box-current"
          ? "/当前笔记本日记/{{now | date \"2006/01\"}}/{{now | date \"2006-01-02\"}}"
          : "/其他笔记本日记/{{now | date \"2006/01\"}}/{{now | date \"2006-01-02\"}}",
        dailyNoteTemplatePath: "",
      },
    }))
    vi.mocked(renderSprig).mockImplementation(async (template: string) => template
      .replace('{{now | date "2006/01"}}', "2026/03")
      .replace('{{now | date "2006-01-02"}}', "2026-03-23"))
    vi.mocked(getChildBlocks).mockResolvedValue([])
    const store = createQueryBuilderStore()
    store.notebooks = [
      { id: "box-scope", name: "Scope", icon: "", sort: 0, closed: false } as Notebook,
      { id: "box-current", name: "Current", icon: "", sort: 1, closed: false } as Notebook,
    ]
    store.draft.template.scope = {
      type: "notebook",
      value: "box-scope",
    }

    await (store as any).generateExampleDocument()

    expect(renderSprig).toHaveBeenCalledWith("/当前笔记本日记/{{now | date \"2006/01\"}}/{{now | date \"2006-01-02\"}}")
    expect(createDocWithMd).toHaveBeenCalledWith(
      "box-current",
      "/当前笔记本日记/2026/03/2026-03-23 Query Builder 示例",
      expect.any(String),
    )

    vi.useRealTimers()
  })
})
