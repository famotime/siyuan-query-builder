<template>
  <button
    class="delete-icon-button"
    type="button"
    :title="title"
    :aria-label="ariaLabel || title"
  >
    <Trash2
      :size="17"
      :stroke-width="1.75"
    />
  </button>
</template>

<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'

defineProps<{
  title: string
  ariaLabel?: string
}>()
</script>

<style lang="scss" scoped>
.delete-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--sqb-text-muted);
  cursor: pointer;
  flex: 0 0 auto;
  transition: color 140ms ease, opacity 140ms ease;
}

.delete-icon-button:hover {
  color: var(--sqb-danger);
}

.delete-icon-button:focus-visible {
  outline: 2px solid var(--sqb-danger);
  outline-offset: 2px;
  border-radius: 6px;
}

.delete-icon-button:disabled {
  cursor: default;
  opacity: 0.45;
}

.delete-icon-button :deep(svg) {
  fill: none !important;
}

.delete-icon-button :deep(svg *) {
  fill: none !important;
  stroke: currentColor;
}
</style>
