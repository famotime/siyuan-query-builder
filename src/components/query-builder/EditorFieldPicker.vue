<template>
  <template v-if="store.aggregationEnabled">
    <p class="muted">
      统计查询会自动输出分组字段和统计值。
    </p>
  </template>
  <template v-else>
    <div class="field-picker">
      <button
        class="field-picker__toggle"
        data-field-picker-toggle
        type="button"
        :aria-expanded="String(fieldPickerOpen)"
        @click="fieldPickerOpen = !fieldPickerOpen"
      >
        <span class="field-picker__summary">{{ selectedFieldSummary }}</span>
        <span
          class="field-picker__chevron"
          :class="{ 'field-picker__chevron--open': fieldPickerOpen }"
        >⌄</span>
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

import { useQueryBuilderStore } from "@/composables/query-builder-store"

const store = useQueryBuilderStore()
const fieldPickerOpen = ref(false)
const selectedFieldSummary = computed(() => `已选 ${store.draft.template.fields.length} 项`)
</script>

<style lang="scss" scoped>
.actions,
.actions--inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.muted {
  margin: 0;
  color: var(--sqb-text-muted);
  font: 14px/1.5 var(--sqb-sans);
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
  border-radius: 16px;
  padding: 12px 18px;
  border: 1px solid transparent;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn--small {
  padding: 9px 13px;
  border-radius: 14px;
}

.btn--ghost {
  background: transparent;
  color: var(--sqb-primary);
  border-color: transparent;
  box-shadow: none;
  min-width: auto;
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
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-soft);
  color: var(--sqb-text);
  cursor: pointer;
  text-align: left;
  font: 600 14px/1.35 var(--sqb-sans);
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
  border-radius: 18px;
  border: 1px solid var(--sqb-border);
  background: rgba(255, 255, 255, 0.82);
}

.field-picker__option {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
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
    align-items: stretch;
  }
}
</style>
