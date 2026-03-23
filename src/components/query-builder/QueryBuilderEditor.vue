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
              class="btn btn--ghost btn--small"
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
            >
              <div
                v-if="index === 0"
                class="filter-row__condition filter-row__condition--root"
              >
                首条
              </div>
              <select
                v-else
                :data-filter-condition="filter.id"
                class="control filter-row__condition"
                :value="filter.condition || 'and'"
                @change="filter.condition = ($event.target as HTMLSelectElement).value as 'and' | 'or'"
              >
                <option value="and">
                  AND
                </option>
                <option value="or">
                  OR
                </option>
              </select>
              <select
                v-model="filter.field"
                class="control"
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
                class="control"
              >
                <option value="eq">
                  等于
                </option>
                <option value="neq">
                  不等于
                </option>
                <option value="gt">
                  大于
                </option>
                <option value="contains">
                  包含
                </option>
                <option value="not_contains">
                  不包含
                </option>
                <option value="empty">
                  为空
                </option>
                <option value="not_empty">
                  非空
                </option>
                <option value="date_between">
                  日期区间
                </option>
                <option value="next_days">
                  未来 N 天
                </option>
                <option value="last_days">
                  最近 N 天
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
              <DeleteIconButton
                :data-filter-delete="filter.id"
                class="filter-row__delete"
                title="删除条件"
                aria-label="删除条件"
                @click="store.removeFilter(filter.id)"
              />
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
import { reactive } from "vue"

import DeleteIconButton from "@/components/query-builder/DeleteIconButton.vue"
import EditorViewSettingsSection from "@/components/query-builder/EditorViewSettingsSection.vue"
import { useQueryBuilderStore } from "@/composables/query-builder-store"

const store = useQueryBuilderStore()
const collapsedSections = reactive({
  filters: false,
  mappings: false,
  scope: false,
  view: false,
})

function toggleSection(section: keyof typeof collapsedSections) {
  collapsedSections[section] = !collapsedSections[section]
}
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

.filter-row {
  display: grid;
  grid-template-columns: 88px repeat(3, minmax(0, 1fr)) auto;
  gap: 10px;
  align-items: center;
}

.filter-row--sort {
  grid-template-columns: minmax(0, 1fr) 120px auto;
}

.filter-row__condition {
  min-height: 44px;
}

.filter-row__condition--root {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  border: 1px dashed var(--sqb-border);
  background: var(--sqb-surface-soft);
  color: var(--sqb-text-muted);
  font: 700 12px/1.2 var(--sqb-sans);
  letter-spacing: 0.08em;
}

.filter-row__delete {
  justify-self: end;
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

}
</style>
