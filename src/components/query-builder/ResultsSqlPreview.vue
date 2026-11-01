<template>
  <section class="advanced-panel">
    <div class="advanced-panel__head">
      <div class="advanced-panel__copy">
        <span class="advanced-panel__eyebrow">SQL</span>
        <strong>SQL 预览</strong>
      </div>
      <button
        v-sqb-tooltip="advancedMode ? '收起 SQL 预览' : '展开 SQL 预览'"
        class="section-toggle"
        data-advanced-mode-toggle
        type="button"
        :aria-label="advancedMode ? '收起 SQL 预览' : '展开 SQL 预览'"
        :aria-expanded="String(advancedMode)"
        @click="$emit('toggle')"
      >
        <ChevronDown
          class="sqb-wireframe-icon"
          style="fill: none !important;"
          :class="{ 'is-expanded': advancedMode }"
          :size="15"
          :stroke-width="1.75"
        />
      </button>
    </div>
    <div
      v-if="advancedMode"
      class="sql-box"
      data-sql-preview
    >
      <div class="sql-box__surface">
        <div class="sql-box__toolbar">
          <span class="sql-box__language">SQL</span>
          <div class="sql-box__actions">
            <button
              class="sql-box__collapse"
              data-sql-preview-collapse
              type="button"
              aria-label="折叠查询区域"
              @click="$emit('toggle')"
            >
              折叠
            </button>
            <button
              v-sqb-tooltip="'复制 SQL (已脱敏)'"
              class="sql-box__copy"
              data-sql-copy
              type="button"
              aria-label="复制 SQL"
              :disabled="!hasAdvancedSql"
              @click="$emit('copy')"
            >
              <Copy
                class="sqb-wireframe-icon"
                style="fill: none !important;"
                :size="15"
                :stroke-width="1.75"
              />
            </button>
          </div>
        </div>
        <pre class="sql-box__code"><code>{{ advancedSql || "运行查询后会显示生成后的 SQL 表达。" }}</code></pre>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ChevronDown, Copy } from "lucide-vue-next"
import { vSqbTooltip } from "@/ui/tooltip"

defineProps<{
  advancedMode: boolean
  advancedSql: string
  hasAdvancedSql: boolean
}>()

defineEmits<{
  copy: []
  toggle: []
}>()
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
