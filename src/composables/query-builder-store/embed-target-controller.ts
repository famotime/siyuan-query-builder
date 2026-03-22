import { watch, type Ref } from "vue"

import { getBlockByID } from "@/api"
import {
  createEmbedTargetPreview,
  formatEmbedTargetHint,
  getOpenDocumentTargets,
  isLikelyBlockId,
  normalizeRecentEmbedTargetIds,
  summarizeBlockLabel,
  type ActiveDocumentTarget,
  type EmbedTargetPreview,
} from "@/core/embed-target"
import { showMessage } from "@/external/siyuan"

import { EMBED_TARGET_PREFS_KEY, type EmbedTargetPrefs } from "./shared"

interface StorageAdapter {
  loadData(key: string): Promise<unknown>
  saveData(key: string, value: unknown): Promise<void>
}

interface EmbedTargetControllerOptions {
  plugin: StorageAdapter
  embedParentId: Ref<string>
  embedTargetHint: Ref<string>
  embedTargetPreview: Ref<EmbedTargetPreview | null>
  currentDocumentTarget: Ref<ActiveDocumentTarget | null>
  openDocumentTargets: Ref<ActiveDocumentTarget[]>
  recentEmbedTargets: Ref<EmbedTargetPreview[]>
}

export function createEmbedTargetController(options: EmbedTargetControllerOptions) {
  const {
    plugin,
    embedParentId,
    embedTargetHint,
    embedTargetPreview,
    currentDocumentTarget,
    openDocumentTargets,
    recentEmbedTargets,
  } = options

  const recentEmbedTargetIds = { value: [] as string[] }
  let embedTargetResolveToken = 0

  async function resolveDocumentTarget(target: ActiveDocumentTarget) {
    if (target.title !== target.id) {
      return target
    }

    try {
      const block = await getBlockByID(target.id)
      return {
        id: target.id,
        title: summarizeBlockLabel(String(block?.content || block?.name || target.id), 40) || target.id,
      } satisfies ActiveDocumentTarget
    } catch {
      return target
    }
  }

  async function lookupEmbedTargetPreview(id: string) {
    if (!isLikelyBlockId(id)) {
      return null
    }

    try {
      const block = await getBlockByID(id)
      return createEmbedTargetPreview(block, id)
    } catch {
      return null
    }
  }

  async function refreshRecentEmbedTargets(ids = recentEmbedTargetIds.value) {
    const normalized = normalizeRecentEmbedTargetIds(ids)
    recentEmbedTargetIds.value = normalized
    recentEmbedTargets.value = await Promise.all(normalized.map(async (id) => {
      const preview = await lookupEmbedTargetPreview(id)
      if (preview) {
        return preview
      }
      return {
        id,
        type: "block",
        title: id,
        content: "未找到对应块或文档",
      } satisfies EmbedTargetPreview
    }))
  }

  async function refreshCurrentDocumentTarget() {
    const targets = getOpenDocumentTargets(window)
    openDocumentTargets.value = await Promise.all(targets.map(resolveDocumentTarget))
    currentDocumentTarget.value = openDocumentTargets.value[0] || null
  }

  async function persistEmbedTargetPrefs() {
    await plugin.saveData(EMBED_TARGET_PREFS_KEY, {
      lastParentId: embedParentId.value.trim(),
      recentParentIds: recentEmbedTargetIds.value,
    })
  }

  async function rememberEmbedTarget(value: string) {
    const id = value.trim()
    const next = normalizeRecentEmbedTargetIds([id, ...recentEmbedTargetIds.value])
    const changed = next.join("|") !== recentEmbedTargetIds.value.join("|")
    recentEmbedTargetIds.value = next
    await persistEmbedTargetPrefs()
    if (changed) {
      await refreshRecentEmbedTargets(next)
    }
  }

  async function resolveEmbedTargetPreview(value: string) {
    const id = value.trim()
    const token = ++embedTargetResolveToken
    embedTargetPreview.value = null

    if (!id) {
      embedTargetHint.value = currentDocumentTarget.value
        ? `当前文档：${currentDocumentTarget.value.title}`
        : "可输入父块或文档 ID，或下拉选择当前打开文档"
      return
    }

    if (!isLikelyBlockId(id)) {
      embedTargetHint.value = "输入完整 ID 后显示文档标题或块内容"
      return
    }

    try {
      const preview = await lookupEmbedTargetPreview(id)
      if (token !== embedTargetResolveToken || embedParentId.value.trim() !== id) {
        return
      }

      if (!preview) {
        embedTargetHint.value = "未找到该 ID 对应的块或文档"
        return
      }

      embedTargetPreview.value = preview
      embedTargetHint.value = formatEmbedTargetHint(preview)
    } catch {
      if (token !== embedTargetResolveToken || embedParentId.value.trim() !== id) {
        return
      }
      embedTargetHint.value = "未找到该 ID 对应的块或文档"
    }
  }

  async function initializeEmbedTargets() {
    await refreshCurrentDocumentTarget()
    const prefs = await plugin.loadData(EMBED_TARGET_PREFS_KEY) as EmbedTargetPrefs | null
    embedParentId.value = typeof prefs?.lastParentId === "string" ? prefs.lastParentId : ""
    recentEmbedTargetIds.value = normalizeRecentEmbedTargetIds(prefs?.recentParentIds || [])
    await refreshRecentEmbedTargets(recentEmbedTargetIds.value)
    await resolveEmbedTargetPreview(embedParentId.value)
  }

  async function selectEmbedTarget(targetId: string) {
    const id = targetId.trim()
    if (!id) {
      return false
    }
    embedParentId.value = id
    await rememberEmbedTarget(id)
    return true
  }

  async function selectCurrentDocumentTarget() {
    await refreshCurrentDocumentTarget()
    if (!currentDocumentTarget.value) {
      showMessage("未找到当前打开的文档", 3500, "error")
      return false
    }
    await selectEmbedTarget(currentDocumentTarget.value.id)
    return true
  }

  watch(embedParentId, async value => {
    await persistEmbedTargetPrefs()
    await resolveEmbedTargetPreview(value)
  })

  return {
    initializeEmbedTargets,
    rememberEmbedTarget,
    refreshCurrentDocumentTarget,
    refreshRecentEmbedTargets,
    resolveEmbedTargetPreview,
    selectCurrentDocumentTarget,
    selectEmbedTarget,
  }
}
