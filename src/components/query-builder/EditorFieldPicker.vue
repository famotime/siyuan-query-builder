<template>
  <template v-if="store.aggregationEnabled">
    <p class="muted">
      统计查询会自动输出分组字段和统计值。
    </p>
  </template>
  <template v-else>
    <div class="field-picker">
      <button
        class="field-picker__toggle control"
        data-field-picker-toggle
        type="button"
        :aria-expanded="String(fieldPickerOpen)"
        @click="fieldPickerOpen = !fieldPickerOpen"
      >
        <span class="field-picker__summary">{{ selectedFieldSummary }}</span>
        <ChevronDown
          class="field-picker__chevron"
          :class="{ 'field-picker__chevron--open': fieldPickerOpen }"
          :size="16"
          :stroke-width="1.75"
        />
      </button>
      <div
        v-if="fieldPickerOpen"
        class="field-picker__menu"
      >
        <label
          v-for="option in store.selectableFieldOptions"
          :key="option.value"
          class="field-picker__option"
        >
          <input
            :data-field-option="option.value"
            type="checkbox"
            :checked="store.draft.template.fields.includes(option.value)"
            @change="store.toggleField(option.value)"
          >
          <span>{{ option.label }}</span>
          <small v-if="option.hint">{{ option.hint }}</small>
        </label>
      </div>
    </div>
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

<script setup lang="ts">
import { computed, ref } from "vue"
import { ChevronDown } from "lucide-vue-next"

import { useQueryBuilderStore } from "@/composables/query-builder-store"

const store = useQueryBuilderStore()
const fieldPickerOpen = ref(false)
const selectedFieldSummary = computed(() => `已选 ${store.draft.template.fields.length} 项`)
</script>

<style lang="scss" scoped>
/*
 * 共享版式(.actions/.muted/.title-input/.control/.btn 等)来自 editor-shared.scss
 * (由 QueryBuilderEditor 的 :deep 规则迁移,此前以更高优先级覆盖本文件的同名规则,
 * 被覆盖的声明已移除)。本文件仅保留字段选择器独有样式。
 */
@use "./editor-shared";

.field-picker {
  margin-top: 0;
}

.field-picker__toggle {
  width: 100%;
  height: 32px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
  color: var(--sqb-text);
  cursor: pointer;
  text-align: left;
  font: 13px/1.4 var(--sqb-sans);
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.field-picker__toggle:hover {
  border-color: var(--sqb-border-strong);
}

.field-picker__summary {
  min-width: 0;
}

.field-picker__chevron {
  flex: 0 0 auto;
  color: var(--sqb-text-muted);
  transition: transform 140ms ease;
}

.field-picker__chevron--open {
  transform: rotate(180deg);
}

.field-picker__menu {
  display: grid;
  gap: 6px;
  margin-top: 8px;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface);
}

.field-picker__option {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
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

@media (max-width: 720px) {
  .actions,
  .actions--inline {
    flex-direction: column;
  }
}
</style>
