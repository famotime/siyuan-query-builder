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
  border-radius: 18px;
  border: 1px solid rgba(59, 46, 32, 0.12);
  background: rgba(255, 255, 255, 0.56);
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
  min-height: 126px;
  padding: 14px;
  border-radius: 20px;
  border: 1px solid rgba(59, 46, 32, 0.1);
  background:
    linear-gradient(180deg, rgba(255, 251, 245, 0.88), rgba(248, 244, 237, 0.74));
  box-shadow: 0 10px 22px rgba(57, 61, 52, 0.05);
}

.saved-views__item--active {
  border-color: rgba(74, 124, 89, 0.26);
  background:
    linear-gradient(180deg, rgba(74, 124, 89, 0.12), rgba(255, 255, 255, 0.82));
  box-shadow: 0 14px 26px rgba(74, 124, 89, 0.08);
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
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(74, 124, 89, 0.12);
  color: #365943;
  font: 700 12px/1.2 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.muted {
  margin: 0;
  color: var(--sqb-text-muted);
  font: 14px/1.55 var(--sqb-sans);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: transform 140ms ease, background 140ms ease, border-color 140ms ease;
  border: 1px solid transparent;
  border-radius: 16px;
  padding: 10px 14px;
  background: transparent;
  cursor: pointer;
  font: 600 13px/1.2 var(--sqb-sans);
}

.btn:hover {
  transform: translateY(-1px);
}

.btn--ghost {
  background: var(--sqb-primary);
  border-color: rgba(74, 124, 89, 0.22);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(74, 124, 89, 0.18);
}
</style>
