import { beforeEach, describe, expect, it, vi } from "vitest"

const { fetchSyncPost } = vi.hoisted(() => ({
  fetchSyncPost: vi.fn(),
}))

vi.mock("siyuan", () => ({
  fetchSyncPost,
}))

import {
  appendBlock,
  createDocWithMd,
  getBlockByID,
  getChildBlocks,
  getNotebookConf,
  lsNotebooks,
  renderSprig,
  setBlockAttrs,
  sql,
} from "@/api"

function kernelOk(data: unknown) {
  return { code: 0, msg: "", data }
}

function kernelError(msg = "kernel error") {
  return { code: -1, msg, data: null }
}

describe("siyuan api boundary (kept surface)", () => {
  beforeEach(() => {
    fetchSyncPost.mockReset()
  })

  it("returns response data for successful kernel calls", async () => {
    fetchSyncPost.mockResolvedValue(kernelOk({ notebooks: [{ id: "n1", name: "笔记" }] }))

    await expect(lsNotebooks()).resolves.toEqual({ notebooks: [{ id: "n1", name: "笔记" }] })
    expect(fetchSyncPost).toHaveBeenCalledWith("/api/notebook/lsNotebooks", "")
  })

  it("maps kernel errors (code !== 0) to null instead of throwing", async () => {
    fetchSyncPost.mockResolvedValue(kernelError("timeout"))

    await expect(lsNotebooks()).resolves.toBeNull()
    await expect(sql("SELECT 1")).resolves.toBeNull()
    await expect(getNotebookConf("n1")).resolves.toBeNull()
  })

  it("sends the statement for sql queries and returns row arrays", async () => {
    fetchSyncPost.mockResolvedValue(kernelOk([{ id: "r1", content: "内容" }]))

    await expect(sql("SELECT * FROM blocks")).resolves.toEqual([{ id: "r1", content: "内容" }])
    expect(fetchSyncPost).toHaveBeenCalledWith("/api/query/sql", { stmt: "SELECT * FROM blocks" })
  })

  it("resolves the first block for getBlockByID and stays safe on errors or empty results", async () => {
    fetchSyncPost.mockResolvedValue(kernelOk([{ id: "b1", content: "块" }]))
    await expect(getBlockByID("b1")).resolves.toEqual({ id: "b1", content: "块" })

    fetchSyncPost.mockResolvedValue(kernelOk([]))
    await expect(getBlockByID("missing")).resolves.toBeUndefined()

    // 请求失败(code !== 0 → null)时不应抛 TypeError
    fetchSyncPost.mockResolvedValue(kernelError())
    await expect(getBlockByID("broken")).resolves.toBeUndefined()
  })

  it("posts child blocks, attribute writes, doc creation and sprig rendering with the right payloads", async () => {
    fetchSyncPost.mockResolvedValue(kernelOk([{ id: "c1", type: "p" }]))
    await expect(getChildBlocks("doc-1")).resolves.toEqual([{ id: "c1", type: "p" }])
    expect(fetchSyncPost).toHaveBeenLastCalledWith("/api/block/getChildBlocks", { id: "doc-1" })

    fetchSyncPost.mockResolvedValue(kernelOk(null))
    await setBlockAttrs("b1", { "custom-status": "todo" })
    expect(fetchSyncPost).toHaveBeenLastCalledWith("/api/attr/setBlockAttrs", {
      id: "b1",
      attrs: { "custom-status": "todo" },
    })

    fetchSyncPost.mockResolvedValue(kernelOk("20261109000000-doc"))
    await expect(createDocWithMd("n1", "/Daily/2026-11-09", "# 日记")).resolves.toBe("20261109000000-doc")
    expect(fetchSyncPost).toHaveBeenLastCalledWith("/api/filetree/createDocWithMd", {
      notebook: "n1",
      path: "/Daily/2026-11-09",
      markdown: "# 日记",
    })

    fetchSyncPost.mockResolvedValue(kernelOk("2026/11/09"))
    await expect(renderSprig("{{now | date}}")).resolves.toBe("2026/11/09")
    expect(fetchSyncPost).toHaveBeenLastCalledWith("/api/template/renderSprig", { template: "{{now | date}}" })

    fetchSyncPost.mockResolvedValue(kernelOk([{ doOperations: [] }]))
    await expect(appendBlock("markdown", "# 新块", "doc-1")).resolves.toEqual([{ doOperations: [] }])
    expect(fetchSyncPost).toHaveBeenLastCalledWith("/api/block/appendBlock", {
      dataType: "markdown",
      data: "# 新块",
      parentID: "doc-1",
    })
  })
})
