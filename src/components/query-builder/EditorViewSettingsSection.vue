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
        :aria-expanded="!collapsed"
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
import {
  ChevronDown,
  Plus,
} from "lucide-vue-next"
import { computed } from "vue"

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
/*
 * 共享版式(section-head/control/btn/field/form-grid/filter-row 等)来自
 * editor-shared.scss 与 editor-filter-row.scss(由 QueryBuilderEditor 的 :deep 规则迁移);
 * 此前这些共享规则以更高优先级覆盖本文件的同名规则,被覆盖的声明已移除。
 * 本文件仅保留本分区独有或此前实际生效的规则。
 */
@use "./editor-shared";
@use "./editor-filter-row";

.section-toggle:hover {
  color: var(--sqb-primary);
  border-color: var(--sqb-primary);
}

.form-grid--top {
  align-items: end;
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
  .view-config-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 900px) {
  .view-config-row {
    grid-template-columns: 1fr;
  }
}
</style>
