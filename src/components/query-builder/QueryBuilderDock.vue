<template>
  <div class="sqb-dock">
    <header class="sqb-dock__header">
      <div class="sqb-dock__brand">
        <img
          class="sqb-dock__icon"
          :src="pluginIconUrl"
          alt="易搭"
        >
        <div class="sqb-dock__title-wrap">
          <h2 class="sqb-dock__title">
            易搭
          </h2>
          <span class="sqb-dock__subtitle">Query Builder</span>
        </div>
      </div>
      <div class="sqb-dock__header-actions">
        <button
          class="sqb-dock__btn-icon"
          title="在工作台页签中打开"
          aria-label="在工作台页签中打开"
          @click="openInWorkspace('tab')"
        >
          <Maximize2 :size="15" />
        </button>
        <button
          class="sqb-dock__btn-icon"
          title="在弹窗中打开"
          aria-label="在弹窗中打开"
          @click="openInWorkspace('dialog')"
        >
          <Layers :size="15" />
        </button>
      </div>
    </header>

    <main class="sqb-dock__body">
      <!-- 场景仪表板专区 -->
      <section class="sqb-dock__section">
        <div class="sqb-dock__section-head" @click="dashboardsExpanded = !dashboardsExpanded">
          <div class="sqb-dock__section-title">
            <Sparkles class="sqb-dock__accent-icon" :size="15" />
            <span>场景仪表板</span>
            <span class="sqb-dock__badge">{{ dashboards.length }}</span>
          </div>
          <ChevronDown
            class="sqb-dock__chevron"
            :class="{ 'is-expanded': dashboardsExpanded }"
            :size="15"
          />
        </div>
        <p v-if="dashboardsExpanded" class="sqb-dock__section-desc">
          开箱即用的工作台与多维大盘，点击直接在工作台打开。
        </p>
        <div v-if="dashboardsExpanded" class="sqb-dock__list">
          <button
            v-for="d in dashboards"
            :key="d.id"
            class="sqb-dock__item sqb-dock__item--dashboard"
            @click="openDashboard(d.id)"
          >
            <div class="sqb-dock__item-icon-wrap">
              <component :is="getDashboardIcon(d.id)" :size="16" />
            </div>
            <div class="sqb-dock__item-text">
              <span class="sqb-dock__item-title">{{ d.title }}</span>
              <span class="sqb-dock__item-desc">{{ d.description }}</span>
            </div>
          </button>
        </div>
      </section>

      <!-- 快速新建查询 -->
      <div class="sqb-dock__quick-create">
        <button class="sqb-dock__create-btn" @click="openInWorkspace()">
          <Plus :size="15" />
          <span>新建查询</span>
        </button>
      </div>

      <!-- 预设场景 -->
      <section class="sqb-dock__section">
        <div class="sqb-dock__section-head" @click="presetsExpanded = !presetsExpanded">
          <div class="sqb-dock__section-title">
            <Compass :size="15" />
            <span>预设场景</span>
            <span class="sqb-dock__badge">{{ allPresets.length }}</span>
          </div>
          <ChevronDown
            class="sqb-dock__chevron"
            :class="{ 'is-expanded': presetsExpanded }"
            :size="15"
          />
        </div>
        <div v-if="presetsExpanded" class="sqb-dock__list">
          <button
            v-for="preset in allPresets"
            :key="preset.id"
            class="sqb-dock__item"
            @click="openPreset(preset)"
          >
            <div class="sqb-dock__item-text">
              <span class="sqb-dock__item-title">{{ preset.title }}</span>
              <span class="sqb-dock__item-desc">{{ preset.description }}</span>
            </div>
          </button>
        </div>
      </section>

      <!-- 已保存模板 -->
      <section v-if="savedTemplates.length" class="sqb-dock__section">
        <div class="sqb-dock__section-head" @click="templatesExpanded = !templatesExpanded">
          <div class="sqb-dock__section-title">
            <Bookmark :size="15" />
            <span>已保存模板</span>
            <span class="sqb-dock__badge">{{ savedTemplates.length }}</span>
          </div>
          <ChevronDown
            class="sqb-dock__chevron"
            :class="{ 'is-expanded': templatesExpanded }"
            :size="15"
          />
        </div>
        <div v-if="templatesExpanded" class="sqb-dock__list">
          <button
            v-for="tmpl in savedTemplates"
            :key="tmpl.id"
            class="sqb-dock__item"
            @click="openTemplate(tmpl.id)"
          >
            <div class="sqb-dock__item-text">
              <span class="sqb-dock__item-title">{{ tmpl.name }}</span>
              <span class="sqb-dock__item-desc">{{ tmpl.viewType || 'table' }}</span>
            </div>
          </button>
        </div>
      </section>

      <!-- 最近查询历史 -->
      <section v-if="recentHistory.length" class="sqb-dock__section">
        <div class="sqb-dock__section-head" @click="historyExpanded = !historyExpanded">
          <div class="sqb-dock__section-title">
            <History :size="15" />
            <span>最近查询</span>
            <span class="sqb-dock__badge">{{ recentHistory.length }}</span>
          </div>
          <ChevronDown
            class="sqb-dock__chevron"
            :class="{ 'is-expanded': historyExpanded }"
            :size="15"
          />
        </div>
        <div v-if="historyExpanded" class="sqb-dock__list">
          <button
            v-for="h in recentHistory"
            :key="h.id"
            class="sqb-dock__item"
            @click="openPreset({ snapshot: h.snapshot })"
          >
            <div class="sqb-dock__item-text">
              <span class="sqb-dock__item-title">{{ h.templateName }}</span>
              <span class="sqb-dock__item-desc">{{ h.summary }}</span>
            </div>
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import {
  Bookmark,
  ChevronDown,
  Compass,
  Flame,
  HeartPulse,
  History,
  Layers,
  LayoutDashboard,
  Maximize2,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-vue-next"

import pluginIconUrl from "../../../icon.png?url"
import { SCENARIO_DASHBOARDS } from "@/core/dashboard/catalog"
import { createPresets, DEFAULT_FIELD_MAPPINGS } from "@/core/query/catalog"
import { QUERY_HISTORY_STORAGE_KEY } from "@/core/storage/query-history-store"
import { QUERY_TEMPLATE_STORAGE_KEY } from "@/core/storage/query-template-store"
import {
  openDashboardTab,
  openWorkspaceWithDashboard,
  openWorkspaceWithPreset,
  openWorkspaceWithTemplate,
  usePlugin,
} from "@/main"

const dashboards = ref(SCENARIO_DASHBOARDS)
const allPresets = ref(createPresets(DEFAULT_FIELD_MAPPINGS))
const savedTemplates = ref<Array<{ id: string, name: string, viewType?: string }>>([])
const recentHistory = ref<Array<{ id: string, templateName: string, summary: string, snapshot: any }>>([])

const dashboardsExpanded = ref(true)
const presetsExpanded = ref(false)
const templatesExpanded = ref(true)
const historyExpanded = ref(false)

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

async function loadStorageData() {
  try {
    const plugin = usePlugin()
    const templates = await plugin.loadData(QUERY_TEMPLATE_STORAGE_KEY)
    if (templates && typeof templates === "object") {
      savedTemplates.value = Object.values(templates).filter(Boolean) as any[]
    }
    const history = await plugin.loadData(QUERY_HISTORY_STORAGE_KEY)
    if (Array.isArray(history)) {
      recentHistory.value = history.slice(0, 8)
    }
  } catch (err) {
    console.debug("[SQB Dock] load storage data failed", err)
  }
}

onMounted(() => {
  void loadStorageData()
})

function openInWorkspace(mode?: "dialog" | "tab") {
  void openWorkspaceWithDashboard("", mode)
}

function openDashboard(dashboardId: string) {
  void openDashboardTab(dashboardId)
}

function openPreset(preset: { snapshot: any }) {
  void openWorkspaceWithPreset(preset.snapshot)
}

function openTemplate(templateId: string) {
  void openWorkspaceWithTemplate(templateId)
}
</script>

<style lang="scss" scoped>
.sqb-dock {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background, #fff);
  color: var(--b3-theme-on-background, #333);
  font-family: var(--sqb-sans, sans-serif);
  overflow: hidden;
  user-select: none;
}

.sqb-dock__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--b3-theme-surface-lighter, rgba(0, 0, 0, 0.08));
  flex-shrink: 0;
}

.sqb-dock__brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sqb-dock__icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.sqb-dock__title-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.sqb-dock__title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--b3-theme-primary, #3b82f6);
}

.sqb-dock__subtitle {
  font-size: 11px;
  color: var(--b3-theme-on-surface, #888);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sqb-dock__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sqb-dock__btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface, #666);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--b3-theme-surface-lighter, rgba(0, 0, 0, 0.06));
    color: var(--b3-theme-primary, #3b82f6);
  }
}

.sqb-dock__body {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sqb-dock__quick-create {
  flex-shrink: 0;
}

.sqb-dock__create-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 6px;
  border: 1px dashed var(--b3-theme-primary, #3b82f6);
  background: var(--b3-theme-surface-lighter, rgba(59, 130, 246, 0.04));
  color: var(--b3-theme-primary, #3b82f6);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--b3-theme-primary, #3b82f6);
    color: #fff;
  }
}

.sqb-dock__section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sqb-dock__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: var(--b3-theme-surface-lighter, rgba(0, 0, 0, 0.04));
  }
}

.sqb-dock__section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--b3-theme-on-surface, #555);
}

.sqb-dock__accent-icon {
  color: var(--b3-theme-primary, #3b82f6);
}

.sqb-dock__badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--b3-theme-surface-lighter, rgba(0, 0, 0, 0.06));
  color: var(--b3-theme-on-surface, #777);
  font-weight: normal;
}

.sqb-dock__chevron {
  color: var(--b3-theme-on-surface, #888);
  transition: transform 0.2s ease;

  &.is-expanded {
    transform: rotate(180deg);
  }
}

.sqb-dock__section-desc {
  margin: 0 0 4px;
  padding: 0 6px;
  font-size: 11px;
  color: var(--b3-theme-on-surface, #888);
  line-height: 1.4;
}

.sqb-dock__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sqb-dock__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 7px 8px;
  border: 1px solid transparent;
  background: var(--b3-theme-surface-lighter, rgba(0, 0, 0, 0.02));
  border-radius: 6px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--b3-theme-surface-lighter, rgba(0, 0, 0, 0.06));
    border-color: var(--b3-theme-surface-lighter, rgba(0, 0, 0, 0.1));
  }

  &--dashboard {
    background: var(--b3-theme-surface-lighter, rgba(59, 130, 246, 0.03));
    border-color: var(--b3-theme-surface-lighter, rgba(59, 130, 246, 0.08));

    &:hover {
      background: var(--b3-theme-surface-lighter, rgba(59, 130, 246, 0.08));
      border-color: var(--b3-theme-primary, #3b82f6);
    }
  }
}

.sqb-dock__item-icon-wrap {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--b3-theme-primary, #3b82f6);
}

.sqb-dock__item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sqb-dock__item-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--b3-theme-on-background, #222);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sqb-dock__item-desc {
  font-size: 11px;
  color: var(--b3-theme-on-surface, #777);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}
</style>
