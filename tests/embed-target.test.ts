import { describe, expect, it } from "vitest"

import {
  formatEmbedTargetHint,
  getActiveDocumentTarget,
  getOpenDocumentTargets,
  isLikelyBlockId,
  normalizeRecentEmbedTargetIds,
  summarizeBlockLabel,
} from "@/core/embed-target"

describe("embed target helpers", () => {
  it("detects likely SiYuan block ids", () => {
    expect(isLikelyBlockId("20260322194501-abc1234")).toBe(true)
    expect(isLikelyBlockId("not-an-id")).toBe(false)
    expect(isLikelyBlockId("")).toBe(false)
  })

  it("summarizes block labels into a short hint", () => {
    expect(summarizeBlockLabel("   这是一个很长的块内容\n第二行也要压缩   ", 10)).toBe("这是一个很长的块内容…")
    expect(summarizeBlockLabel("短文本", 10)).toBe("短文本")
    expect(summarizeBlockLabel("", 10)).toBe("")
  })

  it("formats document and block hints", () => {
    expect(formatEmbedTargetHint({
      id: "doc-1",
      type: "document",
      title: "周报",
      content: "不会显示",
    })).toBe("文档：周报")

    expect(formatEmbedTargetHint({
      id: "block-1",
      type: "block",
      title: "",
      content: "这是块内容摘要",
    })).toBe("块：这是块内容摘要")
  })

  it("normalizes recent embed target ids with trim, dedupe and max size", () => {
    expect(normalizeRecentEmbedTargetIds([
      " 20260322194501-abc1234 ",
      "20260322195501-def5678",
      "20260322194501-abc1234",
      "",
      "not-an-id",
      "20260322200501-hij9012",
    ], 2)).toEqual([
      "20260322194501-abc1234",
      "20260322195501-def5678",
    ])
  })

  it("resolves current document from active editor", () => {
    const result = getActiveDocumentTarget({
      siyuan: {
        getActiveEditor: () => ({
          protyle: {
            block: {
              rootID: "20260322194501-abc1234",
            },
          },
          title: "日报",
        }),
      },
    })

    expect(result).toEqual({
      id: "20260322194501-abc1234",
      title: "日报",
    })
  })

  it("resolves current document from active editor rootId fields", () => {
    const result = getActiveDocumentTarget({
      siyuan: {
        getActiveEditor: () => ({
          rootId: "20260322195501-def5678",
          title: "项目周报",
        }),
      },
    })

    expect(result).toEqual({
      id: "20260322195501-def5678",
      title: "项目周报",
    })
  })

  it("resolves current document from layout active tab fallback", () => {
    const result = getActiveDocumentTarget({
      siyuan: {
        getActiveEditor: () => null,
        config: {
          uiLayout: {
            layout: {
              children: [
                {
                  children: [
                    {
                      instance: "Tab",
                      active: true,
                      title: "今日笔记",
                      children: {
                        rootId: "20260322130128-lvb7gg8",
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    })

    expect(result).toEqual({
      id: "20260322130128-lvb7gg8",
      title: "今日笔记",
    })
  })

  it("lists active and other opened documents with dedupe", () => {
    const result = getOpenDocumentTargets({
      siyuan: {
        getActiveEditor: () => ({
          rootId: "20260322195501-def5678",
          title: "项目周报",
        }),
        config: {
          uiLayout: {
            layout: {
              children: [
                {
                  children: [
                    {
                      instance: "Tab",
                      active: true,
                      title: "今日笔记",
                      children: {
                        rootId: "20260322130128-lvb7gg8",
                      },
                    },
                    {
                      instance: "Tab",
                      title: "项目周报",
                      children: {
                        rootId: "20260322195501-def5678",
                      },
                    },
                    {
                      instance: "Tab",
                      title: "阅读清单",
                      children: {
                        rootId: "20260322201501-hij9012",
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    })

    expect(result).toEqual([
      {
        id: "20260322195501-def5678",
        title: "项目周报",
      },
      {
        id: "20260322130128-lvb7gg8",
        title: "今日笔记",
      },
      {
        id: "20260322201501-hij9012",
        title: "阅读清单",
      },
    ])
  })
})
