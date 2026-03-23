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
      <article class="card card--scope">
        <div class="section-head">
          <div class="section-heading">
            <span class="section-kicker">Scope</span>
            <h3>查询范围</h3>
          </div>
          <button
            class="section-toggle"
            type="button"
            data-section-toggle="scope"
            :title="collapsedSections.scope ? '展开查询范围' : '收起查询范围'"
            :aria-label="collapsedSections.scope ? '展开查询范围' : '收起查询范围'"
            :aria-expanded="String(!collapsedSections.scope)"
            @click="toggleSection('scope')"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              :class="{ 'is-expanded': !collapsedSections.scope }"
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
          定义这次查询要覆盖哪些笔记内容，再用更精确的值缩小范围。
        </p>
        <div
          v-if="!collapsedSections.scope"
          class="form-grid"
        >
          <label class="field">
            <span>范围类型</span>
            <select
              v-model="store.draft.template.scope.type"
              class="control"
            >
              <option value="all_blocks">
                全部块
              </option>
              <option value="notebook">
                笔记本
              </option>
              <option value="document">
                文档 ID
              </option>
              <option value="block_type">
                块类型
              </option>
              <option value="tag">
                标签
              </option>
              <option value="attribute">
                属性键
              </option>
            </select>
          </label>
          <label
            v-if="store.draft.template.scope.type !== 'all_blocks'"
            class="field"
          >
            <span>{{ store.scopeLabel }}</span>
            <select
              v-if="store.draft.template.scope.type === 'notebook'"
              v-model="store.draft.template.scope.value"
              class="control"
            >
              <option value="">
                选择笔记本
              </option>
              <option
                v-for="notebook in store.notebooks"
                :key="notebook.id"
                :value="notebook.id"
              >
                {{ notebook.name }}
              </option>
            </select>
            <select
              v-else-if="store.draft.template.scope.type === 'block_type'"
              v-model="store.draft.template.scope.value"
              class="control"
            >
              <option value="p">
                段落 p
              </option>
              <option value="h">
                标题 h
              </option>
              <option value="i">
                列表项 i
              </option>
              <option value="t">
                表格 t
              </option>
              <option value="d">
                文档 d
              </option>
            </select>
            <input
              v-else
              v-model="store.draft.template.scope.value"
              class="control"
              :placeholder="store.scopePlaceholder"
            >
          </label>
        </div>
      </article>

      <article class="card card--mappings">
        <div class="section-head">
          <div class="section-heading">
            <span class="section-kicker">Field Mapping</span>
            <h3>字段映射</h3>
          </div>
          <div class="section-head-actions">
            <button
              class="btn btn--outline btn--small"
              data-generate-examples
              type="button"
              @click="store.generateExampleDocument"
            >
              生成示例
            </button>
            <button
              class="section-toggle"
              type="button"
              data-section-toggle="mappings"
              :title="collapsedSections.mappings ? '展开字段映射' : '收起字段映射'"
              :aria-label="collapsedSections.mappings ? '展开字段映射' : '收起字段映射'"
              :aria-expanded="String(!collapsedSections.mappings)"
              @click="toggleSection('mappings')"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                :class="{ 'is-expanded': !collapsedSections.mappings }"
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
        </div>
        <p class="section-copy">
          快速编辑、看板列和统计字段都会依赖这里的属性名称。
        </p>
        <div
          v-if="!collapsedSections.mappings"
          class="form-grid"
        >
          <label
            v-for="key in store.mappingKeys"
            :key="key"
            class="field"
          >
            <span>{{ store.mappingLabels[key] }}</span>
            <input
              v-model="store.draft.view.fieldMappings[key]"
              class="control"
            >
            <small
              :data-mapping-hint="key"
              class="field-hint"
            >
              {{ mappingHints[key] }}
            </small>
          </label>
        </div>
      </article>

      <article class="card card--full">
        <div class="section-head">
          <div class="section-heading">
            <span class="section-kicker">Filters</span>
            <h3>条件编辑器</h3>
          </div>
          <div class="section-head-actions">
            <button
              class="btn btn--solid"
              data-add-filter
              @click="store.addFilter"
            >
              添加条件
            </button>
            <button
              class="section-toggle"
              type="button"
              data-section-toggle="filters"
              :title="collapsedSections.filters ? '展开条件编辑器' : '收起条件编辑器'"
              :aria-label="collapsedSections.filters ? '展开条件编辑器' : '收起条件编辑器'"
              :aria-expanded="String(!collapsedSections.filters)"
              @click="toggleSection('filters')"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                :class="{ 'is-expanded': !collapsedSections.filters }"
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
        </div>
        <p class="section-copy">
          组合字段、操作符和值来描述真正要筛出的内容。
        </p>
        <template v-if="!collapsedSections.filters">
          <div
            v-if="store.draft.template.filters.length"
            class="stack gap-sm"
          >
            <div
              v-for="(filter, index) in store.draft.template.filters"
              :key="filter.id"
              class="filter-row"
              :data-filter-row="filter.id"
              :class="{
                'filter-row--dragging': draggingFilterId === filter.id,
                'filter-row--drop-before': dragOverFilterId === filter.id && dragOverPlacement === 'before',
                'filter-row--drop-after': dragOverFilterId === filter.id && dragOverPlacement === 'after',
              }"
              @dragend="clearFilterDrag"
              @dragover.prevent="onFilterDragOver(filter.id, $event)"
              @drop.prevent="onFilterDrop(filter.id)"
            >
              <div
                class="filter-row__drag-handle"
                :data-filter-drag-handle="filter.id"
                draggable="true"
                title="拖拽调整条件顺序"
                aria-label="拖拽调整条件顺序"
                @dragstart="onFilterDragStart(filter.id)"
                @dragend="clearFilterDrag"
              >
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <circle cx="5" cy="4" r="1.1" fill="currentColor" />
                  <circle cx="11" cy="4" r="1.1" fill="currentColor" />
                  <circle cx="5" cy="8" r="1.1" fill="currentColor" />
                  <circle cx="11" cy="8" r="1.1" fill="currentColor" />
                  <circle cx="5" cy="12" r="1.1" fill="currentColor" />
                  <circle cx="11" cy="12" r="1.1" fill="currentColor" />
                </svg>
                <span>拖拽</span>
              </div>
              <select
                v-model="filter.field"
                :data-filter-field="filter.id"
                class="control"
                @change="normalizeFilterOperator(filter)"
              >
                <option
                  v-for="option in store.fieldOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              <select
                v-model="filter.operator"
                :data-filter-operator="filter.id"
                class="control"
              >
                <option
                  v-for="option in filterOperatorOptions(filter.field)"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              <template v-if="filter.operator === 'date_between'">
                <input
                  class="control"
                  type="date"
                  :value="store.dateRangeValue(filter, 0)"
                  @input="store.updateDateRange(filter, 0, ($event.target as HTMLInputElement).value)"
                >
                <input
                  class="control"
                  type="date"
                  :value="store.dateRangeValue(filter, 1)"
                  @input="store.updateDateRange(filter, 1, ($event.target as HTMLInputElement).value)"
                >
              </template>
              <input
                v-else-if="store.requiresValue(filter.operator)"
                class="control"
                :type="filter.operator.includes('days') ? 'number' : 'text'"
                :value="String(filter.value || '')"
                @input="filter.value = ($event.target as HTMLInputElement).value"
              >
              <div
                class="filter-row__actions"
                :data-filter-actions="filter.id"
              >
                <button
                  :data-filter-condition-toggle="filter.id"
                  class="filter-row__logic"
                  type="button"
                  :title="`切换条件连接词，当前为 ${displayFilterCondition(filter.condition)}`"
                  :aria-label="`切换条件连接词，当前为 ${displayFilterCondition(filter.condition)}`"
                  @click="toggleFilterCondition(index)"
                >
                  {{ displayFilterCondition(filter.condition) }}
                </button>
                <DeleteIconButton
                  :data-filter-delete="filter.id"
                  class="filter-row__delete"
                  title="删除条件"
                  aria-label="删除条件"
                  @click="store.removeFilter(filter.id)"
                />
              </div>
            </div>
          </div>
          <p
            v-else
            class="muted"
          >
            还没有筛选条件，可以先从状态、日期、项目开始。
          </p>
        </template>
      </article>

      <EditorViewSettingsSection
        :collapsed="collapsedSections.view"
        @toggle="toggleSection('view')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue"

import DeleteIconButton from "@/components/query-builder/DeleteIconButton.vue"
import EditorViewSettingsSection from "@/components/query-builder/EditorViewSettingsSection.vue"
import { useQueryBuilderStore } from "@/composables/query-builder-store"
import type { FilterOperator, QueryFilter } from "@/core/query/types"

const store = useQueryBuilderStore()
const COMMON_FILTER_OPERATORS: Array<{ value: FilterOperator, label: string }> = [
  { value: "eq", label: "等于" },
  { value: "neq", label: "不等于" },
  { value: "gt", label: "大于" },
  { value: "contains", label: "包含" },
  { value: "not_contains", label: "不包含" },
  { value: "empty", label: "为空" },
  { value: "not_empty", label: "非空" },
]
const DATE_FILTER_OPERATORS: Array<{ value: FilterOperator, label: string }> = [
  { value: "date_between", label: "日期区间" },
  { value: "next_days", label: "未来 N 天" },
  { value: "last_days", label: "最近 N 天" },
]
const DATE_ONLY_OPERATORS = new Set<FilterOperator>(DATE_FILTER_OPERATORS.map(option => option.value))
const mappingHints: Record<"status" | "dueDate" | "priority" | "project" | "owner", string> = {
  status: "预设值：Todo / Doing / Done",
  dueDate: "预设值：YYYY-MM-DD，例如 2026-03-23",
  priority: "预设值：P0 / P1 / P2 / P3",
  project: "示例：项目周报、知识库整理",
  owner: "示例：张三、Alice",
}
const collapsedSections = reactive({
  filters: false,
  mappings: false,
  scope: false,
  view: false,
})
const draggingFilterId = ref("")
const dragOverFilterId = ref("")
const dragOverPlacement = ref<"before" | "after" | "">("")

function toggleSection(section: keyof typeof collapsedSections) {
  collapsedSections[section] = !collapsedSections[section]
}

function isDateField(field: string) {
  return field === "created"
    || field === "updated"
    || field === `attr:${store.draft.view.fieldMappings.dueDate}`
}

function filterOperatorOptions(field: string) {
  return isDateField(field)
    ? [...COMMON_FILTER_OPERATORS, ...DATE_FILTER_OPERATORS]
    : COMMON_FILTER_OPERATORS
}

function normalizeFilterOperator(filter: QueryFilter) {
  if (DATE_ONLY_OPERATORS.has(filter.operator) && !isDateField(filter.field)) {
    filter.operator = "contains"
    filter.value = ""
  }
}

function onFilterDragStart(filterId: string) {
  draggingFilterId.value = filterId
}

function displayFilterCondition(condition?: "and" | "or") {
  return condition === "or" ? "OR" : "AND"
}

function toggleFilterCondition(index: number) {
  const filter = store.draft.template.filters[index]
  if (!filter) {
    return
  }

  filter.condition = (filter.condition || "and") === "and" ? "or" : "and"
}

function onFilterDragOver(targetFilterId: string, event: DragEvent) {
  if (!draggingFilterId.value || draggingFilterId.value === targetFilterId) {
    dragOverFilterId.value = ""
    dragOverPlacement.value = ""
    return
  }

  const target = event.currentTarget as HTMLElement | null
  if (!target) {
    return
  }

  const rect = target.getBoundingClientRect()
  const midpoint = rect.top + rect.height / 2

  dragOverFilterId.value = targetFilterId
  dragOverPlacement.value = event.clientY <= midpoint ? "before" : "after"
}

function onFilterDrop(targetFilterId: string) {
  if (!draggingFilterId.value) {
    return
  }
  store.moveFilter(draggingFilterId.value, targetFilterId, dragOverPlacement.value || "before")
  clearFilterDrag()
}

function clearFilterDrag() {
  draggingFilterId.value = ""
  dragOverFilterId.value = ""
  dragOverPlacement.value = ""
}

watch(
  () => store.draft.template.filters.map(filter => `${filter.id}:${filter.field}:${filter.operator}`),
  () => {
    store.draft.template.filters.forEach(normalizeFilterOperator)
  },
  { immediate: true },
)
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

.section-head,
.section-head-actions,
.actions,
.actions--inline {
  display: flex;
  align-items: center;
  gap: 14px;
}

.section-head,
.actions,
.actions--inline {
  justify-content: space-between;
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 18px;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gap-sm {
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

h3 {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  font-family: var(--sqb-serif);
}

.section-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  width: 28px;
  height: 28px;
  border: 1px solid var(--sqb-border);
  border-radius: 8px;
  background: var(--sqb-surface-soft);
  color: var(--sqb-text-muted);
  cursor: pointer;
}

.section-heading {
  display: grid;
  gap: 4px;
  text-align: left;
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
  font: 13px/1.55 var(--sqb-sans);
}

.section-toggle:hover {
  background: var(--sqb-bg-strong);
}

.section-toggle svg {
  width: 16px;
  height: 16px;
  transition: transform 140ms ease;
}

.section-toggle svg.is-expanded {
  transform: rotate(180deg);
}

.title-input,
.control {
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
.control::placeholder {
  color: var(--sqb-text-muted);
  opacity: 0.6;
}

.title-input:hover,
.control:hover {
  border-color: var(--sqb-border-strong);
}

.title-input:focus,
.control:focus {
  outline: none;
  border-color: var(--sqb-primary);
  box-shadow: 0 0 0 3px var(--sqb-primary-soft);
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
  font: 600 13px/1.2 var(--sqb-sans);
  white-space: nowrap;
  border-radius: 8px;
  padding: 0 12px;
  border: 1px solid transparent;
}

.btn--small {
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
  border-radius: 8px;
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

.btn--outline {
  background: transparent;
  color: var(--sqb-text);
  border-color: var(--sqb-border);
}

.btn--outline:hover {
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

.muted {
  margin: 0;
  color: var(--sqb-text-muted);
  font: 14px/1.5 var(--sqb-sans);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.form-grid--aggregation {
  margin-top: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field span,
.check small {
  font: 13px/1.25 var(--sqb-sans);
}

.field span {
  color: var(--sqb-secondary);
  font-weight: 700;
}

.field-hint {
  color: var(--sqb-text-muted);
  font: 12px/1.45 var(--sqb-sans);
  letter-spacing: 0.01em;
}

.filter-row {
  display: grid;
  grid-template-columns: auto repeat(3, minmax(0, 1fr)) auto;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px dashed transparent;
  position: relative;
  transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
}

.filter-row:hover {
  border-color: var(--sqb-border);
  background: var(--sqb-surface-soft);
}

.filter-row--sort {
  grid-template-columns: minmax(0, 1fr) 120px auto;
  padding: 0;
  border: none;
  background: transparent;
}

.filter-row--dragging {
  opacity: 0.72;
}

.filter-row--drop-before::before,
.filter-row--drop-after::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  height: 2px;
  border-radius: 999px;
  background: var(--sqb-primary);
  box-shadow: 0 0 0 3px var(--sqb-primary-soft);
}

.filter-row--drop-before::before {
  top: -2px;
}

.filter-row--drop-after::after {
  bottom: -2px;
}

.filter-row__drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  align-self: stretch;
  min-width: 70px;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px dashed var(--sqb-border);
  background: var(--sqb-surface-soft);
  color: var(--sqb-text-muted);
  font: 700 12px/1.2 var(--sqb-sans);
  letter-spacing: 0.04em;
  cursor: grab;
  user-select: none;
}

.filter-row__drag-handle:active {
  cursor: grabbing;
}

.filter-row__drag-handle svg {
  width: 14px;
  height: 14px;
}

.filter-row__actions {
  display: inline-flex;
  align-items: center;
  justify-self: end;
  gap: 8px;
}

.filter-row__logic {
  min-width: 58px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-soft);
  color: var(--sqb-text);
  font: 700 12px/1 var(--sqb-sans);
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease, color 140ms ease, transform 140ms ease;
}

.filter-row__logic:hover {
  border-color: var(--sqb-primary);
  background: var(--sqb-primary-soft);
  color: var(--sqb-primary);
}

.filter-row__logic:focus-visible {
  outline: none;
  border-color: var(--sqb-primary);
  box-shadow: 0 0 0 3px var(--sqb-primary-soft);
}

.filter-row__logic:active {
  transform: translateY(1px);
}

.filter-row__delete {
  justify-self: auto;
}

.section-head--top {
  margin-top: 20px;
}

.section-head--compact {
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

  .filter-row__drag-handle,
  .filter-row__actions,
  .filter-row__logic {
    width: 100%;
  }

}
</style>
