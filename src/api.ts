/**
 * Copyright (c) 2023 frostime. All rights reserved.
 * https://github.com/frostime/sy-plugin-template-vite
 *
 * See API Document in [API.md](https://github.com/siyuan-note/siyuan/blob/master/API.md)
 * API 文档见 [API_zh_CN.md](https://github.com/siyuan-note/siyuan/blob/master/API_zh_CN.md)
 *
 * 本插件实际使用的思源内核 API 边界(9 个函数):
 * - lsNotebooks / getNotebookConf            (session-controller、inline/service)
 * - createDocWithMd / getChildBlocks         (session-controller)
 * - setBlockAttrs / appendBlock / sql        (kernel-adapter、session-controller、embed-target-controller)
 * - getBlockByID                             (session-controller、embed-target-controller)
 *
 * 统一错误语义:`request` 在内核返回 code !== 0(或网络失败)时解析为 null,
 * 调用方以 `?.` / 空值兜底处理,不会抛出异常。
 */

import {
  fetchSyncPost,
  IWebSocketData,
} from "siyuan"

async function request(url: string, data: any) {
  const response: IWebSocketData = await fetchSyncPost(url, data)
  const res = response.code === 0 ? response.data : null
  return res
}

// **************************************** Noteboook ****************************************

export async function lsNotebooks(): Promise<IReslsNotebooks> {
  const url = "/api/notebook/lsNotebooks"
  return request(url, "")
}

export async function getNotebookConf(
  notebook: NotebookId,
): Promise<IResGetNotebookConf> {
  const data = { notebook }
  const url = "/api/notebook/getNotebookConf"
  return request(url, data)
}

// **************************************** File Tree ****************************************
export async function createDocWithMd(
  notebook: NotebookId,
  path: string,
  markdown: string,
): Promise<DocumentId> {
  const data = {
    notebook,
    path,
    markdown,
  }
  const url = "/api/filetree/createDocWithMd"
  return request(url, data)
}

export async function getChildBlocks(
  id: BlockId,
): Promise<IResGetChildBlock[]> {
  const data = {
    id,
  }
  const url = "/api/block/getChildBlocks"
  return request(url, data)
}

// **************************************** Blocks ****************************************
export async function appendBlock(
  dataType: DataType,
  data: string,
  parentID: BlockId | DocumentId,
): Promise<IResdoOperations[]> {
  const payload = {
    dataType,
    data,
    parentID,
  }
  const url = "/api/block/appendBlock"
  return request(url, payload)
}

// **************************************** Attributes ****************************************
export async function setBlockAttrs(
  id: BlockId,
  attrs: { [key: string]: string },
) {
  const data = {
    id,
    attrs,
  }
  const url = "/api/attr/setBlockAttrs"
  return request(url, data)
}

// **************************************** SQL ****************************************

export async function sql(sql: string): Promise<Record<string, unknown>[]> {
  const sqldata = {
    stmt: sql,
  }
  const url = "/api/query/sql"
  return request(url, sqldata)
}

export async function getBlockByID(blockId: string): Promise<Block | undefined> {
  const sqlScript = `select * from blocks where id ='${blockId}'`
  const data = await sql(sqlScript)
  // 内核返回的行是动态数据,Record → Block 需经 unknown 中转
  return (data?.[0] ?? undefined) as unknown as Block | undefined
}

// **************************************** Template ****************************************

export async function renderSprig(template: string): Promise<string> {
  const url = "/api/template/renderSprig"
  return request(url, { template })
}
