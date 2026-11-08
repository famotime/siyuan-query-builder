<template>
  <div
    :class="props.headClass"
    v-bind="attrs"
  >
    <slot name="lead" />
    <slot name="actions" />
    <CollapsibleToggle
      v-if="!props.hideToggle"
      :expanded="props.expanded"
      :expand-label="props.expandLabel"
      :collapse-label="props.collapseLabel"
      :chevron-size="props.chevronSize"
      :class="props.toggleClass"
      v-bind="props.toggleAttrs"
      @toggle="emit('toggle')"
    >
      <template
        v-if="$slots.chevron"
        #default="{ expanded: isExpanded }"
      >
        <slot
          :expanded="isExpanded"
          name="chevron"
        />
      </template>
    </CollapsibleToggle>
  </div>
</template>

<script setup lang="ts">
import { useAttrs } from "vue"

import CollapsibleToggle from "@/components/query-builder/CollapsibleToggle.vue"

defineOptions({ inheritAttrs: false })

/**
 * 可折叠区块的通用头部:标题/计数等由宿主经 #lead 插槽提供,
 * #actions 插槽承载头部右侧的额外按钮;默认内建折叠开关按钮
 * (chevron 旋转、aria-expanded、tooltip、data-* 测试锚点透传)。
 * 当开关需要与其它按钮一起嵌进 #actions 容器时,传 `hide-toggle`
 * 并在 #actions 内自行放置 <CollapsibleToggle>。
 * 组件只渲染头部行;折叠正文由宿主以 `v-if="expanded"` 自行控制(各处正文形态不同)。
 */
const props = withDefaults(defineProps<{
  expanded: boolean
  headClass?: string
  hideToggle?: boolean
  toggleClass?: string
  /** 透传到内建开关按钮上的属性,通常是 data-section-toggle 等测试锚点 */
  toggleAttrs?: Record<string, unknown>
  /** 提供后作为 tooltip 与 aria-label,随展开状态切换 */
  expandLabel?: string
  collapseLabel?: string
  chevronSize?: number
}>(), {
  headClass: "section-head",
  hideToggle: false,
  toggleClass: "section-toggle",
  toggleAttrs: () => ({}),
  chevronSize: 15,
})

const emit = defineEmits<{ (e: "toggle"): void }>()

const attrs = useAttrs()
</script>
