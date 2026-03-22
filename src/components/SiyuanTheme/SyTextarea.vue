<template>
  <textarea
    class="sy-textarea"
    :value="modelValue"
    v-bind="$attrs"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>

<script setup lang="ts">
defineProps(['modelValue'])
defineEmits(['update:modelValue'])
</script>

<style scoped>
.sy-textarea {
  width: 100%;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
  color: var(--sqb-text);
  font: 13px/1.5 var(--sqb-sans);
  resize: vertical;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.sy-textarea::placeholder {
  color: var(--sqb-text-muted);
  opacity: 0.6;
}

.sy-textarea:hover {
  border-color: var(--sqb-border-strong);
}

.sy-textarea:focus-visible {
  outline: none;
  border-color: var(--sqb-primary);
  box-shadow: 0 0 0 3px var(--sqb-primary-soft);
}

.sy-textarea:disabled {
  opacity: 0.5;
  background: var(--sqb-surface-muted);
  cursor: not-allowed;
}
</style>
