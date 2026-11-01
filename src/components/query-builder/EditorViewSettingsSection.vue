<template>
  <article class="card card--full">
    <div class="section-head">
      <div class="section-heading">
        <span class="section-kicker">View Settings</span>
        <h3>排序、分组与字段</h3>
      </div>
      <button
        v-sqb-tooltip="collapsed ? '展开排序、分组与字段' : '收起排序、分组与字段'"
        class="section-toggle"
        type="button"
        data-section-toggle="view"
        :aria-label="collapsed ? '展开排序、分组与字段' : '收起排序、分组与字段'"
        :aria-expanded="String(!collapsed)"
        @click="emit('toggle')"
      >
        <ChevronDown
          class="sqb-wireframe-icon"
          style="fill: none !important;"
          :class="{ 'is-expanded': !collapsed }"
          :size="15"
          :stroke-width="1.75"
        />
      </button>
    </div>
    <template v-if="!collapsed">
      <div class="form-grid form-grid--top">
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
          <span>统计函数</span>
          <select
            v-model="aggregationModeProxy"
            data-aggregation-function
            class="control"
          >
            <option value="">
              不使用
            </option>
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

      <div
        v-if="aggregationModeProxy"
        class="form-grid form-grid--aggregation"
      >
        <label
          v-if="aggregationModeProxy !== 'count'"
          data-aggregation-field
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
          <div class="view-config-panel__head">
            <div class="view-config-panel__copy">
              <span class="section-kicker">Sort Rules</span>
              <h4>排序规则</h4>
            </div>
            <button
              v-sqb-tooltip="'新增排序规则'"
              class="btn btn--ghost btn--small"
              type="button"
              aria-label="添加排序"
              @click="store.addSort"
            >
              <Plus
                class="btn__icon sqb-wireframe-icon"
                style="fill: none !important;"
                :size="14"
                :stroke-width="1.75"
              />
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
                <option value="random">
                  随机排序
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
          <div class="view-config-panel__head">
            <div class="view-config-panel__copy">
              <span class="section-kicker">Output Fields</span>
              <h4>输出字段</h4>
            </div>
          </div>
          <EditorFieldPicker />
        </section>
      </div>
    </template>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { ChevronDown, Plus } from "lucide-vue-next"

import DeleteIconButton from "@/components/query-builder/DeleteIconButton.vue"
import EditorFieldPicker from "@/components/query-builder/EditorFieldPicker.vue"
import { useQueryBuilderStore } from "@/composables/query-builder-store"
import { vSqbTooltip } from "@/ui/tooltip"

defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const store = useQueryBuilderStore()
const aggregationModeProxy = computed({
  get: () => (store.aggregationEnabled ? store.aggregationFunctionProxy : ""),
  set: (value: string) => {
    if (!value) {
      store.aggregationEnabled = false
      return
    }

    store.aggregationEnabled = true
    store.aggregationFunctionProxy = value as "count" | "sum" | "avg" | "min" | "max"
  },
})
</script>

<style lang="scss" scoped>
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card {
  padding: 16px;
  border-radius: 12px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  box-shadow: var(--sqb-shadow-soft);
}

.card--full {
  grid-column: 1 / -1;
}

h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
}

.section-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-soft);
  color: var(--sqb-text-muted);
  cursor: pointer;
  transition: all 120ms ease;

  &:hover {
    background: var(--sqb-bg-strong);
    color: var(--sqb-primary);
    border-color: var(--sqb-primary);
  }
}

.section-toggle svg {
  transition: transform 140ms ease;
}

.section-toggle svg.is-expanded {
  transform: rotate(180deg);
}

.section-heading {
  display: grid;
  gap: 2px;
  text-align: left;
}

.section-kicker {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--sqb-primary);
  font: 700 10px/1.1 var(--sqb-sans);
}

.control {
  width: 100%;
  box-sizing: border-box;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--sqb-border);
  background-color: var(--sqb-surface-strong);
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
  box-shadow: 0 0 0 2px var(--sqb-primary-soft);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  flex: 0 0 auto;
  transition: all 120ms ease;
  cursor: pointer;
  font: 600 12px/1.2 var(--sqb-sans);
  white-space: nowrap;
  border-radius: 6px;
  padding: 0 10px;
  border: 1px solid transparent;
}

.btn--small {
  height: 26px;
  padding: 0 8px;
  font-size: 11px;
}

.btn--ghost {
  background: transparent;
  color: var(--sqb-text-muted);
  border-color: var(--sqb-border);

  &:hover {
    background: var(--sqb-bg-strong);
    color: var(--sqb-text);
    border-color: var(--sqb-border-strong);
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.form-grid--top {
  align-items: end;
}

.form-grid--aggregation {
  margin-top: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span {
  color: var(--sqb-secondary);
  font: 600 12px/1.2 var(--sqb-sans);
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

.view-config-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  margin-top: 14px;
}

.view-config-panel {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-soft);
}

.view-config-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--sqb-border);
}

.view-config-panel__copy {
  display: grid;
  gap: 2px;
}

.view-config-panel__copy h4 {
  margin: 0;
  font: 600 13px/1.2 var(--sqb-sans);
}

.stack {
  display: flex;
  flex-direction: column;
}

.gap-sm {
  gap: 8px;
}

.sqb-wireframe-icon,
:deep(svg) {
  fill: none !important;
}

.sqb-wireframe-icon *,
:deep(svg *) {
  fill: none !important;
  stroke: currentColor;
}

@media (max-width: 1100px) {
  .card--full,
  .view-config-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 900px) {
  .form-grid,
  .form-grid--aggregation,
  .view-config-row {
    grid-template-columns: 1fr;
  }
}
</style>
