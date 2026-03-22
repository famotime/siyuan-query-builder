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
    >
      <article
        v-for="view in views"
        :key="view.id"
        class="saved-views__item"
        data-saved-view-card
        :class="{ 'saved-views__item--active': view.id === activeViewId }"
      >
        <button
          class="saved-views__main"
          type="button"
          :data-view-load="view.id"
          @click="emit('load', view.id)"
        >
          <strong>{{ viewTypeLabel(view.type) }}</strong>
          <span
            v-if="view.defaultView"
            class="saved-views__badge"
          >默认</span>
        </button>
        <div class="saved-views__actions">
          <button
            class="btn btn--ghost btn--small"
            type="button"
            :data-view-default="view.id"
            @click="emit('setDefault', view.id)"
          >
            设为默认
          </button>
          <DeleteIconButton
            :data-view-delete="view.id"
            class="saved-views__delete"
            title="删除视图"
            aria-label="删除视图"
            @click="emit('delete', view.id)"
          />
        </div>
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
      return "统计卡片"
    default:
      return "表格"
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
.saved-views__actions,
.saved-views__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.saved-views__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

.saved-views__item {
  display: grid;
  gap: 12px;
  padding: 12px;
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
  justify-content: flex-start;
  align-items: flex-start;
  min-height: 42px;
}

.saved-views__delete {
  margin-right: -2px;
}

.saved-views__actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 8px;
}

.saved-views__actions .btn {
  width: 100%;
  min-height: 40px;
  padding-inline: 12px;
  justify-content: center;
}

.saved-views__badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--sqb-primary-soft);
  color: var(--sqb-primary-strong);
  font: 700 12px/1.2 var(--sqb-sans);
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
</style>
