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
})
