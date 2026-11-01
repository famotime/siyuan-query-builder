<template>
  <article class="card card--scope">
    <div class="section-head">
      <div class="section-heading">
        <span class="section-kicker">Scope</span>
        <h3>查询范围</h3>
      </div>
      <button
        v-sqb-tooltip="collapsed ? '展开查询范围' : '收起查询范围'"
        class="section-toggle"
        type="button"
        data-section-toggle="scope"
        :aria-label="collapsed ? '展开查询范围' : '收起查询范围'"
        :aria-expanded="String(!collapsed)"
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
    <div
      v-if="!collapsed"
      class="form-grid form-grid--scope"
      data-scope-form
    >
      <label class="field">
        <span>范围类型</span>
        <select
          v-model="store.draft.template.scope.type"
          class="control"
        >
          <option value="all_blocks">
            全部块
          </option>
          <option value="notebook">
            笔记本
          </option>
          <option value="document">
            文档 ID
          </option>
          <option value="block_type">
            块类型
          </option>
          <option value="tag">
            标签
          </option>
          <option value="attribute">
            属性键
          </option>
        </select>
      </label>
      <label
        v-if="store.draft.template.scope.type !== 'all_blocks'"
        class="field"
      >
        <span>{{ store.scopeLabel }}</span>
        <select
          v-if="store.draft.template.scope.type === 'notebook'"
          v-model="store.draft.template.scope.value"
          class="control"
        >
          <option value="">
            选择笔记本
          </option>
          <option
            v-for="notebook in store.notebooks"
            :key="notebook.id"
            :value="notebook.id"
          >
            {{ notebook.name }}
          </option>
        </select>
        <select
          v-else-if="store.draft.template.scope.type === 'block_type'"
          v-model="store.draft.template.scope.value"
          class="control"
        >
          <option value="p">
            段落 p
          </option>
          <option value="h">
            标题 h
          </option>
          <option value="i">
            列表项 i
          </option>
          <option value="t">
            表格 t
          </option>
          <option value="d">
            文档 d
          </option>
        </select>
        <input
          v-else
          v-model="store.draft.template.scope.value"
          class="control"
          :placeholder="store.scopePlaceholder"
        >
      </label>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next"
import { useQueryBuilderStore } from "@/composables/query-builder-store"
import { vSqbTooltip } from "@/ui/tooltip"

defineProps<{
  collapsed: boolean
}>()

defineEmits<{
  toggle: []
}>()

const store = useQueryBuilderStore()
</script>

<style scoped>
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
