<template>
  <section class="results">
    <article
      class="card"
      :class="{ 'card--collapsed': resultsCollapsed }"
      data-results-preview-card
    >
      <div
        class="section-head"
        :class="{ 'section-head--collapsed': resultsCollapsed }"
      >
        <div class="summary">
          <div class="summary__header">
            <div class="summary__icon" aria-hidden="true">
              <Database
                class="sqb-wireframe-icon"
                style="fill: none !important;"
                :size="18"
                :stroke-width="1.75"
              />
            </div>
            <div>
              <h3>查询结果预览</h3>
              <p class="muted">
                {{ store.resultSet?.rows.length ? store.resultSummary : "等待运行查询" }}
              </p>
            </div>
          </div>
        </div>
        <div class="section-head-actions">
          <div class="view-switcher">
            <div class="tabs">
              <button
                class="tabs__item"
                :class="{ 'tabs__item--active': store.draft.view.type === 'table' }"
                data-view-type="table"
                type="button"
                @click="selectResultViewType('table')"
              >
                <Table
                  class="tabs__icon sqb-wireframe-icon"
                  style="fill: none !important;"
                  :size="14"
                  :stroke-width="1.75"
                />
                表格
              </button>
              <button
                class="tabs__item"
                :class="{ 'tabs__item--active': store.draft.view.type === 'board' }"
                data-view-type="board"
                type="button"
                @click="selectResultViewType('board')"
              >
                <Kanban
                  class="tabs__icon sqb-wireframe-icon"
                  style="fill: none !important;"
                  :size="14"
                  :stroke-width="1.75"
                />
                看板
              </button>
              <button
                class="tabs__item"
                :class="{ 'tabs__item--active': store.draft.view.type === 'list' }"
                data-view-type="list"
                type="button"
                @click="selectResultViewType('list')"
              >
                <List
                  class="tabs__icon sqb-wireframe-icon"
                  style="fill: none !important;"
                  :size="14"
                  :stroke-width="1.75"
                />
                列表
              </button>
              <button
                class="tabs__item"
                :class="{ 'tabs__item--active': store.draft.view.type === 'cards' }"
                data-view-type="cards"
                type="button"
                @click="selectResultViewType('cards')"
              >
                <LayoutGrid
                  class="tabs__icon sqb-wireframe-icon"
                  style="fill: none !important;"
                  :size="14"
                  :stroke-width="1.75"
                />
                卡片
              </button>
              <button
                class="tabs__item"
                :class="{ 'tabs__item--active': store.draft.view.type === 'calendar' }"
                data-view-type="calendar"
                type="button"
                @click="selectResultViewType('calendar')"
              >
                <Calendar
                  class="tabs__icon sqb-wireframe-icon"
                  style="fill: none !important;"
                  :size="14"
                  :stroke-width="1.75"
                />
                月历
              </button>
              <button
                class="tabs__item"
                :class="{ 'tabs__item--active': store.draft.view.type === 'chart' }"
                data-view-type="chart"
                type="button"
                @click="selectResultViewType('chart')"
              >
                <BarChart3
                  class="tabs__icon sqb-wireframe-icon"
                  style="fill: none !important;"
                  :size="14"
                  :stroke-width="1.75"
                />
                图表
              </button>
            </div>
          </div>
          <button
            v-sqb-tooltip="resultsCollapsed ? '展开查询结果预览' : '收起查询结果预览'"
            class="section-toggle"
            data-results-preview-toggle
            type="button"
            :aria-label="resultsCollapsed ? '展开查询结果预览' : '收起查询结果预览'"
            :aria-expanded="String(!resultsCollapsed)"
            @click="resultsCollapsed = !resultsCollapsed"
          >
            <ChevronDown
              class="sqb-wireframe-icon"
              style="fill: none !important;"
              :class="{ 'is-expanded': !resultsCollapsed }"
              :size="15"
              :stroke-width="1.75"
            />
          </button>
        </div>
      </div>

      <div
        v-if="!resultsCollapsed"
        class="results__body"
        data-results-preview-body
      >
        <div
          v-if="store.error"
          class="alert"
        >
          {{ store.error }}
        </div>

        <ResultsSavedViewsPanel
          :active-view-id="store.draft.view.id"
          :views="store.savedViews || []"
          @delete="store.deleteSavedView"
          @load="store.loadSavedView"
          @save-as="store.saveViewAs"
          @set-default="store.setDefaultSavedView"
        />

        <div
          v-if="store.draft.view.type === 'board' && store.boardDragCapability && !store.boardDragCapability.enabled && store.boardDragCapability.reason"
          class="alert alert--warning"
        >
          {{ store.boardDragCapability.reason }}
        </div>

        <ResultsSqlPreview
          :advanced-mode="store.advancedMode"
          :advanced-sql="store.advancedSql"
          :has-advanced-sql="hasAdvancedSql"
          @copy="copyAdvancedSql"
          @toggle="store.advancedMode = !store.advancedMode"
        />

        <div
          v-if="!hasResultRows"
          class="empty"
          data-results-empty
        >
          <Inbox
            class="empty__icon sqb-wireframe-icon"
            style="fill: none !important;"
            :size="38"
            :stroke-width="1.5"
          />
          <h4>结果会在这里出现</h4>
          <p>运行查询后，可切换表格、看板、列表或统计视图，并继续编辑状态、日期和优先级。</p>
        </div>

        <ResultsTableView
          v-else-if="store.draft.view.type === 'table'"
          :result-fields="store.resultFields"
          :rows="store.resultSet.rows"
          :field-label="store.fieldLabel"
          :can-open-row="store.canOpenRow"
          :display-value="store.displayValue"
          :editable-field="store.editableField"
          :quick-edit="store.quickEdit"
          :open-block="store.openBlock"
        />

        <ResultsBoardView
          v-else-if="store.draft.view.type === 'board'"
          :board-columns="store.boardColumns"
          :field-mappings="store.draft.view.fieldMappings"
          :display-value="store.displayValue"
          :open-block="store.openBlock"
          :set-dragging-row-id="value => store.draggingRowId = value"
          :drop-to-column="store.dropToColumn"
        />

        <ResultsListView
          v-else-if="store.draft.view.type === 'list'"
          :items="store.listItems"
          :open-block="store.openBlock"
        />

        <ResultsCalendarView
          v-else-if="store.draft.view.type === 'calendar'"
          :tasks="calendarTasks"
          @open-block="store.openBlock"
        />

        <ResultsChartView
          v-else-if="store.draft.view.type === 'chart'"
          :option="defaultChartOption"
        />

        <ResultsCardsView
          v-else
          :cards="store.cardsSummary"
        />
      </div>
    </article>

    <ResultsEmbedPanel
      v-model="store.embedParentId"
      :current-document-target="store.currentDocumentTarget"
      :hint="store.embedTargetHint"
      :open-document-targets="store.openDocumentTargets"
      :recent-targets="store.recentEmbedTargets"
      @insert="store.insertEmbed"
      @refresh="store.refreshCurrentDocumentTarget"
      @select-current="store.selectCurrentDocumentTarget"
      @select-target="store.selectEmbedTarget"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { BarChart3, Calendar, ChevronDown, Database, Inbox, Kanban, LayoutGrid, List, Table } from "lucide-vue-next"

import ResultsBoardView from "@/components/query-builder/ResultsBoardView.vue"
import ResultsCalendarView from "@/components/query-builder/ResultsCalendarView.vue"
import ResultsCardsView from "@/components/query-builder/ResultsCardsView.vue"
import ResultsChartView from "@/components/query-builder/ResultsChartView.vue"
import ResultsEmbedPanel from "@/components/query-builder/ResultsEmbedPanel.vue"
import ResultsListView from "@/components/query-builder/ResultsListView.vue"
import ResultsSavedViewsPanel from "@/components/query-builder/ResultsSavedViewsPanel.vue"
import ResultsSqlPreview from "@/components/query-builder/ResultsSqlPreview.vue"
import ResultsTableView from "@/components/query-builder/ResultsTableView.vue"
import { useQueryBuilderStore } from "@/composables/query-builder-store"
import type { CalendarTaskItem } from "@/core/dashboard/types"
import type { ViewType } from "@/core/query/types"
import { buildCalendarTaskItems, buildGroupDistributionChartOption } from "@/core/view/result-view-model"
import { showMessage } from "@/external/siyuan"
import { vSqbTooltip } from "@/ui/tooltip"
import { writeClipboardText } from "@/utils/clipboard"

const store = useQueryBuilderStore()

const hasAdvancedSql = computed(() => Boolean(store.advancedSql?.trim()))
const hasResultRows = computed(() => Boolean(store.resultSet?.rows.length))
const resultsCollapsed = ref(false)

const calendarTasks = computed<CalendarTaskItem[]>(() => {
  return buildCalendarTaskItems(store.resultSet?.rows)
})

const defaultChartOption = computed(() => {
  return buildGroupDistributionChartOption({
    title: store.draft.template.name || "",
    summary: store.cardsSummary,
    totalRows: store.resultSet?.rows.length || 0,
  })
})

async function copyAdvancedSql() {
  if (!hasAdvancedSql.value) {
    return
  }

  try {
    await writeClipboardText(store.advancedSql)
  } catch (error) {
    console.error("[siyuan-query-builder] failed to copy SQL preview", error)
    showMessage(store.t("copySqlFailed"), 3500, "error")
  }
}

async function selectResultViewType(type: ViewType) {
  const matchingSavedView = store.savedViews?.find(view => view.type === type)
  if (matchingSavedView) {
    await store.loadSavedView(matchingSavedView.id)
    return
  }

  store.setViewType(type)
}
</script>

<style lang="scss" scoped>
.results {
  display: grid;
  gap: 16px;
}

.card {
  min-height: 480px;
  padding: 16px;
  border-radius: 12px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  box-shadow: var(--sqb-shadow-soft);
  backdrop-filter: blur(16px);
}

.card--collapsed {
  min-height: 0;
}

.section-head,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.section-head {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--sqb-border);
}

.section-head--collapsed {
  padding-bottom: 0;
  border-bottom: none;
}

.section-head-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.summary {
  min-width: 0;
}

.view-switcher {
  display: flex;
  align-items: center;
}

.results__body {
  display: grid;
  gap: 0;
}

.summary__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--sqb-primary-soft);
  color: var(--sqb-primary);
}

.summary__icon svg {
  width: 18px;
  height: 18px;
}

h3,
h4 {
  margin: 0;
}

h3 {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
}

.muted {
  margin: 0;
  color: var(--sqb-text-muted);
  font: 12px/1.4 var(--sqb-sans);
}

.control {
  width: 100%;
  box-sizing: border-box;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--sqb-border);
  background-color: var(--sqb-surface-strong);
  color: var(--sqb-text);
  padding: 0 10px;
  font: 13px/1.4 var(--sqb-sans);
  transition: border-color 140ms ease, box-shadow 140ms ease;

  &:focus {
    outline: none;
    border-color: var(--sqb-primary);
    box-shadow: 0 0 0 2px var(--sqb-primary-soft);
  }
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 3px;
  border-radius: 8px;
  background: var(--sqb-bg-strong);
  border: 1px solid var(--sqb-border);
}

.tabs__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 120ms ease;
  border: none;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 6px;
  background: transparent;
  color: var(--sqb-text-muted);
  font: 600 12px/1.2 var(--sqb-sans);

  &:hover {
    background: var(--sqb-surface);
    color: var(--sqb-text);
  }
}

.tabs__icon {
  flex: 0 0 auto;
}

.tabs__item--active {
  background: var(--sqb-surface-strong);
  color: var(--sqb-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid var(--sqb-border);
  border-radius: 6px;
  background: var(--sqb-surface);
  color: var(--sqb-text-muted);
  cursor: pointer;
  transition: all 120ms ease;

  &:hover {
    background: var(--sqb-bg-strong);
    color: var(--sqb-primary);
  }
}

.section-toggle svg {
  transition: transform 140ms ease;
}

.section-toggle svg.is-expanded {
  transform: rotate(180deg);
}

.alert {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--sqb-danger-soft);
  color: var(--sqb-danger);
  font: 12px/1.4 var(--sqb-sans);

  &--warning {
    background: var(--sqb-accent-soft);
    color: var(--sqb-accent);
  }
}

.empty {
  min-height: 220px;
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  border-radius: 10px;
  border: 1px dashed var(--sqb-border-strong);
  background: var(--sqb-surface-soft);
}

.empty__icon {
  color: var(--sqb-text-muted);
  opacity: 0.6;
}

.empty h4 {
  font-size: 13px;
  color: var(--sqb-text);
  font-weight: 600;
}

.empty p {
  margin: 0;
  color: var(--sqb-text-muted);
  font: 12px/1.4 var(--sqb-sans);
  max-width: 320px;
}

.sqb-wireframe-icon,
:deep(svg) {
  fill: none !important;
}

.sqb-wireframe-icon *,
:deep(svg *) {
  fill: none !important;
  stroke: currentColor;
}

@media (max-width: 720px) {
  .section-head,
  .section-head-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .view-switcher {
    width: 100%;
  }

  .section-toggle {
    align-self: flex-end;
  }
}
</style>
