<template>
  <article class="card card--mappings">
    <div class="section-head">
      <div class="section-heading">
        <span class="section-kicker">Field Mapping</span>
        <h3>字段映射</h3>
      </div>
      <div class="section-head-actions">
        <button
          v-sqb-tooltip="'一键填充常用的属性映射示例'"
          class="btn btn--outline btn--small"
          data-generate-examples
          type="button"
          aria-label="生成示例"
          @click="store.generateExampleDocument"
        >
          <Sparkles
            class="btn__icon sqb-wireframe-icon"
            style="fill: none !important;"
            :size="14"
            :stroke-width="1.75"
          />
          生成示例
        </button>
        <button
          v-sqb-tooltip="collapsed ? '展开字段映射' : '收起字段映射'"
          class="section-toggle"
          type="button"
          data-section-toggle="mappings"
          :aria-label="collapsed ? '展开字段映射' : '收起字段映射'"
          :aria-expanded="!collapsed"
          @click="$emit('toggle')"
        >
          <ChevronDown
            class="sqb-wireframe-icon"
            style="fill: none !important;"
            :class="{ 'is-expanded': !collapsed }"
            :size="15"
            :stroke-width="1.75"
          />
        </button>
      </div>
    </div>
    <div
      v-if="!collapsed"
      class="form-grid"
    >
      <label
        v-for="key in store.mappingKeys"
        :key="key"
        class="field"
      >
        <span>{{ store.mappingLabels[key] }}</span>
        <input
          v-model="store.draft.view.fieldMappings[key]"
          class="control"
        >
        <small
          :data-mapping-hint="key"
          class="field-hint"
        >
          {{ mappingHints[key] }}
        </small>
      </label>
    </div>
  </article>
</template>

<script setup lang="ts">
import {
  ChevronDown,
  Sparkles,
} from "lucide-vue-next"
import { useQueryBuilderStore } from "@/composables/query-builder-store"
import { vSqbTooltip } from "@/ui/tooltip"

defineProps<{
  collapsed: boolean
  mappingHints: Record<"status" | "dueDate" | "priority" | "project" | "owner", string>
}>()

defineEmits<{
  toggle: []
}>()

const store = useQueryBuilderStore()
</script>

<style lang="scss" scoped>
@use "./editor-shared";

.sqb-wireframe-icon,
:deep(svg) {
  fill: none !important;
}

.sqb-wireframe-icon *,
:deep(svg *) {
  fill: none !important;
  stroke: currentColor;
}
</style>
