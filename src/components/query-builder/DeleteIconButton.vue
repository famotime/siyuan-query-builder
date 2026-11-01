<template>
  <button
    v-sqb-tooltip="title"
    class="delete-icon-button"
    type="button"
    :title="title"
    :aria-label="ariaLabel || title"
  >
    <Trash2
      class="sqb-wireframe-icon"
      style="fill: none !important;"
      :size="16"
      :stroke-width="1.75"
    />
  </button>
</template>

<script setup lang="ts">
import { Trash2 } from "lucide-vue-next"
import { vSqbTooltip } from "@/ui/tooltip"

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
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--sqb-text-muted);
  cursor: pointer;
  flex: 0 0 auto;
  transition: all 140ms ease;
}

.delete-icon-button:hover {
  color: var(--sqb-danger);
  background: var(--sqb-danger-soft);
  border-color: var(--sqb-danger-soft);
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

.delete-icon-button :deep(svg),
.sqb-wireframe-icon {
  fill: none !important;
}

.delete-icon-button :deep(svg *),
.sqb-wireframe-icon * {
  fill: none !important;
  stroke: currentColor;
}
</style>
