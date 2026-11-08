<template>
  <section
    v-if="views.length"
    class="saved-views"
  >
    <div class="saved-views__head">
      <div class="saved-views__heading">
        <h4>已保存视图</h4>
      </div>
      <button
        v-sqb-tooltip="'将当前显示配置添加为新视图'"
        class="btn btn--ghost btn--small"
        data-view-save-as
        type="button"
        aria-label="添加为新视图"
        @click="emit('saveAs')"
      >
        <Plus
          class="btn__icon sqb-wireframe-icon"
          style="fill: none !important;"
          :size="14"
          :stroke-width="1.75"
        />
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
              v-sqb-tooltip="view.defaultView ? '当前已设为默认视图' : '设为打开时的默认视图'"
              class="saved-views__badge"
              :data-view-default-badge="view.id"
              :data-state="view.defaultView ? 'active' : 'idle'"
              type="button"
              :aria-label="view.defaultView ? '默认视图' : '设为默认视图'"
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
import { Plus } from "lucide-vue-next"

import DeleteIconButton from "@/components/query-builder/DeleteIconButton.vue"
import { vSqbTooltip } from "@/ui/tooltip"

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
  gap: 10px;
  margin-bottom: 14px;
  padding: 12px;
  border-radius: 12px;
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

.saved-views__heading h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--sqb-text);
}

.saved-views__list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  justify-content: start;
  gap: 10px;
}

.saved-views__item {
  display: grid;
  gap: 6px;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface);
  transition: all 120ms ease;
  cursor: pointer;

  &:hover {
    border-color: var(--sqb-primary);
  }
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
  min-height: 26px;
  text-align: left;
}

.saved-views__copy {
  min-width: 0;
  display: block;
}

.saved-views__main strong {
  font: 600 13px/1.2 var(--sqb-sans);
}

.saved-views__description {
  color: var(--sqb-text-muted);
  font: 11px/1.35 var(--sqb-sans);
  margin: 0;
}

.saved-views__meta {
  flex: none;
  justify-content: flex-end;
  gap: 4px;
}

.saved-views__delete {
  width: 22px;
  height: 22px;
  margin-right: 0;
}

.saved-views__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  min-width: 32px;
  height: 20px;
  padding: 0 6px;
  border: 1px solid var(--sqb-border);
  border-radius: 999px;
  background: var(--sqb-surface);
  color: var(--sqb-text-muted);
  font: 600 10px/1 var(--sqb-sans);
  cursor: pointer;
  transition: all 120ms ease;
}

.saved-views__badge[data-state='active'] {
  border-color: var(--sqb-primary);
  background: var(--sqb-primary);
  color: #ffffff;
}

.saved-views__badge:hover {
  border-color: var(--sqb-primary);
  color: var(--sqb-primary);
}

.saved-views__badge[data-state='active']:hover {
  color: #ffffff;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 28px;
  transition: all 120ms ease;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 0 10px;
  background: transparent;
  cursor: pointer;
  font: 600 12px/1.2 var(--sqb-sans);
  white-space: nowrap;
}

.btn--small {
  height: 24px;
  padding: 0 8px;
  font-size: 11px;
}

.btn--ghost {
  background: transparent;
  color: var(--sqb-text-muted);
  border-color: var(--sqb-border);

  &:hover {
    background: var(--sqb-bg-strong);
    color: var(--sqb-text);
  }
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
