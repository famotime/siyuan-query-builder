<template>
  <section class="editor">
    <header class="editor__header">
      <div>
        <p class="eyebrow">
          Query Draft
        </p>
        <input
          v-model="store.draft.template.name"
          class="title-input"
          placeholder="给查询命名"
        >
      </div>
      <div class="actions">
        <label class="chip">
          <input
            v-model="store.advancedMode"
            type="checkbox"
          >
          <span>高级模式</span>
        </label>
        <button
          class="btn btn--ghost"
          :disabled="store.saving"
          @click="store.saveTemplate"
        >
          {{ store.saving ? "保存中..." : "保存模板" }}
        </button>
        <button
          class="btn btn--solid"
          :disabled="store.loading"
          @click="store.runQuery"
        >
          刷新结果
        </button>
      </div>
    </header>

    <div class="grid">
      <article class="card">
        <div class="section-head">
          <button
            class="section-toggle"
            type="button"
            data-section-toggle="scope"
            :aria-expanded="String(!collapsedSections.scope)"
            @click="toggleSection('scope')"
          >
            <h3>查询范围</h3>
            <span
              class="section-toggle__chevron"
              :class="{ 'section-toggle__chevron--collapsed': collapsedSections.scope }"
            >⌄</span>
          </button>
        </div>
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

      <article class="card">
        <div class="section-head">
          <button
            class="section-toggle"
            type="button"
            data-section-toggle="mappings"
            :aria-expanded="String(!collapsedSections.mappings)"
            @click="toggleSection('mappings')"
          >
            <h3>字段映射</h3>
            <span
              class="section-toggle__chevron"
              :class="{ 'section-toggle__chevron--collapsed': collapsedSections.mappings }"
            >⌄</span>
          </button>
          <span class="muted">快速编辑会用这里的属性名</span>
        </div>
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

      <article class="card">
        <div class="section-head">
          <button
            class="section-toggle"
            type="button"
            data-section-toggle="filters"
            :aria-expanded="String(!collapsedSections.filters)"
            @click="toggleSection('filters')"
          >
            <h3>条件编辑器</h3>
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

      <article class="card">
        <div class="section-head">
          <button
            class="section-toggle"
            type="button"
            data-section-toggle="view"
            :aria-expanded="String(!collapsedSections.view)"
            @click="toggleSection('view')"
          >
            <h3>排序、分组与字段</h3>
            <span
              class="section-toggle__chevron"
              :class="{ 'section-toggle__chevron--collapsed': collapsedSections.view }"
            >⌄</span>
          </button>
        </div>
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
                  v-for="option in store.fieldOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>
            <label class="field">
              <span>视图类型</span>
              <div class="tabs">
                <button
                  class="tabs__item"
                  :class="{ 'tabs__item--active': store.draft.view.type === 'table' }"
                  @click="store.draft.view.type = 'table'"
                >
                  表格
                </button>
                <button
                  class="tabs__item"
                  :class="{ 'tabs__item--active': store.draft.view.type === 'board' }"
                  @click="store.draft.view.type = 'board'"
                >
                  看板
                </button>
                <button
                  class="tabs__item"
                  :class="{ 'tabs__item--active': store.draft.view.type === 'list' }"
                  @click="store.draft.view.type = 'list'"
                >
                  列表
                </button>
                <button
                  class="tabs__item"
                  :class="{ 'tabs__item--active': store.draft.view.type === 'cards' }"
                  @click="store.draft.view.type = 'cards'"
                >
                  卡片
                </button>
              </div>
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
                  v-for="option in store.fieldOptions"
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
          <label
            v-for="option in store.fieldOptions"
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
  gap: 18px;
}

.editor__header,
.section-head,
.actions,
.actions--inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
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
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 251, 245, 0.9);
  border: 1px solid rgba(59, 46, 32, 0.12);
  box-shadow: 0 18px 48px rgba(87, 63, 33, 0.08);
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font: 700 11px/1.3 "Trebuchet MS", "Microsoft YaHei", sans-serif;
  opacity: 0.72;
}

h3 {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
}

.section-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.section-toggle__chevron {
  display: inline-block;
  color: rgba(32, 26, 21, 0.54);
  font: 600 18px/1 "Trebuchet MS", "Microsoft YaHei", sans-serif;
  transition: transform 0.2s ease;
}

.section-toggle__chevron--collapsed {
  transform: rotate(180deg);
}

.title-input,
.control {
  width: 100%;
  box-sizing: border-box;
  border-radius: 14px;
  border: 1px solid rgba(59, 46, 32, 0.16);
  background: rgba(255, 255, 255, 0.78);
  color: #201a15;
  padding: 11px 13px;
  font: 14px/1.4 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.title-input {
  border: none;
  background: transparent;
  padding: 0;
  font: 600 30px/1.08 Georgia, "Times New Roman", serif;
}

.title-input:focus,
.control:focus {
  outline: none;
  border-color: rgba(208, 93, 13, 0.46);
  box-shadow: 0 0 0 3px rgba(242, 126, 34, 0.12);
}

.btn,
.tabs__item {
  transition: transform 140ms ease;
  border: none;
  cursor: pointer;
  font: 600 13px/1.2 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.btn:hover,
.tabs__item:hover {
  transform: translateY(-1px);
}

.btn {
  border-radius: 999px;
  padding: 11px 16px;
}

.btn--small {
  padding: 8px 12px;
  border-radius: 12px;
}

.btn--solid {
  background: linear-gradient(135deg, #ce5b0a, #f27e22);
  color: #fff7ef;
}

.btn--ghost {
  background: transparent;
  color: inherit;
  border: 1px solid rgba(59, 46, 32, 0.16);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(59, 46, 32, 0.08);
  font: 600 13px/1.2 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.muted {
  margin: 0;
  color: rgba(32, 26, 21, 0.68);
  font: 14px/1.5 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span,
.check small {
  font: 13px/1.25 "Trebuchet MS", "Microsoft YaHei", sans-serif;
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

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px;
  border-radius: 18px;
  background: rgba(59, 46, 32, 0.08);
}

.tabs__item {
  flex: 1 1 calc(50% - 8px);
  padding: 10px 14px;
  border-radius: 999px;
  background: transparent;
  color: rgba(32, 26, 21, 0.62);
}

.tabs__item--active {
  background: #201a15;
  color: #f8f1e6;
}

.section-head--top {
  margin-top: 14px;
}

.check {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(59, 46, 32, 0.1);
  background: rgba(255, 255, 255, 0.5);
}

@media (max-width: 1100px) {
  .grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .editor__header,
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
