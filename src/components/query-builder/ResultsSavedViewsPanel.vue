<template>
  <section
    v-if="views.length"
    class="saved-views"
  >
    <div class="saved-views__head">
      <div>
        <h4>已保存视图</h4>
        <p class="muted">同一模板下可切换多个视图配置，并可指定默认视图。</p>
      </div>
      <button
        class="btn btn--ghost btn--small"
        data-view-save-as
        type="button"
        @click="emit('saveAs')"
      >
        添加为新视图
      </button>
    </div>
    <div
      class="saved-views__list"
      data-saved-views-grid
      data-grid-columns="4"
    >
      <article
        v-for="view in views"
        :key="view.id"
        class="saved-views__item"
        data-saved-view-card
        data-card-size="compact"
        :class="{ 'saved-views__item--active': view.id === activeViewId }"
        @click="emit('load', view.id)"
      >
        <div class="saved-views__top">
          <button
            class="saved-views__main"
            type="button"
            :data-view-load="view.id"
            @click.stop="emit('load', view.id)"
          >
            <span class="saved-views__copy">
              <strong>{{ viewTypeLabel(view.type) }}</strong>
            </span>
          </button>
          <div
            class="saved-views__meta"
            :data-view-card-meta="view.id"
          >
            <button
              class="saved-views__badge"
              :data-view-default-badge="view.id"
              :data-state="view.defaultView ? 'active' : 'idle'"
              type="button"
              @click.stop="emit('setDefault', view.id)"
            >
              默认
            </button>
          <DeleteIconButton
            :data-view-delete="view.id"
            class="saved-views__delete"
            title="删除视图"
            aria-label="删除视图"
            @click.stop="emit('delete', view.id)"
          />
          </div>
        </div>
        <p
          class="saved-views__description"
          :data-view-description="view.id"
        >
          {{ viewTypeDescription(view.type) }}
        </p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ViewConfig } from "@/core/query/types"

import DeleteIconButton from "@/components/query-builder/DeleteIconButton.vue"

defineProps<{
  activeViewId: string
  views: ViewConfig[]
}>()

const emit = defineEmits<{
  delete: [viewId: string]
  load: [viewId: string]
  saveAs: []
  setDefault: [viewId: string]
}>()

function viewTypeLabel(type: string) {
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

function viewTypeDescription(type: string) {
  switch (type) {
    case "board":
      return "适合按阶段推进任务与项目流转。"
    case "list":
      return "适合快速浏览时间线和轻量清单。"
    case "cards":
      return "适合看重点指标与摘要概览。"
    default:
      return "适合核对明细、排序和批量检查。"
  }
}
</script>

<style lang="scss" scoped>
.saved-views {
  display: grid;
  gap: 12px;
  margin-bottom: 18px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-soft);
}

.saved-views__head,
.saved-views__top,
.saved-views__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.saved-views__list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  justify-content: start;
  gap: 12px;
}

.saved-views__item {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 10px 11px;
  border-radius: 12px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface);
}

.saved-views__item--active {
  border-color: var(--sqb-primary);
  background: var(--sqb-primary-soft);
}

.saved-views__main {
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
  color: inherit;
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  min-height: 30px;
  text-align: left;
}

.saved-views__copy {
  min-width: 0;
  display: block;
}

.saved-views__main strong {
  font: 700 15px/1.2 var(--sqb-serif);
  letter-spacing: 0.01em;
}

.saved-views__description {
  color: var(--sqb-text-muted);
  font: 12px/1.35 var(--sqb-sans);
  margin: 0;
}

.saved-views__meta {
  flex: none;
  justify-content: flex-end;
  gap: 6px;
}

.saved-views__delete {
  width: 24px;
  height: 24px;
  margin-right: 0;
}

.saved-views__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  min-width: 38px;
  height: 22px;
  padding: 0 7px;
  border: 1px solid var(--sqb-border-strong);
  border-radius: 999px;
  background: var(--sqb-bg-strong);
  color: var(--sqb-text-muted);
  font: 700 10px/1 var(--sqb-sans);
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
}

.saved-views__badge[data-state='active'] {
  border-color: var(--sqb-primary);
  background: var(--sqb-primary-soft);
  color: var(--sqb-primary-strong);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.02);
}

.saved-views__badge:hover {
  border-color: var(--sqb-primary);
  color: var(--sqb-primary);
}

.saved-views__badge:focus-visible {
  outline: none;
  border-color: var(--sqb-primary);
  box-shadow: 0 0 0 3px var(--sqb-primary-soft);
}

.muted {
  margin: 0;
  color: var(--sqb-text-muted);
  font: 13px/1.55 var(--sqb-sans);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  transition: background 80ms ease, border-color 80ms ease, color 80ms ease;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0 12px;
  background: transparent;
  cursor: pointer;
  font: 600 13px/1.2 var(--sqb-sans);
  white-space: nowrap;
}

.btn--small {
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
}

.btn--ghost {
  background: transparent;
  color: var(--sqb-text-muted);
  border-color: var(--sqb-border-strong);
}

.btn--ghost:hover {
  background: var(--sqb-bg-strong);
  color: var(--sqb-text);
}

@media (max-width: 1180px) {
  .saved-views__list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .saved-views__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .saved-views__list {
    grid-template-columns: 1fr;
  }
}
</style>
