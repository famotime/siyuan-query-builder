<template>
  <article class="card card--full">
    <div class="section-head">
      <div class="section-heading">
        <span class="section-kicker">Filters</span>
        <h3>条件编辑器</h3>
      </div>
      <div class="section-head-actions">
        <button
          v-sqb-tooltip="'新增一条筛选过滤规则'"
          class="btn btn--solid btn--small"
          data-add-filter
          aria-label="添加条件"
          @click="store.addFilter"
        >
          <Plus
            class="btn__icon sqb-wireframe-icon"
            style="fill: none !important;"
            :size="14"
            :stroke-width="1.75"
          />
          添加条件
        </button>
        <button
          v-sqb-tooltip="props.collapsed ? '展开条件编辑器' : '收起条件编辑器'"
          class="section-toggle"
          type="button"
          data-section-toggle="filters"
          :aria-label="props.collapsed ? '展开条件编辑器' : '收起条件编辑器'"
          :aria-expanded="!props.collapsed"
          @click="$emit('toggle')"
        >
          <ChevronDown
            class="sqb-wireframe-icon"
            style="fill: none !important;"
            :class="{ 'is-expanded': !props.collapsed }"
            :size="15"
            :stroke-width="1.75"
          />
        </button>
      </div>
    </div>
    <template v-if="!props.collapsed">
      <div
        v-if="store.draft.template.filters.length"
        class="stack gap-sm"
      >
        <div
          v-for="(filter, index) in store.draft.template.filters"
          :key="filter.id"
          class="filter-row"
          :data-filter-row="filter.id"
          draggable="true"
          :class="{
            'filter-row--dragging': props.draggingFilterId === filter.id,
            'filter-row--drop-before': props.dragOverFilterId === filter.id && props.dragOverPlacement === 'before',
            'filter-row--drop-after': props.dragOverFilterId === filter.id && props.dragOverPlacement === 'after',
            'filter-row--range': filter.operator === 'date_between',
          }"
          @dragstart="onFilterRowDragStart(filter.id, $event)"
          @dragend="props.clearFilterDrag"
          @dragover.prevent="props.onFilterDragOver(filter.id, $event)"
          @drop.prevent="props.onFilterDrop(filter.id)"
        >
          <select
            :value="filter.field"
            :data-filter-field="filter.id"
            class="control"
            @change="onFieldChange(filter, $event)"
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
              v-for="option in props.filterOperatorOptions(filter.field)"
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
            class="control filter-row__value"
            :type="filter.operator.includes('days') ? 'number' : 'text'"
            :value="String(filter.value || '')"
            @input="filter.value = ($event.target as HTMLInputElement).value"
          >
          <div
            class="filter-row__actions"
            :data-filter-actions="filter.id"
          >
            <template v-if="index > 0">
              <button
                v-sqb-tooltip="`切换连接符，当前为 ${props.displayFilterCondition(filter.condition)}`"
                :data-filter-condition-toggle="filter.id"
                class="filter-row__logic"
                :data-state="filter.condition || 'and'"
                type="button"
                :aria-label="`切换条件连接词，当前为 ${props.displayFilterCondition(filter.condition)}`"
                @click="props.toggleFilterCondition(index)"
              >
                {{ props.displayFilterCondition(filter.condition) }}
              </button>
            </template>
            <span
              v-else
              class="filter-row__logic-spacer"
              aria-hidden="true"
            />
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
        暂无筛选条件，点击上方添加。
      </p>
    </template>
  </article>
</template>

<script setup lang="ts">
import type {
  FilterOperator,
  QueryFilter,
} from "@/core/query/types"
import {
  ChevronDown,
  Plus,
} from "lucide-vue-next"
import DeleteIconButton from "@/components/query-builder/DeleteIconButton.vue"
import { useQueryBuilderStore } from "@/composables/query-builder-store"
import { vSqbTooltip } from "@/ui/tooltip"

const props = defineProps<{
  collapsed: boolean
  draggingFilterId: string
  dragOverFilterId: string
  dragOverPlacement: "before" | "after" | ""
  filterOperatorOptions: (field: string) => Array<{ value: FilterOperator, label: string }>
  normalizeFilterOperator: (filter: QueryFilter) => void
  displayFilterCondition: (condition?: "and" | "or") => string
  toggleFilterCondition: (index: number) => void
  onFilterDragStart: (filterId: string) => void
  onFilterDragOver: (targetFilterId: string, event: DragEvent) => void
  onFilterDrop: (targetFilterId: string) => void
  clearFilterDrag: () => void
}>()

defineEmits<{
  toggle: []
}>()

const store = useQueryBuilderStore()

function onFieldChange(filter: QueryFilter, event: Event) {
  filter.field = (event.target as HTMLSelectElement).value
  props.normalizeFilterOperator(filter)
}

function onFilterRowDragStart(filterId: string, event: DragEvent) {
  const target = event.target
  if (target instanceof HTMLElement && target.closest("button, input, select, textarea, a, [role='button'], [contenteditable='true']")) {
    event.preventDefault()
    return
  }

  props.onFilterDragStart(filterId)
}
</script>

<style lang="scss" scoped>
@use "./editor-shared";
@use "./editor-filter-row";

.sqb-wireframe-icon,
:deep(svg) {
  fill: none !important;
}

.sqb-wireframe-icon *,
:deep(svg *) {
  fill: none !important;
  stroke: currentColor;
}
</style>
