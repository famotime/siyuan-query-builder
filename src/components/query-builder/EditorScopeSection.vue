<template>
  <article class="card card--scope">
    <div class="section-head">
      <div class="section-heading">
        <span class="section-kicker">Scope</span>
        <h3>查询范围</h3>
      </div>
      <button
        class="section-toggle"
        type="button"
        data-section-toggle="scope"
        :title="collapsed ? '展开查询范围' : '收起查询范围'"
        :aria-label="collapsed ? '展开查询范围' : '收起查询范围'"
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
    <p class="section-copy">
      定义这次查询要覆盖哪些笔记内容，再用更精确的值缩小范围。
    </p>
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
import { useQueryBuilderStore } from "@/composables/query-builder-store"

defineProps<{
  collapsed: boolean
}>()

defineEmits<{
  toggle: []
}>()

const store = useQueryBuilderStore()
</script>
