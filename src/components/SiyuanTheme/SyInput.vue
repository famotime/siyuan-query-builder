<template>
  <input
    class="sy-input"
    :value="modelValue"
    v-bind="$attrs"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<script setup lang="ts">
defineProps(['modelValue'])
defineEmits(['update:modelValue'])
</script>

<style scoped>
.sy-input {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
  color: var(--sqb-text);
  font: 13px/1.4 var(--sqb-sans);
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.sy-input::placeholder {
  color: var(--sqb-text-muted);
  opacity: 0.6;
}

.sy-input:hover {
  border-color: var(--sqb-border-strong);
}

.sy-input:focus-visible {
  outline: none;
  border-color: var(--sqb-primary);
  box-shadow: 0 0 0 3px var(--sqb-primary-soft);
}

.sy-input:disabled {
  opacity: 0.5;
  background: var(--sqb-surface-muted);
  cursor: not-allowed;
}
</style>
