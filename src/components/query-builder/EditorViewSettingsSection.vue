<template>
  <article class="card card--full">
    <div class="section-head">
      <button
        class="section-toggle"
        type="button"
        data-section-toggle="view"
        :aria-expanded="String(!collapsed)"
        @click="emit('toggle')"
      >
        <div class="section-heading">
          <span class="section-kicker">View Settings</span>
          <h3>排序、分组与字段</h3>
        </div>
        <span
          class="section-toggle__chevron"
          :class="{ 'section-toggle__chevron--collapsed': collapsed }"
        >⌄</span>
      </button>
    </div>
    <p class="section-copy">
      控制结果如何分组展示、如何排序，以及最终输出哪些字段。
    </p>
    <template v-if="!collapsed">
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

      <div
        class="view-config-row"
        data-view-config-row
      >
        <section
          class="view-config-panel"
          data-sort-panel
        >
          <div class="section-head section-head--top section-head--compact">
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
              <DeleteIconButton
                :data-sort-delete="String(index)"
                class="filter-row__delete"
                title="删除排序"
                aria-label="删除排序"
                @click="store.removeSort(index)"
              />
            </div>
          </div>
        </section>

        <section
          class="view-config-panel"
          data-field-panel
        >
          <div class="section-head section-head--top section-head--compact">
            <span class="muted">输出字段</span>
          </div>
          <EditorFieldPicker />
        </section>
      </div>
    </template>
  </article>
</template>

<script setup lang="ts">
import DeleteIconButton from "@/components/query-builder/DeleteIconButton.vue"
import EditorFieldPicker from "@/components/query-builder/EditorFieldPicker.vue"
import { useQueryBuilderStore } from "@/composables/query-builder-store"

defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const store = useQueryBuilderStore()
</script>

<style lang="scss" scoped>
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.card {
  padding: 18px;
  border-radius: 20px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  box-shadow: var(--sqb-shadow-soft);
}

.card--full {
  grid-column: 1 / -1;
}

h3 {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  font-family: var(--sqb-serif);
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

.control::placeholder {
  color: var(--sqb-text-muted);
  opacity: 0.6;
}

.control:hover {
  border-color: var(--sqb-border-strong);
}

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
  font: 13px/1.5 var(--sqb-sans);
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

.field span {
  color: var(--sqb-secondary);
  font: 700 13px/1.25 var(--sqb-sans);
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

.stack {
  display: flex;
  flex-direction: column;
}

.gap-sm {
  gap: 10px;
}

@media (max-width: 1100px) {
  .card--full,
  .form-grid,
  .view-config-row {
    grid-template-columns: 1fr;
    grid-column: auto;
  }
}

@media (max-width: 720px) {
  .filter-row,
  .filter-row--sort {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
}
</style>
