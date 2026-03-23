<template>
  <aside class="sidebar">
    <div class="card card--hero">
      <div class="brand">
        <div class="brand__mark">
          QB
        </div>
        <div class="brand__content">
          <p class="eyebrow">
            Query builder
          </p>
          <h1>易搭</h1>
        </div>
      </div>
      <p class="muted">
        先定义范围和条件，再切到表格、看板或统计视图，并继续回写块属性。
      </p>
    </div>

    <div class="card">
      <div class="section-head">
        <div class="section-head-main">
          <div class="section-head-copy">
            <span class="section-kicker">Scene Presets</span>
            <h2>预设场景</h2>
          </div>
          <span
            data-presets-count
            class="pill"
          >{{ store.presets.length }}</span>
        </div>
        <button
          data-section-toggle="presets"
          class="section-toggle"
          type="button"
          :title="presetsExpanded ? '收起预设场景' : '展开预设场景'"
          :aria-label="presetsExpanded ? '收起预设场景' : '展开预设场景'"
          :aria-expanded="String(presetsExpanded)"
          @click="presetsExpanded = !presetsExpanded"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            :class="{ 'is-expanded': presetsExpanded }"
          >
            <path
              d="M7 10l5 5 5-5"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.2"
            />
          </svg>
        </button>
      </div>
      <p class="section-copy">
        直接加载常用查询草稿，快速开始当前工作流。
      </p>
      <template v-if="presetsExpanded">
        <button
          v-for="preset in store.presets"
          :key="preset.id"
          class="item"
          @click="store.applySnapshot(preset.snapshot)"
        >
          <strong>{{ preset.title }}</strong>
          <span>{{ preset.description }}</span>
        </button>
      </template>
    </div>

    <div class="card">
      <div class="section-head">
        <div class="section-head-main">
          <div class="section-head-copy">
            <span class="section-kicker">Saved Templates</span>
            <h2>已保存模板</h2>
          </div>
          <span class="pill">{{ store.savedTemplateSummaries.length }}</span>
        </div>
        <div class="section-head-actions">
          <button
            data-template-import-trigger
            class="section-action"
            type="button"
            title="导入模板"
            aria-label="导入模板"
            @click="triggerTemplateImport"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
              />
            </svg>
          </button>
          <input
            ref="templateImportInput"
            data-template-import-input
            class="visually-hidden"
            type="file"
            accept="application/json,.json"
            @change="handleTemplateImport"
          >
          <button
            data-section-toggle="saved-templates"
            class="section-toggle"
            type="button"
            :title="savedTemplatesExpanded ? '收起已保存模板' : '展开已保存模板'"
            :aria-label="savedTemplatesExpanded ? '收起已保存模板' : '展开已保存模板'"
            :aria-expanded="String(savedTemplatesExpanded)"
            @click="savedTemplatesExpanded = !savedTemplatesExpanded"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              :class="{ 'is-expanded': savedTemplatesExpanded }"
            >
              <path
                d="M7 10l5 5 5-5"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.2"
              />
            </svg>
          </button>
        </div>
      </div>
      <p class="section-copy">
        保留你已经验证过的查询方案，随时恢复视图配置和字段映射。
      </p>
      <template v-if="savedTemplatesExpanded">
        <div
          v-for="summary in store.savedTemplateSummaries"
          :key="summary.templateId"
          class="item item--row"
        >
          <button
            class="item-main"
            type="button"
            :data-template-load="summary.templateId"
            :data-active="String(store.currentTemplateId === summary.templateId)"
            @click="store.loadTemplate(summary.templateId)"
          >
            <span class="item-main__copy">
              <strong>{{ summary.templateName }}</strong>
              <span>默认：{{ viewTypeLabel(summary.defaultViewType) }}</span>
            </span>
            <span class="item-main__meta">{{ summary.viewCount }} 个视图</span>
          </button>
          <button
            class="item-action"
            type="button"
            :data-template-export="summary.templateId"
            title="导出模板"
            aria-label="导出模板"
            @click.stop="exportTemplate(summary.templateId)"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M12 20V10m0 0 4 4m-4-4-4 4M5 6h14"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
              />
            </svg>
          </button>
          <DeleteIconButton
            :data-template-delete="summary.templateId"
            class="item-delete"
            title="删除模板"
            aria-label="删除模板"
            @click.stop="store.deleteTemplate(summary.templateId)"
          />
        </div>
        <p
          v-if="!store.savedTemplateSummaries.length"
          class="muted"
        >
          先保存一个查询模板。
        </p>
      </template>
    </div>

    <div class="card card--history">
      <div class="section-head">
        <div class="section-head-main">
          <div class="section-head-copy">
            <span class="section-kicker">Recent Queries</span>
            <h2>历史记录</h2>
          </div>
          <span class="pill">{{ store.recentQueryHistory.length }}</span>
        </div>
        <button
          data-section-toggle="history"
          class="section-toggle"
          type="button"
          :title="historyExpanded ? '收起历史记录' : '展开历史记录'"
          :aria-label="historyExpanded ? '收起历史记录' : '展开历史记录'"
          :aria-expanded="String(historyExpanded)"
          @click="historyExpanded = !historyExpanded"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            :class="{ 'is-expanded': historyExpanded }"
          >
            <path
              d="M7 10l5 5 5-5"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.2"
            />
          </svg>
        </button>
      </div>
      <p class="section-copy">
        保留最近 10 次运行过的查询条件，方便快速回到刚刚验证过的筛选组合。
      </p>
      <template v-if="historyExpanded">
        <button
          v-for="entry in store.recentQueryHistory"
          :key="entry.id"
          class="item"
          type="button"
          :data-history-load="entry.id"
          @click="store.restoreQueryHistory(entry.id)"
        >
          <strong>{{ entry.templateName }}</strong>
          <span>{{ entry.summary }}</span>
          <span class="item-time">{{ formatExecutedAt(entry.executedAt) }}</span>
        </button>
        <p
          v-if="!store.recentQueryHistory.length"
          class="muted"
        >
          运行过查询后，这里会保留最近 10 次条件。
        </p>
      </template>
    </div>

    <div class="sidebar-footnote">
      <span class="sidebar-footnote__title">Workspace Note</span>
      <p>QUINCYZOU 2026</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from "vue"

import DeleteIconButton from "@/components/query-builder/DeleteIconButton.vue"
import { useQueryBuilderStore } from "@/composables/query-builder-store"

const store = useQueryBuilderStore()
const presetsExpanded = ref(true)
const historyExpanded = ref(true)
const savedTemplatesExpanded = ref(true)
const templateImportInput = ref<HTMLInputElement | null>(null)

function viewTypeLabel(type: string) {
  switch (type) {
    case "board":
      return "看板"
    case "list":
      return "列表"
    case "cards":
      return "统计卡片"
    default:
      return "表格"
  }
}

function formatExecutedAt(value: string) {
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

function triggerTemplateImport() {
  templateImportInput.value?.click()
}

async function handleTemplateImport(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) {
    return
  }

  try {
    const payload = await file.text()
    await store.importTemplateBundle(payload)
  } finally {
    if (input) {
      input.value = ""
    }
  }
}

async function exportTemplate(templateId: string) {
  const bundle = await store.exportTemplateBundle(templateId)
  const fileName = `${bundle.template.name || "template"}.json`
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json;charset=utf-8",
  })

  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    return
  }

  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = fileName
  link.click()
  URL.revokeObjectURL(objectUrl)
}
</script>

<style lang="scss" scoped>
.sidebar {
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 14px 18px 18px;
  background: var(--sqb-surface-soft);
  border-right: 1px solid var(--sqb-border);
  color: var(--sqb-text);
}

.card {
  padding: 16px;
  border-radius: 16px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  box-shadow: var(--sqb-shadow-soft);
}

.card--hero {
  background:
    radial-gradient(circle at top right, rgba(120, 168, 134, 0.18), transparent 42%),
    linear-gradient(160deg, rgba(241, 236, 228, 0.98), rgba(232, 239, 231, 0.94)),
    var(--sqb-surface);
  border-color: var(--sqb-border-strong);
}

.card--history {
  margin-top: auto;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font: 700 11px/1.3 var(--sqb-sans);
  color: var(--sqb-primary);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.brand__mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(120, 168, 134, 0.28), rgba(216, 240, 222, 0.88));
  color: var(--sqb-primary-strong);
  font: 700 14px/1 var(--sqb-sans);
  letter-spacing: 0.08em;
}

.brand__content {
  min-width: 0;
}

h1 {
  font-size: 22px;
  line-height: 1.1;
  font-family: var(--sqb-serif);
}

h2 {
  margin: 0;
  font-size: 15px;
  line-height: 1.3;
  font-family: var(--sqb-serif);
}

.muted {
  margin: 0;
  color: var(--sqb-text-muted);
  font: 13px/1.55 var(--sqb-sans);
}

.actions,
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.section-head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-head-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-head-copy,
.section-head-main--block {
  display: grid;
  gap: 4px;
}

.item,
.item-action,
.section-action,
.section-toggle {
  transition: background 80ms ease, border-color 80ms ease, color 80ms ease;
  cursor: pointer;
  font: 600 13px/1.2 var(--sqb-sans);
}

.item:hover,
.item-action:hover,
.section-action:hover,
.section-toggle:hover {
  background: var(--sqb-bg-strong);
}

.item-action,
.section-action,
.section-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--sqb-surface-soft);
  color: var(--sqb-text-muted);
  border: 1px solid var(--sqb-border);
}

.section-action,
.item-action {
  height: 28px;
  width: 28px;
  padding: 0;
  border-radius: 8px;
}

.section-toggle {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 8px;
}

.section-action svg,
.item-action svg,
.section-toggle svg {
  width: 16px;
  height: 16px;
  transition: transform 140ms ease;
}

.section-toggle svg.is-expanded {
  transform: rotate(180deg);
}

.section-kicker {
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--sqb-primary);
  font: 700 11px/1.2 var(--sqb-sans);
}

.section-copy {
  margin: 10px 0 0;
  color: var(--sqb-text-muted);
  font: 13px/1.5 var(--sqb-sans);
}

.item {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  border: 1px solid var(--sqb-border);
  border-radius: 12px;
  padding: 10px 12px;
  margin-top: 8px;
  background: var(--sqb-surface-soft);
  color: var(--sqb-text);
}

.item--row {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.item-main {
  transition: transform 140ms ease, background 140ms ease, border-color 140ms ease, color 140ms ease;
  cursor: pointer;
  color: var(--sqb-text);
}

.item-main:hover {
  color: var(--sqb-primary);
}

.item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0;
  background: transparent;
  text-align: left;
  font: inherit;
  border: none;
}

.item-main__copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.item-main__meta {
  flex: 0 0 auto;
  color: var(--sqb-text-muted);
  font: 12px/1.4 var(--sqb-sans);
}

.item-delete {
  margin-right: -2px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.item-time {
  color: var(--sqb-text-muted);
  font: 12px/1.4 var(--sqb-sans);
}

.pill {
  min-width: 24px;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--sqb-primary-soft);
  color: var(--sqb-primary-strong);
  text-align: center;
  font: 700 12px/1.2 var(--sqb-sans);
}

.sidebar-footnote {
  padding: 0 6px 4px;
  color: var(--sqb-text-muted);
}

.sidebar-footnote__title {
  display: block;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--sqb-secondary);
  font: 700 11px/1.2 var(--sqb-sans);
}

.sidebar-footnote p {
  margin: 0;
  font: 13px/1.5 var(--sqb-sans);
}

@media (max-width: 720px) {
  .sidebar {
    padding: 16px;
  }

  .brand {
    align-items: flex-start;
  }
}
</style>
