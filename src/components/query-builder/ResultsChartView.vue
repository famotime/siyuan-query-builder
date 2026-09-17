<template>
  <div class="chart-view" :style="{ height: height || '320px' }">
    <div
      v-if="!isUnavailable"
      ref="chartEl"
      class="chart-view__container"
    />
    <div
      v-else
      class="chart-view__fallback"
    >
      <div class="chart-view__fallback-icon">📊</div>
      <p class="chart-view__fallback-title">{{ option?.title?.text || '图表视图' }}</p>
      <p class="chart-view__fallback-desc">
        思源环境中通过 window.echarts 渲染交互图表；当前环境暂未检测到 ECharts 引擎。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { getEChartsInstance } from "@/core/view/chart"

const props = defineProps<{
  option: Record<string, any>
  height?: string
}>()

const emit = defineEmits<{
  (e: "clickItem", params: any): void
}>()

const chartEl = ref<HTMLDivElement | null>(null)
const isUnavailable = ref(false)
let chartInstance: any = null
let resizeObserver: ResizeObserver | null = null

async function initChart() {
  if (!chartEl.value) return
  const echarts = await getEChartsInstance()
  if (!echarts) {
    isUnavailable.value = true
    return
  }

  isUnavailable.value = false
  try {
    chartInstance = echarts.init(chartEl.value)
    chartInstance.setOption(props.option || {})
    chartInstance.on("click", (params: any) => {
      emit("clickItem", params)
    })

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        chartInstance?.resize()
      })
      resizeObserver.observe(chartEl.value)
    }
  } catch (e) {
    console.warn("[SQB] Failed to initialize ECharts:", e)
    isUnavailable.value = true
  }
}

watch(
  () => props.option,
  (newOpt) => {
    if (chartInstance && newOpt) {
      chartInstance.setOption(newOpt, true)
    }
  },
  { deep: true },
)

onMounted(async () => {
  await nextTick()
  await initChart()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.chart-view {
  width: 100%;
  min-height: 240px;
  background: var(--b3-theme-background);
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.chart-view__container {
  width: 100%;
  height: 100%;
}

.chart-view__fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  text-align: center;
  color: var(--b3-theme-on-surface-light);
}

.chart-view__fallback-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.chart-view__fallback-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-on-background);
  margin: 0 0 6px 0;
}

.chart-view__fallback-desc {
  font-size: 12px;
  max-width: 320px;
  margin: 0;
  line-height: 1.5;
}
</style>
