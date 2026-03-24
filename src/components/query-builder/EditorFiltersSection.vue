<template>
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
          :title="props.collapsed ? '展开条件编辑器' : '收起条件编辑器'"
          :aria-label="props.collapsed ? '展开条件编辑器' : '收起条件编辑器'"
          :aria-expanded="String(!props.collapsed)"
          @click="$emit('toggle')"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            :class="{ 'is-expanded': !props.collapsed }"
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
                :data-filter-condition-toggle="filter.id"
                class="filter-row__logic"
                :data-state="filter.condition || 'and'"
                type="button"
                :title="`切换条件连接词，当前为 ${props.displayFilterCondition(filter.condition)}`"
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
        还没有筛选条件，可以先从状态、日期、项目开始。
      </p>
    </template>
  </article>
</template>

<script setup lang="ts">
import DeleteIconButton from "@/components/query-builder/DeleteIconButton.vue"
import { useQueryBuilderStore } from "@/composables/query-builder-store"
import type { FilterOperator, QueryFilter } from "@/core/query/types"

defineEmits<{
  toggle: []
}>()

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
