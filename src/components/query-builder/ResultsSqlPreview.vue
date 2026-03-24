<template>
  <section class="advanced-panel">
    <div class="advanced-panel__head">
      <div class="advanced-panel__copy">
        <span class="advanced-panel__eyebrow">SQL</span>
        <strong>SQL 预览</strong>
        <span>查看当前查询生成的 SQL 表达。</span>
      </div>
      <button
        class="section-toggle"
        data-advanced-mode-toggle
        type="button"
        :title="advancedMode ? '收起 SQL 预览' : '展开 SQL 预览'"
        :aria-label="advancedMode ? '收起 SQL 预览' : '展开 SQL 预览'"
        :aria-expanded="String(advancedMode)"
        @click="$emit('toggle')"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          :class="{ 'is-expanded': advancedMode }"
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
              title="折叠查询区域"
              aria-label="折叠查询区域"
              @click="$emit('toggle')"
            >
              折叠
            </button>
            <button
              class="sql-box__copy"
              data-sql-copy
              type="button"
              title="复制 SQL"
              aria-label="复制 SQL"
              :disabled="!hasAdvancedSql"
              @click="$emit('copy')"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M9 9.75V7.5A2.25 2.25 0 0 1 11.25 5.25h7.5A2.25 2.25 0 0 1 21 7.5V15a2.25 2.25 0 0 1-2.25 2.25H16.5M9 9.75H6.75A2.25 2.25 0 0 0 4.5 12v6a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 16.5 18v-.75M9 9.75h7.5v7.5H9z"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                />
              </svg>
            </button>
          </div>
        </div>
        <pre class="sql-box__code"><code>{{ advancedSql || "运行查询后会显示生成后的 SQL 表达。" }}</code></pre>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
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
