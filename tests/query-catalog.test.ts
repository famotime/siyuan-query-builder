import { describe, expect, it } from "vitest"

import {
  applyViewConfigToTemplate,
  cloneSnapshot,
  createFieldOptions,
  createPresets,
  DEFAULT_FIELD_MAPPINGS,
  hydrateViewConfig,
} from "@/core/query/catalog"

describe("createPresets", () => {
  it("includes a preset for core documents ranked by backlinks", () => {
    const presets = createPresets(DEFAULT_FIELD_MAPPINGS)
    const preset = presets.find(item => item.id === "preset-core-documents-by-backlinks")

    expect(preset).toBeDefined()
    expect(preset?.title).toBe("高反链核心笔记")
    expect(preset?.category).toBe("links")
    expect(preset?.snapshot.template.scope).toEqual({
      type: "block_type",
      value: "d",
    })
    expect(preset?.snapshot.template.fields).toEqual(["content", "backlinkCount", "outLinkCount", "updated", "box"])
    expect(preset?.snapshot.template.sorts).toEqual([
      {
        field: "backlinkCount",
        direction: "desc",
      },
    ])
    expect(preset?.snapshot.template.viewType).toBe("table")
  })

  it("includes the requested link-centric and recent activity presets", () => {
    const presets = createPresets(DEFAULT_FIELD_MAPPINGS)

    expect(presets.map(item => item.id)).toEqual(expect.arrayContaining([
      "preset-recent-custom-attribute-blocks-7d",
      "preset-core-documents-by-backlinks",
      "preset-index-documents-by-outlinks",
      "preset-bidirectional-core-documents",
      "preset-island-documents-without-links",
      "preset-recent-linked-documents",
      "preset-recently-updated-documents-7d",
      "preset-recently-created-documents-30d",
      "preset-top-documents-by-assets",
      "preset-today-edited-documents",
    ]))

    const recentLinked = presets.find(item => item.id === "preset-recent-linked-documents")
    expect(recentLinked?.snapshot.view.type).toBe("list")
    expect(recentLinked?.category).toBe("links")
    expect(recentLinked?.snapshot.template.filters).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "updated",
        operator: "last_days",
        value: "30",
      }),
      expect.objectContaining({
        field: "linkCount",
        operator: "gt",
        value: "0",
      }),
    ]))

    const topTags = presets.find(item => item.id === "preset-top-documents-by-tags")
    expect(topTags).toBeDefined()
    expect(topTags?.title).toBe("包含最多标签的文档(Top10)")
    expect(topTags?.category).toBe("daily")
    expect(topTags?.snapshot.template.limit).toBe(10)
    expect(topTags?.snapshot.template.sorts).toEqual([
      {
        field: "tagCount",
        direction: "desc",
      },
    ])

    const topAssets = presets.find(item => item.id === "preset-top-documents-by-assets")
    expect(topAssets).toBeDefined()
    expect(topAssets?.title).toBe("内嵌资源最多文档(Top10)")
    expect(topAssets?.category).toBe("daily")
    expect(topAssets?.snapshot.template.limit).toBe(10)
    expect(topAssets?.snapshot.template.fields).toEqual([
      "content",
      "assetCount",
      "box",
      "updated",
      "path",
    ])
    expect(topAssets?.snapshot.template.filters).toEqual([
      expect.objectContaining({
        field: "assetCount",
        operator: "gt",
        value: "0",
      }),
    ])
    expect(topAssets?.snapshot.template.sorts).toEqual([
      {
        field: "assetCount",
        direction: "desc",
      },
    ])

    const recentCustomAttributeBlocks = presets.find(item => item.id === "preset-recent-custom-attribute-blocks-7d")
    expect(recentCustomAttributeBlocks).toBeDefined()
    expect(recentCustomAttributeBlocks?.title).toBe("近7天自定义属性块")
    expect(recentCustomAttributeBlocks?.category).toBe("attributes")
    expect(recentCustomAttributeBlocks?.snapshot.template.scope).toEqual({
      type: "attribute",
    })
    expect(recentCustomAttributeBlocks?.snapshot.template.filters).toEqual([
      expect.objectContaining({
        field: "created",
        operator: "last_days",
        value: "7",
      }),
    ])
    expect(recentCustomAttributeBlocks?.snapshot.template.sorts).toEqual([
      {
        field: "created",
        direction: "desc",
      },
    ])
    expect(recentCustomAttributeBlocks?.snapshot.template.fields).toEqual([
      "content",
      "type",
      "created",
      "attr:status",
      "attr:priority",
      "attr:dueDate",
      "attr:project",
      "attr:owner",
    ])
  })

  it("hydrates missing view state from the template and applies it back symmetrically", () => {
    const template = {
      id: "template-1",
      version: 1,
      name: "任务清单",
      scope: {
        type: "all_blocks" as const,
      },
      filters: [],
      sorts: [
        {
          field: "updated",
          direction: "desc" as const,
        },
      ],
      fields: ["content", "updated"],
      groupBy: "attr:status",
      aggregation: {
        function: "count" as const,
      },
      viewType: "board" as const,
    }
    const partialView = {
      id: "view-1",
      queryTemplateId: "template-1",
      type: "board" as const,
      defaultView: true,
      fieldMappings: {
        status: "status",
        dueDate: "dueDate",
        priority: "priority",
        project: "project",
        owner: "owner",
      },
    }

    const hydratedView = hydrateViewConfig(partialView, template)
    const appliedTemplate = applyViewConfigToTemplate(template, partialView)

    expect(hydratedView).toEqual(expect.objectContaining({
      fields: ["content", "updated"],
      sorts: [
        {
          field: "updated",
          direction: "desc",
        },
      ],
      groupBy: "attr:status",
      aggregation: {
        function: "count",
      },
    }))
    expect(appliedTemplate).toEqual(expect.objectContaining({
      viewType: "board",
      fields: hydratedView.fields,
      sorts: hydratedView.sorts,
      groupBy: hydratedView.groupBy,
      aggregation: hydratedView.aggregation,
    }))
  })

  it("deep clones snapshots instead of sharing template or view references", () => {
    const snapshot = {
      template: {
        id: "template-1",
        version: 1,
        name: "任务清单",
        scope: {
          type: "all_blocks" as const,
        },
        filters: [],
        sorts: [],
        fields: ["content"],
        viewType: "table" as const,
      },
      view: {
        id: "view-1",
        queryTemplateId: "template-1",
        type: "table" as const,
        defaultView: true,
        fields: ["content"],
        sorts: [],
        fieldMappings: {
          status: "status",
          dueDate: "dueDate",
          priority: "priority",
          project: "project",
          owner: "owner",
        },
      },
    }

    const cloned = cloneSnapshot(snapshot)
    cloned.template.fields.push("updated")
    cloned.view.fieldMappings.status = "workflowStatus"

    expect(snapshot.template.fields).toEqual(["content"])
    expect(snapshot.view.fieldMappings.status).toBe("status")
  })

  it("builds mapped attribute field options from custom field mappings", () => {
    const options = createFieldOptions({
      ...DEFAULT_FIELD_MAPPINGS,
      status: "workflowStatus",
      owner: "assignee",
    })

    expect(options).toEqual(expect.arrayContaining([
      expect.objectContaining({
        value: "attr:workflowStatus",
        label: "状态",
        hint: "workflowStatus",
      }),
      expect.objectContaining({
        value: "attr:assignee",
        label: "负责人",
        hint: "assignee",
      }),
      expect.objectContaining({
        value: "assetCount",
        label: "内嵌资源数量",
      }),
    ]))
  })
})
