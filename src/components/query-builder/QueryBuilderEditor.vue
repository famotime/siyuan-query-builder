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
          <button
            class="section-toggle"
            type="button"
            data-section-toggle="scope"
            :aria-expanded="String(!collapsedSections.scope)"
            @click="toggleSection('scope')"
          >
            <div class="section-heading">
              <span class="section-kicker">Scope</span>
              <h3>查询范围</h3>
            </div>
            <span
              class="section-toggle__chevron"
              :class="{ 'section-toggle__chevron--collapsed': collapsedSections.scope }"
            >⌄</span>
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
          <button
            class="section-toggle"
            type="button"
            data-section-toggle="mappings"
            :aria-expanded="String(!collapsedSections.mappings)"
            @click="toggleSection('mappings')"
          >
            <div class="section-heading">
              <span class="section-kicker">Field Mapping</span>
              <h3>字段映射</h3>
            </div>
            <span
              class="section-toggle__chevron"
              :class="{ 'section-toggle__chevron--collapsed': collapsedSections.mappings }"
            >⌄</span>
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
          <button
            class="section-toggle"
            type="button"
            data-section-toggle="filters"
            :aria-expanded="String(!collapsedSections.filters)"
            @click="toggleSection('filters')"
          >
            <div class="section-heading">
              <span class="section-kicker">Filters</span>
              <h3>条件编辑器</h3>
            </div>
            <span
              class="section-toggle__chevron"
              :class="{ 'section-toggle__chevron--collapsed': collapsedSections.filters }"
            >⌄</span>
          </button>
          <button
            class="btn btn--ghost btn--small"
            @click="store.addFilter"
          >
            添加条件
          </button>
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
              v-for="filter in store.draft.template.filters"
              :key="filter.id"
              class="filter-row"
            >
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
              <button
                class="btn btn--ghost btn--small"
                @click="store.removeFilter(filter.id)"
              >
                删除
              </button>
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

      <article class="card card--full">
        <div class="section-head">
          <button
            class="section-toggle"
            type="button"
            data-section-toggle="view"
            :aria-expanded="String(!collapsedSections.view)"
            @click="toggleSection('view')"
          >
            <div class="section-heading">
              <span class="section-kicker">View Settings</span>
              <h3>排序、分组与字段</h3>
            </div>
            <span
              class="section-toggle__chevron"
              :class="{ 'section-toggle__chevron--collapsed': collapsedSections.view }"
            >⌄</span>
          </button>
        </div>
        <p class="section-copy">
          控制结果如何分组展示、如何排序，以及最终输出哪些字段。
        </p>
        <template v-if="!collapsedSections.view">
          <div class="form-grid">
            <label class="field">
              <span>分组字段</span>
              <select
                v-model="store.groupByProxy"
                class="control"
              >
                <option value="">
                  不分组
                </option>
                <option
                  v-for="option in store.selectableFieldOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>
            <label class="field">
              <span>结果上限</span>
              <input
                v-model="store.limitProxy"
                class="control"
                type="number"
                min="1"
                max="1000"
              >
            </label>
          </div>

          <div class="form-grid">
            <label class="chip chip--toggle">
              <input
                v-model="store.aggregationEnabled"
                type="checkbox"
              >
              <span>启用统计函数</span>
            </label>
          </div>

          <div
            v-if="store.aggregationEnabled"
            class="form-grid form-grid--aggregation"
          >
            <label class="field">
              <span>统计函数</span>
              <select
                v-model="store.aggregationFunctionProxy"
                class="control"
              >
                <option value="count">
                  计数 Count
                </option>
                <option value="sum">
                  求和 Sum
                </option>
                <option value="avg">
                  平均值 Avg
                </option>
                <option value="min">
                  最小值 Min
                </option>
                <option value="max">
                  最大值 Max
                </option>
              </select>
            </label>
            <label
              v-if="store.aggregationFunctionProxy !== 'count'"
              class="field"
            >
              <span>统计字段</span>
              <select
                v-model="store.aggregationFieldProxy"
                class="control"
              >
                <option
                  v-for="option in store.statisticalFieldOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>
          </div>

          <div class="section-head section-head--top">
            <span class="muted">排序规则</span>
            <button
              class="btn btn--ghost btn--small"
              @click="store.addSort"
            >
              添加排序
            </button>
          </div>
          <div class="stack gap-sm">
            <div
              v-for="(sort, index) in store.draft.template.sorts"
              :key="`${sort.field}-${index}`"
              class="filter-row filter-row--sort"
            >
              <select
                v-model="sort.field"
                class="control"
              >
                <option
                  v-for="option in store.sortFieldOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              <select
                v-model="sort.direction"
                class="control"
              >
                <option value="asc">
                  升序
                </option>
                <option value="desc">
                  降序
                </option>
              </select>
              <button
                class="btn btn--ghost btn--small"
                @click="store.removeSort(index)"
              >
                删除
              </button>
            </div>
          </div>

          <div class="section-head section-head--top">
            <span class="muted">输出字段</span>
          </div>
          <template v-if="store.aggregationEnabled">
            <p class="muted">
              统计查询会自动输出分组字段和统计值。
            </p>
          </template>
          <template v-else>
            <label
              v-for="option in store.selectableFieldOptions"
              :key="option.value"
              class="check"
            >
              <input
                type="checkbox"
                :checked="store.draft.template.fields.includes(option.value)"
                @change="store.toggleField(option.value)"
              >
              <span>{{ option.label }}</span>
              <small v-if="option.hint">{{ option.hint }}</small>
            </label>
            <div class="actions actions--inline">
              <input
                v-model="store.customFieldName"
                class="control"
                placeholder="自定义属性名，如 sprint"
              >
              <button
                class="btn btn--ghost btn--small"
                @click="store.addCustomField"
              >
                添加属性字段
              </button>
            </div>
          </template>
        </template>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from "vue"

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
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-soft);
  font: 14px/1.5 var(--sqb-sans);
}

.validation-item strong {
  flex: 0 0 auto;
}

.validation-item span {
  color: var(--sqb-text);
}

.validation-item--error {
  border-color: rgba(182, 67, 48, 0.26);
  background: rgba(182, 67, 48, 0.08);
  color: #8c2f22;
}

.validation-item--warning {
  border-color: rgba(171, 118, 28, 0.26);
  background: rgba(171, 118, 28, 0.08);
  color: #8a6211;
}

.section-head,
.actions,
.actions--inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
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
  padding: 22px;
  border-radius: 28px;
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
  font-size: 24px;
  line-height: 1.1;
}

.section-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
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

.section-toggle__chevron {
  display: inline-block;
  color: var(--sqb-text-muted);
  font: 600 18px/1 var(--sqb-sans);
  transition: transform 0.2s ease;
}

.section-toggle__chevron--collapsed {
  transform: rotate(180deg);
}

.title-input,
.control {
  width: 100%;
  box-sizing: border-box;
  border-radius: 16px;
  border: 1px solid var(--sqb-border);
  background: rgba(255, 255, 255, 0.9);
  color: var(--sqb-text);
  padding: 12px 14px;
  font: 14px/1.4 var(--sqb-sans);
  transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
}

.title-input:focus,
.control:focus {
  outline: none;
  border-color: rgba(74, 124, 89, 0.42);
  box-shadow: 0 0 0 4px rgba(74, 124, 89, 0.12);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex: 0 0 auto;
  transition: transform 140ms ease, background 140ms ease, border-color 140ms ease, color 140ms ease;
  cursor: pointer;
  font: 600 13px/1.2 var(--sqb-sans);
  white-space: nowrap;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn {
  border-radius: 16px;
  padding: 12px 18px;
  border: 1px solid transparent;
}

.btn--small {
  padding: 9px 13px;
  border-radius: 14px;
}

.btn--solid {
  background: var(--sqb-primary);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(74, 124, 89, 0.18);
  min-width: 148px;
  border-radius: 24px;
}

.btn--ghost {
  background: transparent;
  color: var(--sqb-primary);
  border-color: transparent;
  box-shadow: none;
  min-width: auto;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  border-radius: 999px;
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
  grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
  gap: 10px;
  align-items: center;
}

.filter-row--sort {
  grid-template-columns: minmax(0, 1fr) 120px auto;
}

.section-head--top {
  margin-top: 20px;
}

.check {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-soft);
}

.check span {
  color: var(--sqb-text);
  font: 600 14px/1.35 var(--sqb-sans);
}

.check small {
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
  .form-grid {
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
