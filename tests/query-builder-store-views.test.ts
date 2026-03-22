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

vi.mock("@/external/siyuan", () => ({
  Dialog: class {},
  showMessage: vi.fn(),
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

import { createQueryBuilderStore } from "@/composables/query-builder-store"
import { QUERY_TEMPLATE_STORAGE_KEY } from "@/core/storage/query-template-store"
import { VIEW_CONFIG_STORAGE_KEY } from "@/core/storage/view-config-store"

async function flushMetricsWrites() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe("createQueryBuilderStore view management", () => {
  beforeEach(() => {
    currentPlugin = new FakePluginStorage()
    runtime.execute.mockClear()
    runtime.updateField.mockClear()
    runtime.insertEmbedBlock.mockClear()
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
})
