<template>
  <span
    class="sy-icon"
    :class="{ 'is-disabled': disabled }"
    :style="iconStyles"
    aria-hidden="true"
  >
    <component
      :is="iconComponent"
      v-if="iconComponent"
      :size="numericSize"
      :stroke-width="strokeWidth"
    />
  </span>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  Code,
  Copy,
  Database,
  Eye,
  FileText,
  Filter,
  Folder,
  GripVertical,
  HelpCircle,
  Inbox,
  Kanban,
  Layers,
  LayoutGrid,
  List,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Table,
  Tag,
  Trash2,
  X,
} from 'lucide-vue-next'

const props = defineProps<{
  name: string
  size?: number | string
  strokeWidth?: number
  disabled?: boolean
}>()

const iconMap: Record<string, Component> = {
  refresh: RefreshCw,
  play: Play,
  run: Play,
  save: Save,
  settings: Settings,
  help: HelpCircle,
  folder: Folder,
  database: Database,
  sparkles: Sparkles,
  bookmark: Bookmark,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  trash: Trash2,
  delete: Trash2,
  plus: Plus,
  add: Plus,
  search: Search,
  filter: Filter,
  sliders: SlidersHorizontal,
  table: Table,
  list: List,
  kanban: Kanban,
  board: Kanban,
  cards: LayoutGrid,
  grid: LayoutGrid,
  copy: Copy,
  code: Code,
  check: Check,
  close: X,
  x: X,
  eye: Eye,
  tag: Tag,
  grip: GripVertical,
  inbox: Inbox,
  layers: Layers,
  file: FileText,
}

const numericSize = computed(() => {
  if (typeof props.size === 'number') return props.size
  if (typeof props.size === 'string') {
    const parsed = parseInt(props.size, 10)
    return isNaN(parsed) ? 16 : parsed
  }
  return 16
})

const strokeWidth = computed(() => {
  if (props.strokeWidth !== undefined) return props.strokeWidth
  return numericSize.value >= 24 ? 1.5 : 1.75
})

const iconComponent = computed(() => {
  const normalized = props.name.toLowerCase().replace(/^icon-?/, '')
  return iconMap[normalized] || iconMap[props.name] || FileText
})

const iconStyles = computed(() => ({
  width: `${numericSize.value}px`,
  height: `${numericSize.value}px`,
}))
</script>

<style scoped>
.sy-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: currentColor;
  transition: opacity 140ms ease, color 140ms ease;
}

.sy-icon :deep(svg) {
  fill: none !important;
}

.sy-icon :deep(svg *) {
  fill: none !important;
  stroke: currentColor;
}

.sy-icon.is-disabled {
  opacity: 0.5;
  color: var(--sqb-text-muted, #999);
}
</style>
