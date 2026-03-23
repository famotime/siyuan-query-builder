<template>
  <article class="card card--mappings">
    <div class="section-head">
      <div class="section-heading">
        <span class="section-kicker">Field Mapping</span>
        <h3>字段映射</h3>
      </div>
      <div class="section-head-actions">
        <button
          class="btn btn--outline btn--small"
          data-generate-examples
          type="button"
          @click="store.generateExampleDocument"
        >
          生成示例
        </button>
        <button
          class="section-toggle"
          type="button"
          data-section-toggle="mappings"
          :title="collapsed ? '展开字段映射' : '收起字段映射'"
          :aria-label="collapsed ? '展开字段映射' : '收起字段映射'"
          :aria-expanded="String(!collapsed)"
          @click="$emit('toggle')"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            :class="{ 'is-expanded': !collapsed }"
          >
            <path
              d="M7 10l5 5 5-5"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.2"
            />
          </svg>
        </button>
      </div>
    </div>
    <p class="section-copy">
      快速编辑、看板列和统计字段都会依赖这里的属性名称。
    </p>
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
import { useQueryBuilderStore } from "@/composables/query-builder-store"

defineProps<{
  collapsed: boolean
  mappingHints: Record<"status" | "dueDate" | "priority" | "project" | "owner", string>
}>()

defineEmits<{
  toggle: []
}>()

const store = useQueryBuilderStore()
</script>
