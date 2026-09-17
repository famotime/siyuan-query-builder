<template>
  <header class="tuning-bar">
    <div class="tuning-bar__hero">
      <div class="tuning-bar__title-row">
        <h2 class="tuning-bar__title">{{ definition.title }}</h2>
        <span class="tuning-bar__badge">{{ categoryLabel }}</span>
      </div>
      <p class="tuning-bar__desc">{{ definition.description }}</p>
    </div>

    <!-- 参数快速微调区 -->
    <div class="tuning-bar__controls">
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

      <!-- 操作按钮 -->
      <div class="tuning-bar__actions">
        <button
          class="tuning-bar__btn tuning-bar__btn--primary"
          title="根据当前参数重新计算并刷新大盘"
          @click="$emit('refresh')"
        >
          刷新计算
        </button>
        <button
          class="tuning-bar__btn"
          title="将当前大盘另存为可重复使用的查询模板"
          @click="$emit('saveAsTemplate')"
        >
          另存为模板
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue"
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
  flex-direction: column;
  gap: 12px;
  padding: 14px 18px;
  background: var(--b3-theme-surface, rgba(0, 0, 0, 0.02));
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  margin-bottom: 16px;
}

.tuning-bar__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tuning-bar__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--b3-theme-on-background);
}

.tuning-bar__badge {
  display: inline-flex;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 12px;
  background: var(--b3-theme-primary);
  color: var(--b3-theme-on-primary, #ffffff);
}

.tuning-bar__desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  line-height: 1.4;
}

.tuning-bar__controls {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px dashed var(--b3-border-color);
}

.tuning-bar__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tuning-bar__label {
  font-size: 11px;
  font-weight: 500;
  color: var(--b3-theme-on-surface-light);
}

.tuning-bar__input {
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--b3-border-color);
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  outline: none;
}

.tuning-bar__input:focus {
  border-color: var(--b3-theme-primary);
}

.tuning-bar__select {
  min-width: 120px;
}

.tuning-bar__number {
  width: 72px;
}

.tuning-bar__text {
  min-width: 120px;
}

.tuning-bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.tuning-bar__btn {
  height: 28px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid var(--b3-border-color);
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  font-size: 12px;
  cursor: pointer;
}

.tuning-bar__btn:hover {
  background: var(--b3-list-hover);
}

.tuning-bar__btn--primary {
  background: var(--b3-theme-primary);
  color: var(--b3-theme-on-primary, #ffffff);
  border-color: var(--b3-theme-primary);
  font-weight: 500;
}

.tuning-bar__btn--primary:hover {
  opacity: 0.9;
}
</style>
