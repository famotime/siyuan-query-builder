<template>
  <select
    class="sy-select"
    :value="modelValue"
    v-bind="$attrs"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option
      v-for="item of options"
      :key="item.value"
      :value="item.value"
    >
      {{ item.text }}
    </option>
  </select>
</template>

<script setup lang="ts">
defineProps<{
  options: Array<{ value: string; text: string }>
  modelValue: string
}>()
defineEmits(['update:modelValue'])
</script>

<style scoped>
.sy-select {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
  color: var(--sqb-text);
  font: 13px/1.4 var(--sqb-sans);
  cursor: pointer;
  transition: border-color 140ms ease, box-shadow 140ms ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2362685f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M7 10l5 5 5-5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 28px;
}

.sy-select:hover {
  border-color: var(--sqb-border-strong);
}

.sy-select:focus-visible {
  outline: none;
  border-color: var(--sqb-primary);
  box-shadow: 0 0 0 3px var(--sqb-primary-soft);
}

.sy-select:disabled {
  opacity: 0.5;
  background-color: var(--sqb-surface-muted);
  cursor: not-allowed;
}
</style>
