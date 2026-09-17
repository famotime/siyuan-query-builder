<template>
  <div class="dashboard-view">
    <!-- 顶部参数微调栏 -->
    <DashboardTuningBar
      v-if="definition"
      :definition="definition"
      :model-parameters="viewModel.parameters"
      :notebooks="notebooks"
      @update-param="onUpdateParam"
      @refresh="$emit('refresh')"
      @save-as-template="$emit('saveAsTemplate')"
    />

    <!-- 指标卡区域 -->
    <section
      v-if="viewModel.metrics && viewModel.metrics.length"
      class="dashboard-view__metrics"
    >
      <article
        v-for="m in viewModel.metrics"
        :key="m.id"
        class="dashboard-view__metric-card"
        :style="{ borderLeftColor: m.accentColor || 'var(--sqb-primary)' }"
      >
        <div class="dashboard-view__metric-header">
          <span class="dashboard-view__metric-label">{{ m.label }}</span>
        </div>
        <div class="dashboard-view__metric-main">
          <strong
            class="dashboard-view__metric-value"
            :style="{ color: m.accentColor || 'var(--sqb-primary)' }"
          >
            <span class="metric-num">{{ splitMetricValue(m.value).num }}</span>
            <span v-if="splitMetricValue(m.value).unit" class="metric-unit">{{ splitMetricValue(m.value).unitWithSpace }}</span>
          </strong>
          <!-- 环形/条形进度指示 -->
          <div
            v-if="m.progress != null"
            class="dashboard-view__metric-bar-track"
          >
            <div
              class="dashboard-view__metric-bar-fill"
              :style="{
                width: `${Math.min(100, Math.max(0, m.progress))}%`,
                backgroundColor: m.accentColor || 'var(--sqb-primary)',
              }"
            />
          </div>
        </div>
        <small v-if="m.subText" class="dashboard-view__metric-sub">
          {{ m.subText }}
        </small>
      </article>
    </section>

    <!-- 可视化图表网格 -->
    <section
      v-if="viewModel.charts && viewModel.charts.length"
      class="dashboard-view__charts"
      :class="{ 'dashboard-view__charts--multi': viewModel.charts.length > 1 }"
    >
      <div
        v-for="c in viewModel.charts"
        :key="c.id"
        class="dashboard-view__chart-item"
      >
        <ResultsChartView
          :option="c.option"
          :height="c.height || '290px'"
          @click-item="$emit('chartClick', $event)"
        />
      </div>
    </section>

    <!-- 任务月历区域 -->
    <section
      v-if="viewModel.calendar"
      class="dashboard-view__calendar-section"
    >
      <h3 class="dashboard-view__section-title">
        <CalendarDays class="wireframe-icon" :size="16" />
        <span>事项月历总览</span>
      </h3>
      <ResultsCalendarView
        :tasks="viewModel.calendar.tasks"
        :initial-month="viewModel.calendar.selectedMonth"
        @open-block="$emit('openBlock', $event)"
      />
    </section>

    <!-- 阶段看板区域 (如果具备 boardColumns) -->
    <section
      v-if="viewModel.boardColumns && viewModel.boardColumns.length"
      class="dashboard-view__board-section"
    >
      <h3 class="dashboard-view__section-title">
        <Kanban class="wireframe-icon" :size="16" />
        <span>阶段推进流转看板</span>
      </h3>
      <div class="dashboard-view__board">
        <div
          v-for="col in viewModel.boardColumns"
          :key="col.id"
          class="dashboard-view__board-col"
        >
          <header class="dashboard-view__board-col-head">
            <span class="dashboard-view__board-col-title">{{ col.title }}</span>
            <span class="dashboard-view__board-col-count">{{ col.count }}</span>
          </header>
          <div class="dashboard-view__board-cards">
            <article
              v-for="row in col.rows"
              :key="row.id"
              class="dashboard-view__board-card"
              @click="$emit('openBlock', row.id)"
            >
              <span class="dashboard-view__board-card-title">{{ row.content || '未命名' }}</span>
              <small v-if="row.hpath" class="dashboard-view__board-card-meta">{{ row.hpath }}</small>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- 核心待办/清单区域 -->
    <section
      v-if="viewModel.listItems && viewModel.listItems.length"
      class="dashboard-view__list-section"
    >
      <h3 class="dashboard-view__section-title">
        <ListTodo class="wireframe-icon" :size="16" />
        <span>待办与核心明细清单</span>
      </h3>
      <ul class="dashboard-view__list">
        <li
          v-for="item in viewModel.listItems"
          :key="item.id"
          class="dashboard-view__list-item"
          @click="$emit('openBlock', item.id)"
        >
          <span
            v-if="item.status"
            class="dashboard-view__status-dot"
            :class="`dashboard-view__status-dot--${item.status}`"
          />
          <span class="dashboard-view__list-text">{{ item.title }}</span>
          <div v-if="item.meta && item.meta.length" class="dashboard-view__list-meta">
            <span
              v-for="m in item.meta"
              :key="m"
              class="dashboard-view__meta-chip"
            >
              {{ m }}
            </span>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { CalendarDays, Kanban, ListTodo } from "lucide-vue-next"
import type { DashboardViewModel } from "@/core/dashboard/types"
import { getDashboardDefinition } from "@/core/dashboard/catalog"
import DashboardTuningBar from "./DashboardTuningBar.vue"
import ResultsChartView from "./ResultsChartView.vue"
import ResultsCalendarView from "./ResultsCalendarView.vue"

const props = defineProps<{
  viewModel: DashboardViewModel
  notebooks?: Array<{ id: string; name: string }>
}>()

const emit = defineEmits<{
  (e: "openBlock", blockId: string): void
  (e: "chartClick", params: any): void
  (e: "updateParam", id: string, val: any): void
  (e: "refresh"): void
  (e: "saveAsTemplate"): void
}>()

const definition = computed(() => {
  return getDashboardDefinition(props.viewModel.id)
})

function onUpdateParam(id: string, val: any) {
  emit("updateParam", id, val)
}

function splitMetricValue(val: string | number): { num: string; unit: string; unitWithSpace: string } {
  const str = String(val).trim()
  const match = str.match(/^([0-9.,+-]+)(\s*)(.*)$/)
  if (match && match[1]) {
    return {
      num: match[1],
      unit: match[3] || "",
      unitWithSpace: (match[2] || "") + (match[3] || ""),
    }
  }
  return { num: str, unit: "", unitWithSpace: "" }
}
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
}

.dashboard-view__section-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sqb-text);
  margin: 0 0 10px 0;
}

/* 指标卡行 */
.dashboard-view__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.dashboard-view__metric-card {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  border-left: 3px solid var(--sqb-primary);
  border-radius: 12px;
  box-shadow: var(--sqb-shadow-soft);
  backdrop-filter: blur(16px);
  gap: 6px;
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.dashboard-view__metric-card:hover {
  box-shadow: var(--sqb-shadow-strong);
  transform: translateY(-1px);
}

.dashboard-view__metric-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--sqb-text-muted);
}

.dashboard-view__metric-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dashboard-view__metric-value {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-family: var(--sqb-mono, 'JetBrains Mono', monospace);
  font-size: 26px;
  font-weight: 700;
  line-height: 1.15;
}

.metric-num {
  font-feature-settings: "tnum";
}

.metric-unit {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.85;
}

.dashboard-view__metric-bar-track {
  width: 100%;
  height: 5px;
  border-radius: 999px;
  background: var(--sqb-bg-strong);
  overflow: hidden;
  margin-top: 4px;
}

.dashboard-view__metric-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.dashboard-view__metric-sub {
  font-size: 11px;
  color: var(--sqb-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 图表网格 */
.dashboard-view__charts {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.dashboard-view__charts--multi {
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
}

.dashboard-view__chart-item {
  width: 100%;
}

/* 看板区域 */
.dashboard-view__board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.dashboard-view__board-col {
  display: flex;
  flex-direction: column;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  border-radius: 12px;
  padding: 12px;
  gap: 8px;
  box-shadow: var(--sqb-shadow-soft);
  backdrop-filter: blur(16px);
}

.dashboard-view__board-col-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dashboard-view__board-col-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--sqb-text);
}

.dashboard-view__board-col-count {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 10px;
  background: var(--sqb-bg-strong);
  color: var(--sqb-text-muted);
}

.dashboard-view__board-cards {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dashboard-view__board-card {
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: background 120ms ease, border-color 120ms ease;
}

.dashboard-view__board-card:hover {
  background: var(--sqb-bg-strong);
  border-color: var(--sqb-primary);
}

.dashboard-view__board-card-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--sqb-text);
}

.dashboard-view__board-card-meta {
  font-size: 10px;
  color: var(--sqb-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 清单列表 */
.dashboard-view__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--sqb-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--sqb-surface);
  box-shadow: var(--sqb-shadow-soft);
  backdrop-filter: blur(16px);
}

.dashboard-view__list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--sqb-border);
  cursor: pointer;
  transition: background 120ms ease;
}

.dashboard-view__list-item:last-child {
  border-bottom: 0;
}

.dashboard-view__list-item:hover {
  background: var(--sqb-bg-strong);
}

.dashboard-view__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #6b7280;
}

.dashboard-view__status-dot--doing {
  background: #eab308;
}

.dashboard-view__status-dot--done {
  background: #22c55e;
}

.dashboard-view__list-text {
  flex: 1;
  font-size: 13px;
  color: var(--sqb-text);
}

.dashboard-view__list-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dashboard-view__meta-chip {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 4px;
  background: var(--sqb-bg-strong);
  color: var(--sqb-text-muted);
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
