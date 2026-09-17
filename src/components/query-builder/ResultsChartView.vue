<template>
  <div class="chart-view" :style="{ height: height || '320px' }">
    <div
      v-if="!isUnavailable && !isLoading"
      ref="chartEl"
      class="chart-view__container"
    />
    <div
      v-else-if="isLoading"
      class="chart-view__loading"
    >
      <div class="chart-view__spinner" />
      <p class="chart-view__loading-desc">正在载入图表引擎...</p>
    </div>
    <div
      v-else
      class="chart-view__fallback"
    >
      <div class="chart-view__fallback-icon">📊</div>
      <p class="chart-view__fallback-title">{{ option?.title?.text || '图表视图' }}</p>
      <p class="chart-view__fallback-desc">
        思源环境中通过 window.echarts 渲染交互图表；当前环境暂未检测到 ECharts 引擎。
      </p>
      <button
        class="chart-view__retry-btn"
        type="button"
        @click="retryInit"
      >
        重试加载
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { getEChartsInstance } from "@/core/view/chart"
import { useSiyuanTheme } from "@/ui/theme"

const props = defineProps<{
  option: Record<string, any>
  height?: string
}>()

const emit = defineEmits<{
  (e: "clickItem", params: any): void
}>()

const { currentTheme } = useSiyuanTheme()
const chartEl = ref<HTMLDivElement | null>(null)
const isUnavailable = ref(false)
const isLoading = ref(true)
let chartInstance: any = null
let resizeObserver: ResizeObserver | null = null
let isDisposed = false

async function initChart(forceReload = false) {
  if (isDisposed) return

  isLoading.value = true
  const echarts = await getEChartsInstance(forceReload)
  if (isDisposed) return

  if (!echarts) {
    isLoading.value = false
    isUnavailable.value = true
    return
  }

  isUnavailable.value = false
  isLoading.value = false
  await nextTick()
  if (isDisposed || !chartEl.value) return

  try {
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
    chartInstance = echarts.init(chartEl.value)
    chartInstance.setOption(props.option || {})
    chartInstance.on("click", (params: any) => {
      emit("clickItem", params)
    })

    if (typeof ResizeObserver !== "undefined" && !resizeObserver) {
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

function retryInit() {
  initChart(true)
}

watch(
  () => props.option,
  (newOpt) => {
    if (chartInstance && newOpt) {
      chartInstance.setOption(newOpt, true)
    } else if (!chartInstance && newOpt && !isUnavailable.value && !isLoading.value) {
      initChart()
    }
  },
  { deep: true },
)

watch(currentTheme, async () => {
  if (chartInstance && props.option) {
    chartInstance.dispose()
    chartInstance = null
    await initChart(false)
  }
})

onMounted(async () => {
  await nextTick()
  await initChart()
})

onBeforeUnmount(() => {
  isDisposed = true
  resizeObserver?.disconnect()
  resizeObserver = null
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.chart-view {
  width: 100%;
  min-height: 240px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  border-radius: 12px;
  box-shadow: var(--sqb-shadow-soft);
  backdrop-filter: blur(16px);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.chart-view__container {
  width: 100%;
  height: 100%;
}

.chart-view__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  text-align: center;
  color: var(--b3-theme-on-surface-light);
}

.chart-view__spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid var(--b3-border-color);
  border-top-color: var(--b3-theme-primary);
  border-radius: 50%;
  animation: sqb-chart-spin 0.8s linear infinite;
  margin-bottom: 10px;
}

@keyframes sqb-chart-spin {
  to {
    transform: rotate(360deg);
  }
}

.chart-view__loading-desc {
  font-size: 12px;
  margin: 0;
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

.chart-view__retry-btn {
  margin-top: 12px;
  padding: 5px 14px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface, #ffffff);
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: all 0.15s ease;
}

.chart-view__retry-btn:hover {
  background: var(--b3-theme-primary);
  color: var(--b3-theme-on-primary, #ffffff);
  border-color: var(--b3-theme-primary);
}
</style>
