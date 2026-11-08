<template>
  <button
    v-sqb-tooltip="label"
    type="button"
    :aria-label="label"
    :aria-expanded="expanded"
    @click="emit('toggle')"
  >
    <slot :expanded="expanded">
      <ChevronDown
        class="sqb-wireframe-icon"
        style="fill: none !important;"
        :class="{ 'is-expanded': expanded }"
        :size="chevronSize"
        :stroke-width="1.75"
      />
    </slot>
  </button>
</template>

<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next"
import { computed } from "vue"
import { vSqbTooltip } from "@/ui/tooltip"

/**
 * 折叠开关按钮原子:chevron 旋转、aria-expanded、随状态切换的 tooltip/aria-label。
 * 根元素为单个 button,`class` 与 `data-section-toggle` 等测试锚点属性直接透传。
 */
const props = withDefaults(defineProps<{
  expanded: boolean
  /** 提供后作为 tooltip 与 aria-label,随展开状态切换 */
  expandLabel?: string
  collapseLabel?: string
  chevronSize?: number
}>(), {
  chevronSize: 15,
})

const emit = defineEmits<{ (e: "toggle"): void }>()

const label = computed(() =>
  props.expandLabel && props.collapseLabel
    ? (props.expanded ? props.collapseLabel : props.expandLabel)
    : undefined)
</script>
