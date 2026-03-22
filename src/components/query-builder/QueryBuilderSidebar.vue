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
        <div class="section-head-main section-head-main--block">
          <span class="section-kicker">Scene Presets</span>
          <h2>预设场景</h2>
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
const savedTemplatesExpanded = ref(true)

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
.sidebar {
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 18px 24px 24px;
  background: rgba(250, 246, 240, 0.78);
  border-right: 1px solid var(--sqb-border);
  color: var(--sqb-text);
  backdrop-filter: blur(20px);
}

.card {
  padding: 20px;
  border-radius: 24px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  box-shadow: var(--sqb-shadow-soft);
  backdrop-filter: blur(14px);
}

.card--hero {
  background:
    linear-gradient(160deg, rgba(240, 232, 219, 0.98), rgba(255, 255, 255, 0.92)),
    var(--sqb-surface);
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

h1,
h2 {
  margin: 0;
}

h1 {
  font-size: 31px;
  line-height: 1.04;
}

.muted {
  margin: 0;
  color: var(--sqb-text-muted);
  font: 14px/1.55 var(--sqb-sans);
}

.actions,
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
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
.section-toggle {
  transition: transform 140ms ease, border-color 140ms ease, background 140ms ease, color 140ms ease;
  cursor: pointer;
  font: 600 13px/1.2 var(--sqb-sans);
}

.item:hover,
.section-toggle:hover {
  transform: translateY(-1px);
}

.section-toggle {
  width: 34px;
  height: 34px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--sqb-surface-soft);
  color: var(--sqb-text-muted);
  border: 1px solid var(--sqb-border);
}

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
  gap: 6px;
  text-align: left;
  border: 1px solid var(--sqb-border);
  border-radius: 18px;
  padding: 14px 15px;
  margin-top: 10px;
  background: var(--sqb-surface-soft);
  color: var(--sqb-text);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
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
  transform: translateY(-1px);
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
  margin-top: auto;
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
