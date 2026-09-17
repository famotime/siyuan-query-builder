<template>
  <header class="topbar card">
    <!-- 场景仪表板模式 -->
    <template v-if="store.activeDashboardViewModel">
      <div class="topbar__draft-line">
        <button
          class="btn btn--ghost btn--icon-only"
          type="button"
          :title="sidebarVisible ? '折叠侧边栏' : '展开侧边栏'"
          :aria-label="sidebarVisible ? '折叠侧边栏' : '展开侧边栏'"
          @click="toggleSidebar?.()"
        >
          <LayoutPanelLeft
            :size="16"
            :stroke-width="1.75"
          />
        </button>
        <div class="topbar__dashboard-badge">
          <Sparkles class="topbar__sparkle-icon" :size="15" />
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
          class="btn btn--ghost"
          type="button"
          title="返回常规查询编辑器"
          @click="store.closeDashboard?.()"
        >
          <ArrowLeft
            class="btn__icon"
            :size="16"
            :stroke-width="1.75"
          />
          返回查询构建
        </button>
        <button
          class="btn btn--ghost"
          type="button"
          @click="store.saveDashboardAsTemplate?.()"
        >
          <BookmarkPlus
            class="btn__icon"
            :size="16"
            :stroke-width="1.75"
          />
          保存为定制模板
        </button>
        <button
          class="btn btn--solid"
          :disabled="store.activeDashboardLoading"
          type="button"
          @click="store.runActiveDashboard?.()"
        >
          <RotateCw
            class="btn__icon"
            :class="{ 'is-spinning': store.activeDashboardLoading }"
            :size="16"
            :stroke-width="1.75"
          />
          {{ store.activeDashboardLoading ? "加载中..." : "刷新大盘" }}
        </button>
      </div>
    </template>

    <!-- 常规查询草稿模式 -->
    <template v-else>
      <div class="topbar__draft-line">
        <button
          class="btn btn--ghost btn--icon-only"
          type="button"
          :title="sidebarVisible ? '折叠侧边栏' : '展开侧边栏'"
          :aria-label="sidebarVisible ? '折叠侧边栏' : '展开侧边栏'"
          @click="toggleSidebar?.()"
        >
          <LayoutPanelLeft
            :size="16"
            :stroke-width="1.75"
          />
        </button>
        <h2 class="topbar__title">
          查询草稿
        </h2>
        <input
          v-model="store.draft.template.name"
          class="title-input"
          placeholder="未命名查询..."
        >
      </div>
      <div class="actions">
        <div class="topbar__dashboard-jump">
          <select
            class="dashboard-jump-select"
            value=""
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
              🌟 场景仪表板直达...
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
        <span
          class="dirty-indicator"
          :class="{ 'dirty-indicator--saved': !store.isDirty }"
        >{{ store.isDirty ? store.t("dirtyUnsaved") : store.t("dirtySaved") }}</span>
        <button
          class="btn btn--ghost"
          data-topbar-reset
          type="button"
          @click="store.resetDraft"
        >
          <Plus
            class="btn__icon"
            :size="16"
            :stroke-width="1.75"
          />
          新建查询
        </button>
        <button
          class="btn btn--ghost"
          :disabled="store.saving"
          type="button"
          @click="store.saveTemplate"
        >
          <Save
            class="btn__icon"
            :size="16"
            :stroke-width="1.75"
          />
          {{ store.saving ? "保存中..." : "保存模板" }}
        </button>
        <button
          class="btn btn--solid"
          :disabled="store.loading"
          @click="store.runQuery"
        >
          <Play
            class="btn__icon"
            :size="16"
            :stroke-width="1.75"
          />
          {{ store.loading ? "运行中..." : "运行查询" }}
        </button>
      </div>
    </template>
  </header>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import { inject, ref } from 'vue'
import {
  ArrowLeft,
  BookmarkPlus,
  LayoutPanelLeft,
  Play,
  Plus,
  RotateCw,
  Save,
  Sparkles,
} from 'lucide-vue-next'
import { useQueryBuilderStore } from "@/composables/query-builder-store"

const store = useQueryBuilderStore()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})
const sidebarVisible = inject<Ref<boolean>>('sidebarVisible', ref(true))
</script>

<style lang="scss" scoped>
.topbar,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.topbar {
  padding: 14px 18px;
  border-radius: 24px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  box-shadow: var(--sqb-shadow-soft);
  backdrop-filter: blur(18px);
}

.topbar__draft-line {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  gap: 18px;
}

.topbar__title {
  margin: 0;
  flex: 0 0 auto;
  color: var(--sqb-primary);
  font: 700 18px/1.2 var(--sqb-serif);
  white-space: nowrap;
}

.title-input {
  width: 100%;
  box-sizing: border-box;
  flex: 1 1 360px;
  min-width: 220px;
  max-width: 680px;
  height: 32px;
  background: var(--sqb-surface-strong);
  border: 1px solid var(--sqb-border);
  padding: 0 10px;
  border-radius: 8px;
  color: var(--sqb-text);
  font: 13px/1.4 var(--sqb-sans);
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.topbar__dashboard-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--sqb-primary-soft, rgba(74, 124, 89, 0.12));
  color: var(--sqb-primary);
  font: 700 12px/1.2 var(--sqb-sans);
  flex-shrink: 0;
}

.topbar__sparkle-icon {
  color: var(--sqb-primary);
}

.dashboard-select,
.dashboard-jump-select {
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
  color: var(--sqb-text);
  padding: 0 10px;
  font: 600 13px/1.4 var(--sqb-sans);
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s ease;

  &:hover,
  &:focus {
    border-color: var(--sqb-primary);
  }
}

.dashboard-jump-select {
  border-color: var(--sqb-primary);
  color: var(--sqb-primary);
  background: var(--sqb-primary-soft, rgba(74, 124, 89, 0.08));
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

.dirty-indicator {
  flex: 0 0 auto;
  font: 600 11px/1.2 var(--sqb-sans);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sqb-primary);
}

.dirty-indicator--saved {
  color: var(--sqb-text-muted);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  flex: 0 0 auto;
  transition: background 80ms ease, border-color 80ms ease, color 80ms ease;
  cursor: pointer;
  white-space: nowrap;
  border-radius: 8px;
  padding: 0 12px;
  border: 1px solid transparent;
  font: 600 13px/1.2 var(--sqb-sans);

  &--icon-only {
    padding: 0 8px;
  }
}

.btn--solid {
  background: var(--sqb-primary);
  color: #ffffff;
}

.btn--solid:hover {
  background: var(--sqb-primary-strong);
}

.btn--ghost {
  background: transparent;
  color: var(--sqb-text-muted);
  border-color: transparent;
}

.btn--ghost:hover {
  background: var(--sqb-bg-strong);
  color: var(--sqb-text);
}

.btn__icon {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.actions {
  flex: 0 0 auto;
  flex-wrap: nowrap;
  gap: 10px;
}

.actions > * {
  flex-shrink: 0;
}

@media (max-width: 1260px) {
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

@media (max-width: 720px) {
  .topbar,
  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .topbar {
    padding: 16px;
  }

  .topbar__draft-line {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .title-input {
    min-width: 100%;
    max-width: none;
    font-size: 16px;
  }

  .btn--solid,
  .btn--ghost {
    width: 100%;
  }
}
</style>
