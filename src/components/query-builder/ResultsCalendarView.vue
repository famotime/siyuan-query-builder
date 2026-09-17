<template>
  <div class="calendar-view">
    <!-- 顶部工具栏：月份导航与状态筛选 -->
    <header class="calendar-view__bar">
      <div class="calendar-view__nav">
        <button
          class="calendar-view__nav-btn"
          title="上个月"
          @click="changeMonth(-1)"
        >
          &lt;
        </button>
        <span class="calendar-view__month-label">{{ gridModel.monthTitle }}</span>
        <button
          class="calendar-view__nav-btn"
          title="下个月"
          @click="changeMonth(1)"
        >
          &gt;
        </button>
        <button
          class="calendar-view__today-btn"
          @click="goToday"
        >
          今天
        </button>
      </div>

      <div class="calendar-view__filters">
        <button
          v-for="item in filterOptions"
          :key="item.key"
          class="calendar-view__filter-chip"
          :class="{ 'calendar-view__filter-chip--active': currentFilter === item.key }"
          @click="currentFilter = item.key"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="calendar-view__stats">
        <span>共 {{ gridModel.totalTasks }} 项</span>
        <span v-if="gridModel.openTasks > 0" class="calendar-view__pending-badge">
          {{ gridModel.openTasks }} 待办
        </span>
      </div>
    </header>

    <!-- 星期表头 -->
    <div class="calendar-view__week-head">
      <span
        v-for="w in gridModel.weekLabels"
        :key="w"
        class="calendar-view__week-label"
      >
        周{{ w }}
      </span>
    </div>

    <!-- 月历网格 -->
    <div class="calendar-view__grid">
      <div
        v-for="cell in allCells"
        :key="cell.iso"
        class="calendar-view__cell"
        :class="{
          'calendar-view__cell--other-month': !cell.isCurrentMonth,
          'calendar-view__cell--today': cell.isToday,
        }"
      >
        <div class="calendar-view__cell-head">
          <span
            class="calendar-view__day-num"
            :class="{
              'calendar-view__day-num--today': cell.isToday,
              'calendar-view__day-num--pending': cell.hasPending && !cell.isToday,
            }"
          >
            {{ cell.dayNumber }}
          </span>
        </div>

        <!-- 任务列表 -->
        <div class="calendar-view__cell-tasks">
          <article
            v-for="task in cell.visibleTasks"
            :key="task.id"
            class="calendar-view__task-card"
            :class="`calendar-view__task-card--${task.status}`"
            :title="`${task.content} · ${task.status}`"
            @click.stop="$emit('openBlock', task.id)"
          >
            <span class="calendar-view__task-dot" />
            <span class="calendar-view__task-text">{{ task.content }}</span>
          </article>

          <!-- 溢出 +N 按钮 -->
          <button
            v-if="cell.overflowCount > 0"
            class="calendar-view__more-badge"
            @click.stop="openPopover(cell)"
          >
            +{{ cell.overflowCount }}
          </button>
        </div>
      </div>
    </div>

    <!-- 悬浮弹窗 (+N 详情) -->
    <div
      v-if="activePopoverCell"
      class="calendar-view__popover-mask"
      @click="activePopoverCell = null"
    >
      <div
        class="calendar-view__popover"
        @click.stop
      >
        <header class="calendar-view__popover-head">
          <strong>{{ activePopoverCell.iso }} 事项明细</strong>
          <button
            class="calendar-view__popover-close"
            @click="activePopoverCell = null"
          >
            ✕
          </button>
        </header>
        <div class="calendar-view__popover-body">
          <article
            v-for="t in getDayTasks(activePopoverCell.iso)"
            :key="t.id"
            class="calendar-view__popover-item"
            :class="`calendar-view__task-card--${t.status}`"
            @click="$emit('openBlock', t.id)"
          >
            <span class="calendar-view__task-dot" />
            <span class="calendar-view__popover-text">{{ t.content }}</span>
            <small v-if="t.docTitle" class="calendar-view__popover-meta">{{ t.docTitle }}</small>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import type { CalendarDayCell } from "@/core/view/calendar"
import { buildMonthCalendarGrid } from "@/core/view/calendar"
import type { CalendarTaskItem, TaskStatus } from "@/core/dashboard/types"
import { formatIsoDate } from "@/core/dashboard/calculator"

const props = defineProps<{
  tasks: CalendarTaskItem[]
  initialMonth?: string
}>()

defineEmits<{
  (e: "openBlock", blockId: string): void
}>()

const todayIso = formatIsoDate(new Date())
const currentMonth = ref(props.initialMonth || todayIso.slice(0, 7))
const currentFilter = ref<"all" | "open" | TaskStatus>("all")
const activePopoverCell = ref<CalendarDayCell | null>(null)

const filterOptions = [
  { key: "all" as const, label: "全部" },
  { key: "open" as const, label: "未完成" },
  { key: "doing" as const, label: "进行中" },
  { key: "done" as const, label: "已完成" },
]

const gridModel = computed(() => {
  return buildMonthCalendarGrid(currentMonth.value, props.tasks, {
    weekStart: 1,
    statusFilter: currentFilter.value,
    maxPerDay: 3,
    todayIso,
  })
})

const allCells = computed(() => {
  return gridModel.value.weeks.flat()
})

function changeMonth(delta: number) {
  const [yearStr, monthStr] = currentMonth.value.split("-")
  let y = Number(yearStr)
  let m = Number(monthStr) + delta
  if (m < 1) {
    y -= 1
    m = 12
  } else if (m > 12) {
    y += 1
    m = 1
  }
  const pad = (n: number) => String(n).padStart(2, "0")
  currentMonth.value = `${y}-${pad(m)}`
}

function goToday() {
  currentMonth.value = todayIso.slice(0, 7)
}

function openPopover(cell: CalendarDayCell) {
  activePopoverCell.value = cell
}

function getDayTasks(iso: string): CalendarTaskItem[] {
  return props.tasks.filter((t) => {
    if (t.date !== iso) return false
    if (currentFilter.value === "all") return true
    if (currentFilter.value === "open") return t.status === "todo" || t.status === "doing"
    return t.status === currentFilter.value
  })
}
</script>

<style scoped>
.calendar-view {
  display: flex;
  flex-direction: column;
  background: var(--b3-theme-background);
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  overflow: hidden;
  font-family: var(--b3-font-family, inherit);
  user-select: none;
}

.calendar-view__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface, rgba(0, 0, 0, 0.02));
  flex-wrap: wrap;
  gap: 8px;
}

.calendar-view__nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.calendar-view__nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--b3-border-color);
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  cursor: pointer;
  font-size: 13px;
}

.calendar-view__nav-btn:hover {
  background: var(--b3-list-hover);
}

.calendar-view__month-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-on-background);
  padding: 0 4px;
}

.calendar-view__today-btn {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--b3-border-color);
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  cursor: pointer;
}

.calendar-view__today-btn:hover {
  background: var(--b3-list-hover);
}

.calendar-view__filters {
  display: flex;
  align-items: center;
  gap: 4px;
}

.calendar-view__filter-chip {
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--b3-theme-on-surface-light);
  font-size: 12px;
  cursor: pointer;
}

.calendar-view__filter-chip--active {
  background: var(--b3-theme-primary);
  color: var(--b3-theme-on-primary, #ffffff);
  font-weight: 500;
}

.calendar-view__stats {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  display: flex;
  align-items: center;
  gap: 6px;
}

.calendar-view__pending-badge {
  color: var(--b3-theme-primary);
  font-weight: 600;
}

.calendar-view__week-head {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface, rgba(0, 0, 0, 0.01));
}

.calendar-view__week-label {
  padding: 8px 0;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--b3-theme-on-surface-light);
}

.calendar-view__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  background: var(--b3-border-color);
  gap: 1px;
}

.calendar-view__cell {
  background: var(--b3-theme-background);
  min-height: 96px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.calendar-view__cell--other-month {
  opacity: 0.45;
}

.calendar-view__cell-head {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 4px;
}

.calendar-view__day-num {
  position: relative;
  display: inline-block;
  min-width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  font-size: 11px;
  color: var(--b3-theme-on-background);
}

.calendar-view__day-num--today {
  border-radius: 50%;
  background: var(--b3-theme-primary);
  color: var(--b3-theme-on-primary, #ffffff);
  font-weight: 600;
}

.calendar-view__day-num--pending::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -2px;
  width: 14px;
  height: 2.5px;
  border-radius: 2px;
  transform: translateX(-50%);
  background-color: var(--b3-theme-primary);
}

.calendar-view__cell-tasks {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

.calendar-view__task-card {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 5px;
  border-radius: 4px;
  background: var(--b3-theme-surface, rgba(128, 128, 128, 0.08));
  font-size: 11px;
  cursor: pointer;
  line-height: 1.4;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.calendar-view__task-card:hover {
  background: var(--b3-list-hover);
}

.calendar-view__task-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #6b7280;
}

.calendar-view__task-card--doing .calendar-view__task-dot {
  background: #eab308;
}

.calendar-view__task-card--done {
  opacity: 0.6;
  text-decoration: line-through;
}

.calendar-view__task-card--done .calendar-view__task-dot {
  background: #22c55e;
}

.calendar-view__task-card--canceled .calendar-view__task-dot {
  background: #9ca3af;
}

.calendar-view__task-card--deferred .calendar-view__task-dot {
  background: #a855f7;
}

.calendar-view__task-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar-view__more-badge {
  align-self: flex-start;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  border: 0;
  background: var(--b3-theme-surface-lighter, rgba(128, 128, 128, 0.16));
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
}

.calendar-view__more-badge:hover {
  background: var(--b3-list-hover);
}

/* 浮窗 */
.calendar-view__popover-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-view__popover {
  width: min(90vw, 360px);
  max-height: 80vh;
  background: var(--b3-theme-background);
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.calendar-view__popover-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--b3-border-color);
  font-size: 13px;
}

.calendar-view__popover-close {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: var(--b3-theme-on-surface-light);
}

.calendar-view__popover-body {
  padding: 8px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.calendar-view__popover-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 4px;
  background: var(--b3-theme-surface, rgba(128, 128, 128, 0.08));
  cursor: pointer;
}

.calendar-view__popover-item:hover {
  background: var(--b3-list-hover);
}

.calendar-view__popover-text {
  flex: 1;
  font-size: 12px;
}

.calendar-view__popover-meta {
  color: var(--b3-theme-on-surface-light);
  font-size: 10px;
}
</style>
