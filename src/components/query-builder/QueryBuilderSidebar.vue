<template>
  <aside class="sidebar">
    <div class="sidebar__brand">
      <div class="brand">
        <div class="brand__mark">
          <img
            data-plugin-icon
            :src="pluginIconUrl"
            alt="易搭"
          >
        </div>
        <div class="brand__content">
          <h1 class="hero-title">
            易搭
          </h1>
          <span class="eyebrow eyebrow--hero">
            Query Builder
          </span>
        </div>
      </div>
    </div>

    <!-- 场景仪表板 -->
    <div class="card card--dashboards">
      <div class="section-head">
        <div class="section-head-main">
          <div class="section-head-copy">
            <span class="section-kicker">
              <Sparkles :size="12" class="section-kicker-icon sqb-wireframe-icon" style="fill: none !important;" /> Dashboards
            </span>
            <h2>场景仪表板</h2>
          </div>
          <span
            data-dashboards-count
            class="pill pill--accent"
          >{{ store.dashboards?.length || 0 }}</span>
        </div>
        <button
          v-sqb-tooltip="dashboardsExpanded ? '收起场景仪表板' : '展开场景仪表板'"
          data-section-toggle="dashboards"
          class="section-toggle"
          type="button"
          :aria-label="dashboardsExpanded ? '收起场景仪表板' : '展开场景仪表板'"
          :aria-expanded="String(dashboardsExpanded)"
          @click="dashboardsExpanded = !dashboardsExpanded"
        >
          <ChevronDown
            class="sqb-wireframe-icon"
            style="fill: none !important;"
            :class="{ 'is-expanded': dashboardsExpanded }"
            :size="15"
            :stroke-width="1.75"
          />
        </button>
      </div>
      <div v-if="dashboardsExpanded" class="preset-group__body">
        <button
          v-for="d in (store.dashboards || [])"
          :key="d.id"
          class="item preset-item dashboard-item"
          :class="{ 'preset-item--active': store.activeDashboardId === d.id }"
          @click="store.loadDashboard?.(d.id)"
        >
          <div class="dashboard-item__header">
            <component
              :is="getDashboardIcon(d.id)"
              :size="14"
              class="dashboard-item__icon sqb-wireframe-icon"
              style="fill: none !important;"
            />
            <strong>{{ d.title }}</strong>
          </div>
          <span>{{ d.description }}</span>
        </button>
      </div>
    </div>

    <!-- 预设场景 -->
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
          v-sqb-tooltip="presetsExpanded ? '收起预设场景' : '展开预设场景'"
          data-section-toggle="presets"
          class="section-toggle"
          type="button"
          :aria-label="presetsExpanded ? '收起预设场景' : '展开预设场景'"
          :aria-expanded="String(presetsExpanded)"
          @click="presetsExpanded = !presetsExpanded"
        >
          <ChevronDown
            class="sqb-wireframe-icon"
            style="fill: none !important;"
            :class="{ 'is-expanded': presetsExpanded }"
            :size="15"
            :stroke-width="1.75"
          />
        </button>
      </div>
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
              class="preset-group__icon sqb-wireframe-icon"
              style="fill: none !important;"
              :class="{ 'is-expanded': isPresetCategoryExpanded(group.id) }"
              :size="14"
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

    <!-- 已保存模板 -->
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
            v-sqb-tooltip="'导入模板文件 (.json)'"
            data-template-import-trigger
            class="section-action"
            type="button"
            aria-label="导入模板"
            @click="triggerTemplateImport"
          >
            <Upload
              class="sqb-wireframe-icon"
              style="fill: none !important;"
              :size="15"
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
            v-sqb-tooltip="savedTemplatesExpanded ? '收起已保存模板' : '展开已保存模板'"
            data-section-toggle="saved-templates"
            class="section-toggle"
            type="button"
            :aria-label="savedTemplatesExpanded ? '收起已保存模板' : '展开已保存模板'"
            :aria-expanded="String(savedTemplatesExpanded)"
            @click="savedTemplatesExpanded = !savedTemplatesExpanded"
          >
            <ChevronDown
              class="sqb-wireframe-icon"
              style="fill: none !important;"
              :class="{ 'is-expanded': savedTemplatesExpanded }"
              :size="15"
              :stroke-width="1.75"
            />
          </button>
        </div>
      </div>
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
            v-sqb-tooltip="'导出模板'"
            class="item-action item-action--borderless"
            type="button"
            :data-template-export="summary.templateId"
            aria-label="导出模板"
            @click.stop="exportTemplate(summary.templateId)"
          >
            <Download
              class="sqb-wireframe-icon"
              style="fill: none !important;"
              :size="15"
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
          class="muted muted--empty"
        >
          暂无保存的模板。
        </p>
      </template>
    </div>

    <!-- 历史记录 -->
    <div class="card card--history">
      <div class="section-head">
        <div class="section-head-main">
          <div class="section-head-copy">
            <span class="section-kicker">Recent Queries</span>
            <h2>历史记录</h2>
          </div>
          <span class="pill">{{ store.recentQueryHistory.length }}</span>
        </div>
        <div class="section-head-actions">
          <button
            v-if="store.recentQueryHistory.length"
            v-sqb-tooltip="'清空历史记录'"
            data-history-clear
            class="section-action"
            type="button"
            title="清空历史记录"
            aria-label="清空历史记录"
            @click.stop="store.clearQueryHistory()"
          >
            <Trash2
              class="sqb-wireframe-icon"
              style="fill: none !important;"
              :size="15"
              :stroke-width="1.75"
            />
          </button>
          <button
            v-sqb-tooltip="historyExpanded ? '收起历史记录' : '展开历史记录'"
            data-section-toggle="history"
            class="section-toggle"
            type="button"
            :aria-label="historyExpanded ? '收起历史记录' : '展开历史记录'"
            :aria-expanded="String(historyExpanded)"
            @click="historyExpanded = !historyExpanded"
          >
            <ChevronDown
              class="sqb-wireframe-icon"
              style="fill: none !important;"
              :class="{ 'is-expanded': historyExpanded }"
              :size="15"
              :stroke-width="1.75"
            />
          </button>
        </div>
      </div>
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
          class="muted muted--empty"
        >
          运行查询后将在此记录条件。
        </p>
      </template>
    </div>

    <div class="sidebar-footnote">
      <span class="sidebar-footnote__badge">EasyQuery</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import {
  ChevronDown,
  ChevronRight,
  Download,
  Flame,
  HeartPulse,
  LayoutDashboard,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Upload,
} from "lucide-vue-next"

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
import { vSqbTooltip } from "@/ui/tooltip"

const store = useQueryBuilderStore()

function getDashboardIcon(id: string) {
  switch (id) {
    case "daily-cockpit":
      return LayoutDashboard
    case "habit-tracker":
      return Flame
    case "kb-health":
      return HeartPulse
    case "writing-flow":
      return TrendingUp
    case "project-delivery":
      return Target
    default:
      return LayoutDashboard
  }
}
const dashboardsExpanded = ref(true)
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
  gap: 10px;
  padding: 14px 12px 14px 14px;
  background: var(--sqb-bg);
  border-right: 1px solid var(--sqb-border);
  color: var(--sqb-text);
}

.sidebar__brand {
  padding: 4px 6px 6px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--sqb-primary-soft);
  border: 1px solid var(--sqb-border);
  overflow: hidden;
  flex-shrink: 0;
}

.brand__mark img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.brand__content {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.hero-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--sqb-primary);
  line-height: 1.2;
}

.eyebrow--hero {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font: 600 10px/1.2 var(--sqb-sans);
  color: var(--sqb-text-muted);
}

.card {
  padding: 12px;
  border-radius: 10px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  box-shadow: var(--sqb-shadow-soft);
}

.card--dashboards {
  border-color: var(--sqb-primary-soft);
  background: var(--sqb-surface);
}

h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
}

.muted {
  margin: 0;
  color: var(--sqb-text-muted);
  font: 12px/1.45 var(--sqb-sans);

  &--empty {
    padding: 8px 4px 2px;
    font-size: 11px;
  }
}

.actions,
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.section-head-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.section-head-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-head-copy {
  display: grid;
  gap: 2px;
}

.item,
.item-action,
.section-action,
.section-toggle {
  transition: all 120ms ease;
  cursor: pointer;
  font: 500 12px/1.2 var(--sqb-sans);
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
  border-radius: 6px;
  width: 26px;
  height: 26px;
  padding: 0;

  &:hover {
    color: var(--sqb-primary);
    border-color: var(--sqb-primary);
  }
}

.item-action--borderless {
  border-color: transparent;
  background: transparent;
}

.section-toggle svg {
  transition: transform 140ms ease;
}

.section-toggle svg.is-expanded {
  transform: rotate(180deg);
}

.section-kicker {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--sqb-primary);
  font: 700 10px/1.1 var(--sqb-sans);
}

.preset-group {
  margin-top: 8px;
  padding: 8px 10px;
  border: 1px solid var(--sqb-border);
  border-radius: 8px;
  background: var(--sqb-surface-soft);
}

.preset-group--separated {
  margin-top: 8px;
}

.preset-group__toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
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
  gap: 8px;
}

.preset-group__title {
  min-width: 0;
  color: var(--sqb-primary-strong);
  white-space: nowrap;
  font: 600 12px/1.2 var(--sqb-sans);
}

.preset-group__meta {
  flex: none;
  width: fit-content;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--sqb-primary-soft);
  color: var(--sqb-primary-strong);
  font: 600 10px/1.2 var(--sqb-sans);
  white-space: nowrap;
}

.preset-group__icon {
  width: 14px;
  height: 14px;
  flex: none;
  color: var(--sqb-text-muted);
  transition: transform 140ms ease;
}

.preset-group__icon.is-expanded {
  transform: rotate(90deg);
  color: var(--sqb-primary);
}

.preset-group__body {
  display: grid;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--sqb-border);
}

.preset-item {
  margin-top: 0;
  border-radius: 6px;
  padding: 8px 10px;
  background: var(--sqb-bg);
}

.preset-item strong {
  font: 600 12px/1.3 var(--sqb-sans);
}

.preset-item span {
  color: var(--sqb-text-muted);
  font: 11px/1.4 var(--sqb-sans);
}

.preset-item:hover {
  border-color: var(--sqb-primary);
}

.item {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
  border: 1px solid var(--sqb-border);
  border-radius: 6px;
  padding: 8px 10px;
  margin-top: 6px;
  background: var(--sqb-surface-soft);
  color: var(--sqb-text);
}

.item--row {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0;
  background: transparent;
  text-align: left;
  font: inherit;
  border: none;
  cursor: pointer;
  color: var(--sqb-text);
  transition: color 140ms ease;

  &:hover {
    color: var(--sqb-primary);
  }
}

.item-main__copy {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.item-main__summary {
  color: var(--sqb-text-muted);
  font: 11px/1.3 var(--sqb-sans);
}

.item-delete {
  margin-right: -2px;
}

.item-time {
  color: var(--sqb-text-muted);
  font: 10px/1.3 var(--sqb-sans);
}

.pill {
  min-width: 20px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--sqb-primary-soft);
  color: var(--sqb-primary-strong);
  text-align: center;
  font: 600 11px/1.2 var(--sqb-sans);
}

.pill--accent {
  background: var(--sqb-primary);
  color: #ffffff;
}

.section-kicker-icon {
  display: inline-block;
  vertical-align: -1px;
  margin-right: 2px;
  color: var(--sqb-primary);
}

.dashboard-item__header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dashboard-item__icon {
  color: var(--sqb-primary);
  flex-shrink: 0;
}

.sidebar-footnote {
  padding: 8px 4px 4px;
  margin-top: auto;
  display: flex;
  justify-content: center;
}

.sidebar-footnote__badge {
  font-size: 10px;
  color: var(--sqb-text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.6;
}

.sqb-wireframe-icon,
:deep(svg) {
  fill: none !important;
}

.sqb-wireframe-icon *,
:deep(svg *) {
  fill: none !important;
  stroke: currentColor;
}
</style>
