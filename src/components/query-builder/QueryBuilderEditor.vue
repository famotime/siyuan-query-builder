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

:deep(.section-head),
:deep(.section-head-actions),
:deep(.actions),
:deep(.actions--inline) {
  display: flex;
  align-items: center;
  gap: 14px;
}

:deep(.section-head),
:deep(.actions),
:deep(.actions--inline) {
  justify-content: space-between;
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 18px;
}

:deep(.stack) {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

:deep(.gap-sm) {
  gap: 10px;
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

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--sqb-primary);
  font: 700 11px/1.3 var(--sqb-sans);
}

:deep(h3) {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  font-family: var(--sqb-serif);
}

:deep(.section-toggle) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 28px;
  height: 28px;
  border: 1px solid var(--sqb-border);
  border-radius: 8px;
  background: var(--sqb-surface-soft);
  color: var(--sqb-text-muted);
  cursor: pointer;
}

:deep(.section-heading) {
  display: grid;
  gap: 4px;
  text-align: left;
}

:deep(.section-kicker) {
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--sqb-primary);
  font: 700 11px/1.2 var(--sqb-sans);
}

:deep(.section-copy) {
  margin: 10px 0 0;
  color: var(--sqb-text-muted);
  font: 13px/1.55 var(--sqb-sans);
}

:deep(.section-toggle:hover) {
  background: var(--sqb-bg-strong);
}

:deep(.section-toggle svg) {
  width: 16px;
  height: 16px;
  transition: transform 140ms ease;
}

:deep(.section-toggle svg.is-expanded) {
  transform: rotate(180deg);
}

.title-input,
:deep(.control) {
  width: 100%;
  box-sizing: border-box;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
  color: var(--sqb-text);
  padding: 0 10px;
  font: 13px/1.4 var(--sqb-sans);
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.title-input::placeholder,
:deep(.control::placeholder) {
  color: var(--sqb-text-muted);
  opacity: 0.6;
}

.title-input:hover,
:deep(.control:hover) {
  border-color: var(--sqb-border-strong);
}

.title-input:focus,
:deep(.control:focus) {
  outline: none;
  border-color: var(--sqb-primary);
  box-shadow: 0 0 0 3px var(--sqb-primary-soft);
}

:deep(.btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  flex: 0 0 auto;
  transition: background 80ms ease, border-color 80ms ease, color 80ms ease;
  cursor: pointer;
  font: 600 13px/1.2 var(--sqb-sans);
  white-space: nowrap;
  border-radius: 8px;
  padding: 0 12px;
  border: 1px solid transparent;
}

:deep(.btn--small) {
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
  border-radius: 8px;
}

:deep(.btn--solid) {
  background: var(--sqb-primary);
  color: #ffffff;
}

:deep(.btn--solid:hover) {
  background: var(--sqb-primary-strong);
}

:deep(.btn--ghost) {
  background: transparent;
  color: var(--sqb-text-muted);
  border-color: transparent;
}

:deep(.btn--ghost:hover) {
  background: var(--sqb-bg-strong);
  color: var(--sqb-text);
}

:deep(.btn--outline) {
  background: transparent;
  color: var(--sqb-text);
  border-color: var(--sqb-border);
}

:deep(.btn--outline:hover) {
  border-color: var(--sqb-primary);
  color: var(--sqb-primary);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--sqb-surface-soft);
  border: 1px solid var(--sqb-border);
  color: var(--sqb-secondary);
  font: 600 13px/1.2 var(--sqb-sans);
}

.chip--toggle {
  justify-content: center;
}

:deep(.muted) {
  margin: 0;
  color: var(--sqb-text-muted);
  font: 14px/1.5 var(--sqb-sans);
}

:deep(.form-grid) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}

:deep(.form-grid--scope) {
  grid-template-columns: 1fr;
}

:deep(.form-grid--aggregation) {
  margin-top: 0;
}

:deep(.field) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.field span),
.check small {
  font: 13px/1.25 var(--sqb-sans);
}

:deep(.field span) {
  color: var(--sqb-secondary);
  font-weight: 700;
}

:deep(.field-hint) {
  color: var(--sqb-text-muted);
  font: 12px/1.45 var(--sqb-sans);
  letter-spacing: 0.01em;
}

:deep(.filter-row) {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.92fr) minmax(0, 1.65fr) auto;
  grid-auto-columns: minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid var(--sqb-border);
  background: linear-gradient(180deg, var(--sqb-primary-soft) 0%, rgba(0, 0, 0, 0) 100%), var(--sqb-surface);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  position: relative;
  cursor: grab;
  transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
}

:deep(.filter-row:hover) {
  border-color: var(--sqb-border-strong);
  background: linear-gradient(180deg, var(--sqb-primary-soft) 0%, rgba(0, 0, 0, 0) 100%), var(--sqb-surface-soft);
}

:deep(.filter-row--range) {
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.95fr) minmax(0, 1.15fr) minmax(0, 1.15fr) auto;
}

:deep(.filter-row--sort) {
  grid-template-columns: minmax(0, 1fr) 120px auto;
  padding: 0;
  border: none;
  background: transparent;
}

:deep(.filter-row--dragging) {
  opacity: 0.72;
  cursor: grabbing;
}

:deep(.filter-row--drop-before::before),
:deep(.filter-row--drop-after::after) {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  height: 2px;
  border-radius: 999px;
  background: var(--sqb-primary);
  box-shadow: 0 0 0 3px var(--sqb-primary-soft);
}

:deep(.filter-row--drop-before::before) {
  top: -2px;
}

:deep(.filter-row--drop-after::after) {
  bottom: -2px;
}

:deep(.filter-row__value) {
  min-width: 0;
}

:deep(.filter-row__actions) {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  align-items: center;
  justify-self: end;
  gap: 8px;
}

:deep(.filter-row__logic),
:deep(.filter-row__logic-spacer) {
  width: 74px;
  height: 32px;
}

:deep(.filter-row__logic) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border-radius: 11px;
  border: 1px solid var(--sqb-border-strong);
  background: var(--sqb-secondary-soft);
  color: var(--sqb-secondary);
  font: 700 11px/1 var(--sqb-sans);
  letter-spacing: 0.12em;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease, color 140ms ease, transform 140ms ease;
}

:deep(.filter-row__logic[data-state='and']) {
  background: var(--sqb-primary-soft);
  color: var(--sqb-primary-strong);
}

:deep(.filter-row__logic:hover) {
  border-color: var(--sqb-primary);
  background: var(--sqb-surface-strong);
  color: var(--sqb-primary);
}

:deep(.filter-row__logic:focus-visible) {
  outline: none;
  border-color: var(--sqb-primary);
  box-shadow: 0 0 0 3px var(--sqb-primary-soft);
}

:deep(.filter-row__logic:active) {
  transform: translateY(1px);
}

:deep(.filter-row__logic-spacer) {
  display: block;
  pointer-events: none;
  visibility: hidden;
}

:deep(.filter-row__delete) {
  justify-self: auto;
}

:deep(.section-head--top) {
  margin-top: 20px;
}

:deep(.section-head--compact) {
  margin-top: 0;
}

.view-config-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.view-config-panel {
  display: grid;
  gap: 10px;
}

.field-picker {
  margin-top: 0;
}

.field-picker__toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-soft);
  color: var(--sqb-text);
  cursor: pointer;
  text-align: left;
  font: 600 13px/1.35 var(--sqb-sans);
}

.field-picker__summary {
  min-width: 0;
}

.field-picker__chevron {
  flex: 0 0 auto;
  color: var(--sqb-text-muted);
  font: 600 18px/1 var(--sqb-sans);
  transition: transform 140ms ease;
}

.field-picker__chevron--open {
  transform: rotate(180deg);
}

.field-picker__menu {
  display: grid;
  gap: 8px;
  margin-top: 10px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
}

.field-picker__option {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--sqb-surface-soft);
}

.field-picker__option span {
  color: var(--sqb-text);
  font: 600 14px/1.35 var(--sqb-sans);
}

.field-picker__option small {
  color: var(--sqb-text-muted);
}

@media (max-width: 1100px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .card,
  .card--scope,
  .card--mappings,
  .card--full,
  .form-grid,
  .view-config-row {
    grid-template-columns: 1fr;
    grid-column: auto;
  }
}

@media (max-width: 720px) {
  .actions,
  .actions--inline,
  .filter-row,
  .filter-row--sort {
    flex-direction: column;
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .filter-row__actions {
    width: 100%;
  }

  .filter-row__actions {
    justify-self: stretch;
    justify-content: flex-end;
  }

  .filter-row__logic {
    width: auto;
    min-width: 74px;
  }

  .filter-row__logic-spacer {
    display: none;
  }

}
</style>
