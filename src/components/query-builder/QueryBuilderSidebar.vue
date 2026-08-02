<template>
  <aside class="sidebar">
    <div class="card card--hero">
      <div class="brand">
        <div class="brand__mark">
          <img
            data-plugin-icon
            :src="pluginIconUrl"
            alt="思源易搭 Query Builder"
          >
        </div>
        <div class="brand__content">
          <p class="eyebrow eyebrow--hero">
            Query builder
          </p>
          <h1 class="hero-title">
            易搭
          </h1>
        </div>
      </div>
      <p class="muted muted--hero">
        不要让 SQL 成为你探索笔记的阻碍。
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
          <ChevronDown
            :class="{ 'is-expanded': presetsExpanded }"
            :size="16"
            :stroke-width="1.75"
          />
        </button>
      </div>
      <p class="section-copy">
        直接加载常用查询草稿，快速开始当前工作流。
      </p>
      <template v-if="presetsExpanded">
        <section
          v-for="group in presetGroups"
          :key="group.id"
          class="preset-group"
          :class="{ 'preset-group--separated': group.index > 0 }"
          :data-preset-category="group.id"
        >
          <button
            :data-preset-category-toggle="group.id"
            class="preset-group__toggle"
            type="button"
            :aria-expanded="String(isPresetCategoryExpanded(group.id))"
            @click="togglePresetCategory(group.id)"
          >
            <span class="preset-group__heading">
              <span class="preset-group__title">{{ group.label }}</span>
              <span class="preset-group__meta">{{ group.items.length }}</span>
            </span>
            <ChevronRight
              :data-preset-category-icon="group.id"
              class="preset-group__icon"
              :class="{ 'is-expanded': isPresetCategoryExpanded(group.id) }"
              :size="15"
              :stroke-width="1.75"
            />
          </button>
          <div
            v-if="isPresetCategoryExpanded(group.id)"
            class="preset-group__body"
          >
            <button
              v-for="preset in group.items"
              :key="preset.id"
              class="item preset-item"
              @click="store.applySnapshot(preset.snapshot)"
            >
              <strong>{{ preset.title }}</strong>
              <span>{{ preset.description }}</span>
            </button>
          </div>
        </section>
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
            <Upload
              :size="16"
              :stroke-width="1.75"
            />
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
            <ChevronDown
              :class="{ 'is-expanded': savedTemplatesExpanded }"
              :size="16"
              :stroke-width="1.75"
            />
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
              <span
                :data-template-summary="summary.templateId"
                class="item-main__summary"
              >默认：{{ viewTypeLabel(summary.defaultViewType) }} · {{ summary.viewCount }} 个视图</span>
            </span>
          </button>
          <button
            class="item-action item-action--borderless"
            type="button"
            :data-template-export="summary.templateId"
            title="导出模板"
            aria-label="导出模板"
            @click.stop="exportTemplate(summary.templateId)"
          >
            <Download
              :size="16"
              :stroke-width="1.75"
            />
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
          <ChevronDown
            :class="{ 'is-expanded': historyExpanded }"
            :size="16"
            :stroke-width="1.75"
          />
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
import { computed, reactive, ref } from "vue"
import { ChevronDown, ChevronRight, Download, Upload } from "lucide-vue-next"

import pluginIconUrl from "../../../icon.png?url"
import DeleteIconButton from "@/components/query-builder/DeleteIconButton.vue"
import { useQueryBuilderStore } from "@/composables/query-builder-store"
import {
  buildPresetGroups,
  downloadTemplateBundle,
  formatSidebarExecutedAt,
  formatSidebarViewTypeLabel,
  readTemplateImportPayload,
} from "@/components/query-builder/sidebar-utils"

const store = useQueryBuilderStore()
const presetsExpanded = ref(true)
const historyExpanded = ref(true)
const savedTemplatesExpanded = ref(true)
const templateImportInput = ref<HTMLInputElement | null>(null)
const presetCategoryExpanded = reactive<Record<string, boolean>>({
  daily: true,
  links: true,
  attributes: true,
})

const presetGroups = computed(() => buildPresetGroups(store.presets))

function viewTypeLabel(type: string) {
  return formatSidebarViewTypeLabel(type)
}

function formatExecutedAt(value: string) {
  return formatSidebarExecutedAt(value)
}

function triggerTemplateImport() {
  templateImportInput.value?.click()
}

function togglePresetCategory(category: string) {
  presetCategoryExpanded[category] = !presetCategoryExpanded[category]
}

function isPresetCategoryExpanded(category: string) {
  return presetCategoryExpanded[category] !== false
}

async function handleTemplateImport(event: Event) {
  const payload = await readTemplateImportPayload(event)
  if (!payload) {
    return
  }

  await store.importTemplateBundle(payload)
}

async function exportTemplate(templateId: string) {
  const bundle = await store.exportTemplateBundle(templateId)
  downloadTemplateBundle(bundle)
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
    radial-gradient(circle at top right, rgba(45, 106, 79, 0.12), transparent 42%),
    radial-gradient(circle at bottom left, rgba(196, 147, 53, 0.1), transparent 36%),
    linear-gradient(165deg, rgba(255, 255, 255, 0.98), rgba(240, 245, 242, 0.96));
  border-color: var(--sqb-border);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 8px 24px rgba(27, 67, 50, 0.05);
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font: 700 11px/1.3 var(--sqb-sans);
  color: var(--sqb-primary);
}

.eyebrow--hero {
  margin-bottom: 6px;
  color: var(--sqb-primary);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.brand__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(45, 106, 79, 0.14), rgba(45, 106, 79, 0.06));
  border: 1px solid var(--sqb-border);
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.brand__mark img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.brand__content {
  min-width: 0;
}

h1 {
  font-size: 22px;
  line-height: 1.1;
  font-family: var(--sqb-serif);
}

.hero-title {
  margin: 0;
  color: var(--sqb-primary-strong);
  letter-spacing: 0.02em;
}

.hero-subtitle {
  margin: 6px 0 0;
  color: var(--sqb-text-muted);
  font: 600 12px/1.35 var(--sqb-sans);
  letter-spacing: 0.08em;
  text-transform: uppercase;
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

.muted--hero {
  color: var(--sqb-text-muted);
}

.b3-theme-dark .card--hero,
.b3-theme-dark.card--hero,
[data-sqb-theme="dark"] .card--hero {
  background:
    radial-gradient(circle at top right, rgba(120, 168, 134, 0.18), transparent 38%),
    radial-gradient(circle at bottom left, rgba(196, 166, 106, 0.12), transparent 34%),
    linear-gradient(165deg, rgba(42, 49, 45, 0.98), rgba(29, 34, 32, 0.98));
  border-color: rgba(154, 178, 160, 0.22);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 16px 36px rgba(14, 19, 17, 0.26);
}

.b3-theme-dark .eyebrow--hero,
[data-sqb-theme="dark"] .eyebrow--hero {
  color: rgba(186, 213, 193, 0.88);
}

.b3-theme-dark .hero-title,
[data-sqb-theme="dark"] .hero-title {
  color: rgba(248, 250, 248, 0.96);
}

.b3-theme-dark .muted--hero,
[data-sqb-theme="dark"] .muted--hero {
  color: rgba(210, 219, 213, 0.86);
}

.b3-theme-dark .brand__mark,
[data-sqb-theme="dark"] .brand__mark {
  background: linear-gradient(135deg, rgba(120, 168, 134, 0.28), rgba(88, 109, 95, 0.82));
  border-color: rgba(190, 214, 196, 0.14);
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

.item-action--borderless {
  border-color: transparent;
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

.preset-group {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--sqb-border-strong);
  border-radius: 18px;
  background:
    linear-gradient(180deg, var(--sqb-primary-soft) 0%, rgba(0, 0, 0, 0) 100%),
    var(--sqb-surface-soft);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

.preset-group--separated {
  margin-top: 14px;
}

.preset-group__toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--sqb-primary-strong);
  cursor: pointer;
  text-align: left;
  font: inherit;
}

.preset-group__heading {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preset-group__title {
  min-width: 0;
  color: var(--sqb-primary-strong);
  letter-spacing: 0.04em;
  white-space: nowrap;
  font: 700 14px/1.18 var(--sqb-serif);
}

.preset-group__meta {
  flex: none;
  width: fit-content;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--sqb-primary-soft);
  color: var(--sqb-primary-strong);
  font: 700 11px/1.2 var(--sqb-sans);
  white-space: nowrap;
}

.preset-group__icon {
  width: 15px;
  height: 15px;
  flex: none;
  color: var(--sqb-primary-strong);
  transition: transform 140ms ease, color 140ms ease;
}

.preset-group__icon.is-expanded {
  transform: rotate(90deg);
  color: var(--sqb-primary);
}

.preset-group__body {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--sqb-border);
}

.preset-item {
  margin-top: 0;
  border-radius: 14px;
  padding: 12px 14px;
  background: var(--sqb-bg);
}

.preset-item strong {
  font: 600 13px/1.35 var(--sqb-sans);
}

.preset-item span {
  color: var(--sqb-text-muted);
  font: 12px/1.5 var(--sqb-sans);
}

.preset-item:hover {
  border-color: var(--sqb-primary);
  transform: translateY(-1px);
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

.item-main__summary {
  color: var(--sqb-text-muted);
  font: 12px/1.4 var(--sqb-sans);
  font-weight: 400;
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
