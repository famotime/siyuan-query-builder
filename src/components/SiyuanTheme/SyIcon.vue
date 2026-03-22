<template>
  <span
    class="sy-icon"
    :style="{ width: sizeStr, height: sizeStr }"
    aria-hidden="true"
  >
    <svg
      :width="sizeStr"
      :height="sizeStr"
      :style="{ color: disabled ? 'var(--sqb-text-muted)' : undefined }"
    >
      <use :xlink:href="`#${name}`" />
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  size?: number | string
  disabled?: boolean
}>()

const sizeStr = computed(() => {
  const s = props.size ?? 16
  return typeof s === 'number' ? `${s}px` : s
})
</script>

<style scoped>
.sy-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
