<template>
  <section class="editor">
    <div
      v-if="store.validationIssues?.length"
      class="validation-list"
    >
      <article
        v-for="issue in store.validationIssues"
        :key="`${issue.level}-${issue.code}`"
        class="validation-item"
        :class="{
          'validation-item--error': issue.level === 'error',
          'validation-item--warning': issue.level === 'warning',
        }"
      >
        <strong>{{ issue.level === "error" ? "错误" : "提示" }}</strong>
        <span>{{ issue.message }}</span>
      </article>
    </div>
    <div class="grid">
      <EditorScopeSection
        :collapsed="collapsedSections.scope"
        @toggle="toggleSection('scope')"
      />

      <EditorMappingsSection
        :collapsed="collapsedSections.mappings"
        :mapping-hints="mappingHints"
        @toggle="toggleSection('mappings')"
      />

      <EditorFiltersSection
        :collapsed="collapsedSections.filters"
        :dragging-filter-id="draggingFilterId"
        :drag-over-filter-id="dragOverFilterId"
        :drag-over-placement="dragOverPlacement"
        :filter-operator-options="filterOperatorOptions"
        :normalize-filter-operator="normalizeFilterOperator"
        :display-filter-condition="displayFilterCondition"
        :toggle-filter-condition="toggleFilterCondition"
        :on-filter-drag-start="onFilterDragStart"
        :on-filter-drag-over="onFilterDragOver"
        :on-filter-drop="onFilterDrop"
        :clear-filter-drag="clearFilterDrag"
        @toggle="toggleSection('filters')"
      />

      <EditorViewSettingsSection
        :collapsed="collapsedSections.view"
        @toggle="toggleSection('view')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import EditorFiltersSection from "@/components/query-builder/EditorFiltersSection.vue"
import EditorMappingsSection from "@/components/query-builder/EditorMappingsSection.vue"
import EditorScopeSection from "@/components/query-builder/EditorScopeSection.vue"
import EditorViewSettingsSection from "@/components/query-builder/EditorViewSettingsSection.vue"
import { useQueryBuilderStore } from "@/composables/query-builder-store"
import { mappingHints, useQueryBuilderEditorState } from "@/components/query-builder/editor-state"

const store = useQueryBuilderStore()
const {
  clearFilterDrag,
  collapsedSections,
  displayFilterCondition,
  draggingFilterId,
  dragOverFilterId,
  dragOverPlacement,
  filterOperatorOptions,
  normalizeFilterOperator,
  onFilterDragOver,
  onFilterDragStart,
  onFilterDrop,
  toggleFilterCondition,
  toggleSection,
} = useQueryBuilderEditorState(store)
</script>

<style lang="scss" scoped>
/*
 * 编辑器外壳样式:校验提示、12 列网格与卡片跨度。
 * 分区内部版式(section-head/control/btn/field/filter-row 等)
 * 已迁移至 editor-shared.scss 与 editor-filter-row.scss,由各分区 scoped style 引入。
 */
.editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.validation-list {
  display: grid;
  gap: 10px;
}

.validation-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-soft);
  font: 13px/1.5 var(--sqb-sans);
}

.validation-item strong {
  flex: 0 0 auto;
}

.validation-item span {
  color: var(--sqb-text);
}

.validation-item--error {
  border-color: var(--sqb-danger-soft);
  background: var(--sqb-danger-soft);
  color: var(--sqb-danger);
}

.validation-item--warning {
  border-color: var(--sqb-accent-soft);
  background: var(--sqb-accent-soft);
  color: var(--sqb-accent);
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 18px;
}

.card {
  grid-column: span 6;
  padding: 18px;
  border-radius: 20px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  box-shadow: var(--sqb-shadow-soft);
  backdrop-filter: blur(16px);
}

.card--scope {
  grid-column: span 4;
}

.card--mappings {
  grid-column: span 8;
}

.card--full {
  grid-column: 1 / -1;
}

@media (max-width: 1100px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .card,
  .card--scope,
  .card--mappings,
  .card--full {
    grid-template-columns: 1fr;
    grid-column: auto;
  }
}
</style>
