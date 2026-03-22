import { describe, expect, it } from "vitest"

import { createTemplateStore } from "@/core/storage/template-store"
import type { QueryBuilderSnapshot, QueryTemplate } from "@/core/query/types"

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
}

describe("createTemplateStore", () => {
  it("saves and reloads templates with view config", async () => {
    const store = createTemplateStore(new FakePluginStorage())
    const template: QueryTemplate = {
      id: "template-1",
      version: 1,
      name: "Reading Queue",
      scope: {
        type: "tag",
        value: "#unread#",
      },
      filters: [],
      sorts: [],
      fields: ["content", "attr:priority"],
      viewType: "table",
    }
    const snapshot: QueryBuilderSnapshot = {
      template,
      view: {
        id: "view-1",
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
    }

    await store.save(snapshot)
    const loaded = await store.list()

    expect(loaded).toHaveLength(1)
    expect(loaded[0]?.view.type).toBe("board")
    expect(loaded[0]?.template.name).toBe("Reading Queue")
  })

  it("reads migrated v2 template and view storage through the compatibility layer", async () => {
    const storage = new FakePluginStorage()
    const store = createTemplateStore(storage)
    await storage.saveData("query-builder.templates.v2", [
      {
        id: "template-1",
        version: 1,
        name: "Reading Queue",
        scope: {
          type: "tag",
          value: "#unread#",
        },
        filters: [],
        sorts: [],
        fields: ["content"],
        viewType: "board",
      },
    ])
    await storage.saveData("query-builder.views.v2", [
      {
        id: "view-1",
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

    const loaded = await store.list()

    expect(loaded).toHaveLength(1)
    expect(loaded[0]?.template.viewType).toBe("board")
    expect(loaded[0]?.view.type).toBe("board")
  })

  it("loads a specific saved view when a view id is provided", async () => {
    const storage = new FakePluginStorage()
    const store = createTemplateStore(storage)
    await storage.saveData("query-builder.templates.v2", [
      {
        id: "template-1",
        version: 1,
        name: "Reading Queue",
        scope: {
          type: "tag",
          value: "#unread#",
        },
        filters: [],
        sorts: [],
        fields: ["content"],
        viewType: "table",
      },
    ])
    await storage.saveData("query-builder.views.v2", [
      {
        id: "view-1",
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
        fields: ["content"],
        sorts: [],
      },
      {
        id: "view-2",
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
        fields: ["content", "attr:status"],
        sorts: [
          {
            field: "attr:status",
            direction: "asc",
          },
        ],
        groupBy: "attr:status",
      },
    ])

    const loaded = await store.get("template-1", "view-2")

    expect(loaded?.view.id).toBe("view-2")
    expect(loaded?.template.viewType).toBe("board")
    expect(loaded?.template.groupBy).toBe("attr:status")
    expect(loaded?.template.fields).toEqual(["content", "attr:status"])
  })
})
