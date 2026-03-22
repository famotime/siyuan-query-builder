import { reactive } from "vue"
import { describe, expect, it } from "vitest"

import { cloneSnapshot, createDefaultViewConfig, createEmptyTemplate } from "@/core/query/catalog"

describe("cloneSnapshot", () => {
  it("creates new templates with a default result limit of 100", () => {
    const template = createEmptyTemplate()

    expect(template.limit).toBe(100)
  })

  it("clones reactive snapshots into plain serializable data", () => {
    const template = reactive(createEmptyTemplate("任务查询"))
    template.filters.push({
      id: "filter-1",
      field: "content",
      operator: "contains",
      value: "待办",
    })

    const snapshot = reactive({
      template,
      view: reactive(createDefaultViewConfig(template.id)),
    })

    const cloned = cloneSnapshot(snapshot)

    expect(cloned.template.name).toBe("任务查询")
    expect(cloned.template.filters).toHaveLength(1)
    expect(cloned.view.queryTemplateId).toBe(template.id)
  })
})
