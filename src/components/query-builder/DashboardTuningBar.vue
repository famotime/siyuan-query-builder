<template>
  <header class="tuning-bar">
    <!-- 左侧分类指示与参数过滤器 -->
    <div class="tuning-bar__controls">
      <div class="tuning-bar__lead">
        <SlidersHorizontal class="wireframe-icon" :size="14" />
        <span class="tuning-bar__title">{{ definition.title }}</span>
        <span class="tuning-bar__badge">{{ categoryLabel }}</span>
      </div>

      <div
        v-for="param in definition.parameters"
        :key="param.id"
        class="tuning-bar__field"
      >
        <label class="tuning-bar__label">{{ param.label }}</label>

        <!-- 笔记本下拉 -->
        <select
          v-if="param.type === 'notebook'"
          class="tuning-bar__input tuning-bar__select"
          :value="modelParameters[param.id] ?? param.defaultValue"
          @change="onParamChange(param.id, ($event.target as HTMLSelectElement).value)"
        >
          <option value="all">全库笔记本</option>
          <option
            v-for="nb in notebooks"
            :key="nb.id"
            :value="nb.id"
          >
            {{ nb.name }}
          </option>
        </select>

        <!-- 下拉单选 -->
        <select
          v-else-if="param.type === 'select'"
          class="tuning-bar__input tuning-bar__select"
          :value="modelParameters[param.id] ?? param.defaultValue"
          @change="onParamChange(param.id, ($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="opt in param.options"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>

        <!-- 数字输入框 -->
        <input
          v-else-if="param.type === 'number'"
          type="number"
          class="tuning-bar__input tuning-bar__number"
          :value="modelParameters[param.id] ?? param.defaultValue"
          @input="onParamChange(param.id, Number(($event.target as HTMLInputElement).value))"
        />

        <!-- 文本输入框 -->
        <input
          v-else
          type="text"
          class="tuning-bar__input tuning-bar__text"
          :placeholder="param.placeholder || ''"
          :value="modelParameters[param.id] ?? param.defaultValue"
          @change="onParamChange(param.id, ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- 右侧操作区：直观线框图标 + Tooltip -->
    <div class="tuning-bar__actions">
      <button
        class="tuning-bar__icon-btn tuning-bar__icon-btn--primary"
        type="button"
        title="根据当前参数重新计算并刷新"
        aria-label="根据当前参数重新计算并刷新"
        @click="$emit('refresh')"
      >
        <RotateCw class="wireframe-icon" :size="15" />
      </button>
      <button
        class="tuning-bar__icon-btn"
        type="button"
        title="将当前大盘另存为可复用查询模板"
        aria-label="将当前大盘另存为可复用查询模板"
        @click="$emit('saveAsTemplate')"
      >
        <BookmarkPlus class="wireframe-icon" :size="15" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { BookmarkPlus, RotateCw, SlidersHorizontal } from "lucide-vue-next"
import type { DashboardDefinition } from "@/core/dashboard/types"

const props = defineProps<{
  definition: DashboardDefinition
  modelParameters: Record<string, any>
  notebooks?: Array<{ id: string; name: string }>
}>()

const emit = defineEmits<{
  (e: "updateParam", id: string, val: any): void
  (e: "refresh"): void
  (e: "saveAsTemplate"): void
}>()

const categoryLabels: Record<string, string> = {
  daily: "日常生产力",
  habit: "微习惯成长",
  assets: "数字资产",
  creative: "创作与研读",
  project: "目标与交付",
}

const categoryLabel = computed(() => {
  return categoryLabels[props.definition.category] || "场景化大盘"
})

function onParamChange(id: string, val: any) {
  emit("updateParam", id, val)
}
</script>

<style scoped>
.tuning-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 14px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  border-radius: 12px;
  box-shadow: var(--sqb-shadow-soft);
  backdrop-filter: blur(16px);
  margin-bottom: 8px;
}

.tuning-bar__controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.tuning-bar__lead {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--sqb-text-muted);
}

.tuning-bar__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--sqb-text);
  white-space: nowrap;
}

.tuning-bar__badge {
  display: inline-flex;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
  background: var(--sqb-primary-soft, rgba(45, 106, 79, 0.12));
  color: var(--sqb-primary);
}

.tuning-bar__field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tuning-bar__label {
  font-size: 11px;
  font-weight: 500;
  color: var(--sqb-text-muted);
  white-space: nowrap;
}

.tuning-bar__input {
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
  color: var(--sqb-text);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.tuning-bar__input:focus {
  border-color: var(--sqb-primary);
  box-shadow: 0 0 0 2px var(--sqb-primary-soft);
}

.tuning-bar__select {
  min-width: 110px;
}

.tuning-bar__number {
  width: 72px;
}

.tuning-bar__text {
  min-width: 100px;
}

.tuning-bar__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.tuning-bar__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
  color: var(--sqb-text-muted);
  cursor: pointer;
  transition: all 140ms ease;
}

.tuning-bar__icon-btn:hover {
  background: var(--sqb-bg-strong);
  color: var(--sqb-primary);
  border-color: var(--sqb-primary);
}

.tuning-bar__icon-btn--primary {
  color: var(--sqb-primary);
}

.tuning-bar__icon-btn--primary:hover {
  background: var(--sqb-primary-soft);
}

.wireframe-icon {
  fill: none !important;
  stroke: currentColor;
  stroke-width: 1.75;
}

:deep(svg) {
  fill: none !important;
}

:deep(svg *) {
  fill: none !important;
  stroke: currentColor;
}
</style>
