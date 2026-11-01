<template>
  <header class="topbar card">
    <!-- 场景仪表板模式 -->
    <template v-if="store.activeDashboardViewModel">
      <div class="topbar__draft-line">
        <button
          v-sqb-tooltip="sidebarVisible ? '折叠侧边栏' : '展开侧边栏'"
          class="btn btn--ghost btn--icon-only"
          type="button"
          :aria-label="sidebarVisible ? '折叠侧边栏' : '展开侧边栏'"
          @click="toggleSidebar?.()"
        >
          <LayoutPanelLeft
            class="sqb-wireframe-icon"
            style="fill: none !important;"
            :size="16"
            :stroke-width="1.75"
          />
        </button>
        <div class="topbar__dashboard-badge">
          <Sparkles
            class="topbar__sparkle-icon sqb-wireframe-icon"
            style="fill: none !important;"
            :size="14"
            :stroke-width="1.75"
          />
          <span class="topbar__badge-label">场景仪表板</span>
        </div>
        <select
          :value="store.activeDashboardId"
          class="dashboard-select"
          @change="(e) => store.loadDashboard?.((e.target as HTMLSelectElement).value)"
        >
          <option
            v-for="d in store.dashboards"
            :key="d.id"
            :value="d.id"
          >
            {{ d.title }}
          </option>
        </select>
        <span class="topbar__desc-hint">{{ store.activeDashboardViewModel.description }}</span>
      </div>
      <div class="actions">
        <button
          v-sqb-tooltip="'返回常规查询构建'"
          class="btn btn--ghost btn--icon-only"
          type="button"
          aria-label="返回常规查询构建"
          @click="store.closeDashboard?.()"
        >
          <ArrowLeft
            class="btn__icon sqb-wireframe-icon"
            style="fill: none !important;"
            :size="16"
            :stroke-width="1.75"
          />
        </button>
        <button
          v-sqb-tooltip="'保存为定制模板'"
          class="btn btn--ghost btn--icon-only"
          type="button"
          aria-label="保存为定制模板"
          @click="store.saveDashboardAsTemplate?.()"
        >
          <BookmarkPlus
            class="btn__icon sqb-wireframe-icon"
            style="fill: none !important;"
            :size="16"
            :stroke-width="1.75"
          />
        </button>
        <button
          v-sqb-tooltip="'重新计算并刷新大盘'"
          class="btn btn--solid btn--icon-only"
          :disabled="store.activeDashboardLoading"
          type="button"
          aria-label="重新计算并刷新大盘"
          @click="store.runActiveDashboard?.()"
        >
          <RotateCw
            class="btn__icon sqb-wireframe-icon"
            style="fill: none !important;"
            :class="{ 'is-spinning': store.activeDashboardLoading }"
            :size="16"
            :stroke-width="1.75"
          />
        </button>
      </div>
    </template>

    <!-- 常规查询草稿模式 -->
    <template v-else>
      <div class="topbar__draft-line">
        <button
          v-sqb-tooltip="sidebarVisible ? '折叠侧边栏' : '展开侧边栏'"
          class="btn btn--ghost btn--icon-only"
          type="button"
          :aria-label="sidebarVisible ? '折叠侧边栏' : '展开侧边栏'"
          @click="toggleSidebar?.()"
        >
          <LayoutPanelLeft
            class="sqb-wireframe-icon"
            style="fill: none !important;"
            :size="16"
            :stroke-width="1.75"
          />
        </button>
        <input
          v-model="store.draft.template.name"
          class="title-input"
          placeholder="未命名查询..."
        >
      </div>
      <div class="actions">
        <!-- 场景仪表板直达选择 -->
        <div class="topbar__dashboard-jump">
          <select
            class="dashboard-jump-select"
            value=""
            aria-label="场景仪表板直达"
            @change="(e) => {
              const val = (e.target as HTMLSelectElement).value
              if (val) {
                store.loadDashboard?.(val)
                ;(e.target as HTMLSelectElement).value = ''
              }
            }"
          >
            <option
              value=""
              disabled
              selected
            >
              场景仪表板...
            </option>
            <option
              v-for="d in store.dashboards"
              :key="d.id"
              :value="d.id"
            >
              {{ d.title }}
            </option>
          </select>
        </div>

        <!-- 状态指示器 -->
        <div
          v-sqb-tooltip="store.isDirty ? '有未保存变更' : '已保存'"
          class="dirty-indicator-wrap"
        >
          <span
            class="dirty-dot"
            :class="{ 'dirty-dot--active': store.isDirty }"
          />
          <span
            class="dirty-indicator"
            :class="{ 'dirty-indicator--saved': !store.isDirty }"
          >{{ store.isDirty ? store.t("dirtyUnsaved") : store.t("dirtySaved") }}</span>
        </div>

        <button
          v-sqb-tooltip="'新建空白查询草稿'"
          class="btn btn--ghost"
          data-topbar-reset
          type="button"
          aria-label="新建查询"
          @click="store.resetDraft"
        >
          <Plus
            class="btn__icon sqb-wireframe-icon"
            style="fill: none !important;"
            :size="15"
            :stroke-width="1.75"
          />
          <span class="btn__label">新建查询</span>
        </button>

        <button
          v-sqb-tooltip="'保存当前条件为模板 (Ctrl+S)'"
          class="btn btn--ghost"
          :disabled="store.saving"
          type="button"
          aria-label="保存模板"
          @click="store.saveTemplate"
        >
          <BookmarkPlus
            class="btn__icon sqb-wireframe-icon"
            style="fill: none !important;"
            :size="15"
            :stroke-width="1.75"
          />
          <span class="btn__label">{{ store.saving ? "保存中..." : "保存模板" }}</span>
        </button>

        <button
          v-sqb-tooltip="'运行当前查询 (Ctrl+Enter)'"
          class="btn btn--solid"
          :disabled="store.loading"
          aria-label="运行查询"
          @click="store.runQuery"
        >
          <Play
            class="btn__icon sqb-wireframe-icon"
            style="fill: none !important;"
            :size="15"
            :stroke-width="1.75"
          />
          <span class="btn__label">{{ store.loading ? "运行中..." : "运行查询" }}</span>
        </button>
      </div>
    </template>
  </header>
</template>

<script setup lang="ts">
import type { Ref } from "vue"
import { inject, ref } from "vue"
import {
  ArrowLeft,
  BookmarkPlus,
  LayoutPanelLeft,
  Play,
  Plus,
  RotateCw,
  Sparkles,
} from "lucide-vue-next"
import { useQueryBuilderStore } from "@/composables/query-builder-store"
import { vSqbTooltip } from "@/ui/tooltip"

const store = useQueryBuilderStore()
const toggleSidebar = inject<() => void>("toggleSidebar", () => {})
const sidebarVisible = inject<Ref<boolean>>("sidebarVisible", ref(true))
</script>

<style lang="scss" scoped>
.topbar,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.topbar {
  padding: 10px 16px;
  border-radius: 12px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  box-shadow: var(--sqb-shadow-soft);
  backdrop-filter: blur(16px);
}

.topbar__draft-line {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  gap: 12px;
}

.title-input {
  width: 100%;
  box-sizing: border-box;
  flex: 1 1 360px;
  min-width: 180px;
  max-width: 540px;
  height: 32px;
  background: var(--sqb-surface-strong);
  border: 1px solid var(--sqb-border);
  padding: 0 10px;
  border-radius: 6px;
  color: var(--sqb-text);
  font: 600 13px/1.4 var(--sqb-sans);
  transition: all 140ms ease;

  &:focus {
    outline: none;
    border-color: var(--sqb-primary);
    box-shadow: 0 0 0 2px var(--sqb-primary-soft);
  }
}

.topbar__dashboard-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--sqb-primary-soft);
  color: var(--sqb-primary);
  font: 600 12px/1.2 var(--sqb-sans);
  flex-shrink: 0;
}

.topbar__sparkle-icon {
  color: var(--sqb-primary);
}

.dashboard-select,
.dashboard-jump-select {
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
  color: var(--sqb-text);
  padding: 0 10px;
  font: 500 12px/1.4 var(--sqb-sans);
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s ease;

  &:hover,
  &:focus {
    border-color: var(--sqb-primary);
  }
}

.dashboard-jump-select {
  border-color: var(--sqb-border);
  color: var(--sqb-text-muted);
  background: var(--sqb-surface-soft);

  &:hover {
    color: var(--sqb-primary);
    border-color: var(--sqb-primary);
  }
}

.topbar__desc-hint {
  font-size: 12px;
  color: var(--sqb-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
}

.is-spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.dirty-indicator-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: default;
}

.dirty-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--sqb-primary);
  transition: all 140ms ease;
  flex-shrink: 0;

  &--active {
    background: var(--sqb-accent);
    box-shadow: 0 0 0 2px var(--sqb-accent-soft);
  }
}

.dirty-indicator {
  flex: 0 0 auto;
  font: 600 11px/1.2 var(--sqb-sans);
  color: var(--sqb-primary);

  &--saved {
    color: var(--sqb-text-muted);
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  flex: 0 0 auto;
  transition: all 120ms ease;
  cursor: pointer;
  white-space: nowrap;
  border-radius: 6px;
  padding: 0 10px;
  border: 1px solid transparent;
  font: 600 12px/1.2 var(--sqb-sans);

  &--icon-only {
    width: 32px;
    height: 32px;
    padding: 0;
    box-sizing: border-box;
  }
}

.btn--solid {
  background: var(--sqb-primary);
  color: #ffffff;
  border-color: var(--sqb-primary);

  &:hover {
    background: var(--sqb-primary-strong);
    border-color: var(--sqb-primary-strong);
  }
}

.btn--ghost {
  background: transparent;
  color: var(--sqb-text-muted);
  border-color: var(--sqb-border);

  &:hover {
    background: var(--sqb-bg-strong);
    color: var(--sqb-text);
    border-color: var(--sqb-border-strong);
  }
}

.btn__icon {
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
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

.actions {
  flex: 0 0 auto;
  flex-wrap: nowrap;
  gap: 8px;
}

.actions > * {
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .topbar__draft-line,
  .actions {
    width: 100%;
  }

  .actions {
    justify-content: flex-end;
  }
}
</style>
