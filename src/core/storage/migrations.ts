import type { QueryBuilderSnapshot, QueryTemplate, ViewConfig } from "@/core/query/types"

import { QUERY_TEMPLATE_STORAGE_KEY } from "./query-template-store"
import { VIEW_CONFIG_STORAGE_KEY } from "./view-config-store"

export const LEGACY_TEMPLATE_STORAGE_KEY = "query-builder.templates.v1"

interface StorageAdapter {
  loadData(key: string): Promise<unknown>
  saveData(key: string, value: unknown): Promise<void>
  removeData(key: string): Promise<void>
}

function normalizeTemplates(items: QueryTemplate[]) {
  const seen = new Set<string>()
  const normalized: QueryTemplate[] = []
  for (const item of items) {
    if (seen.has(item.id)) {
      continue
    }
    seen.add(item.id)
    normalized.push(item)
  }
  return normalized
}

function normalizeViews(items: ViewConfig[]) {
  const seen = new Set<string>()
  const normalized: ViewConfig[] = []
  for (const item of items) {
    if (seen.has(item.id)) {
      continue
    }
    seen.add(item.id)
    normalized.push(item)
  }
  return normalized
}

export async function migrateLegacyTemplateSnapshots(storage: StorageAdapter) {
  const legacy = await storage.loadData(LEGACY_TEMPLATE_STORAGE_KEY)
  if (!Array.isArray(legacy) || !legacy.length) {
    return
  }

  const currentTemplates = await storage.loadData(QUERY_TEMPLATE_STORAGE_KEY)
  const currentViews = await storage.loadData(VIEW_CONFIG_STORAGE_KEY)
  const hasV2Data = (Array.isArray(currentTemplates) && currentTemplates.length > 0)
    || (Array.isArray(currentViews) && currentViews.length > 0)

  if (hasV2Data) {
    return
  }

  const snapshots = legacy as QueryBuilderSnapshot[]
  const templates = normalizeTemplates(snapshots.map(item => item.template))
  const views = normalizeViews(snapshots.map(item => item.view))

  if (templates.length) {
    await storage.saveData(QUERY_TEMPLATE_STORAGE_KEY, templates)
  }
  if (views.length) {
    await storage.saveData(VIEW_CONFIG_STORAGE_KEY, views)
  }
  await storage.removeData(LEGACY_TEMPLATE_STORAGE_KEY)
}
