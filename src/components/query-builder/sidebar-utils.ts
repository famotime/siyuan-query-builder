import type { PresetDefinition } from "@/core/query/catalog"
import type { QueryTemplateBundle } from "@/core/query/types"

type PresetCategory = NonNullable<PresetDefinition["category"]>

const presetCategoryOrder: PresetCategory[] = ["daily", "links", "attributes"]

export const presetCategoryMeta = {
  daily: "日常管理",
  links: "链接管理",
  attributes: "自定义属性",
} satisfies Record<PresetCategory, string>

export function buildPresetGroups(presets: PresetDefinition[]) {
  return presetCategoryOrder
    .map((category, index) => ({
      id: category,
      index,
      label: presetCategoryMeta[category],
      items: presets.filter(preset => preset.category === category),
    }))
    .filter(group => group.items.length)
}

export function formatSidebarViewTypeLabel(type: string) {
  switch (type) {
    case "board":
      return "看板"
    case "list":
      return "列表"
    case "cards":
      return "卡片"
    default:
      return "表格"
  }
}

export function formatSidebarExecutedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export async function readTemplateImportPayload(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) {
    return null
  }

  try {
    return await file.text()
  } finally {
    if (input) {
      input.value = ""
    }
  }
}

export function downloadTemplateBundle(bundle: QueryTemplateBundle, options: {
  createElement?: Document["createElement"]
  url?: Pick<typeof URL, "createObjectURL" | "revokeObjectURL">
} = {}) {
  const url = options.url || URL
  const createElement = options.createElement || document.createElement.bind(document)
  const fileName = `${bundle.template.name || "template"}.json`
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json;charset=utf-8",
  })

  if (typeof url === "undefined" || typeof url.createObjectURL !== "function") {
    return false
  }

  const objectUrl = url.createObjectURL(blob)
  const link = createElement("a")

  link.href = objectUrl
  link.download = fileName
  link.click()
  url.revokeObjectURL(objectUrl)

  return true
}
