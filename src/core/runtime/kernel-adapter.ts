import { appendBlock, setBlockAttrs, sql } from "@/api"

export const kernelAdapter = {
  sql,
  setBlockAttrs,
  appendBlock,
}
