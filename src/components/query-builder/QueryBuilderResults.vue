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
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm2 2v8h12V8H6zm3 2h6v4H9v-4z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <h3>查询结果预览</h3>
              <p class="muted">
                {{ store.resultSet?.rows.length ? store.resultSummary : "实时查看匹配结果并快速编辑" }}
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
                表格
              </button>
              <button
                class="tabs__item"
                :class="{ 'tabs__item--active': store.draft.view.type === 'board' }"
                data-view-type="board"
                type="button"
                @click="selectResultViewType('board')"
              >
                看板
              </button>
              <button
                class="tabs__item"
                :class="{ 'tabs__item--active': store.draft.view.type === 'list' }"
                data-view-type="list"
                type="button"
                @click="selectResultViewType('list')"
              >
                列表
              </button>
              <button
                class="tabs__item"
                :class="{ 'tabs__item--active': store.draft.view.type === 'cards' }"
                data-view-type="cards"
                type="button"
                @click="selectResultViewType('cards')"
              >
                卡片
              </button>
            </div>
          </div>
          <button
            class="section-toggle"
            data-results-preview-toggle
            type="button"
            :title="resultsCollapsed ? '展开查询结果预览' : '收起查询结果预览'"
            :aria-label="resultsCollapsed ? '展开查询结果预览' : '收起查询结果预览'"
            :aria-expanded="String(!resultsCollapsed)"
            @click="resultsCollapsed = !resultsCollapsed"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              :class="{ 'is-expanded': !resultsCollapsed }"
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
          <div class="empty__icon" />
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

import ResultsBoardView from "@/components/query-builder/ResultsBoardView.vue"
import ResultsCardsView from "@/components/query-builder/ResultsCardsView.vue"
import ResultsEmbedPanel from "@/components/query-builder/ResultsEmbedPanel.vue"
import ResultsListView from "@/components/query-builder/ResultsListView.vue"
import ResultsSavedViewsPanel from "@/components/query-builder/ResultsSavedViewsPanel.vue"
import ResultsSqlPreview from "@/components/query-builder/ResultsSqlPreview.vue"
import ResultsTableView from "@/components/query-builder/ResultsTableView.vue"
import { useQueryBuilderStore } from "@/composables/query-builder-store"
import { showMessage } from "@/external/siyuan"

const store = useQueryBuilderStore()

const hasAdvancedSql = computed(() => Boolean(store.advancedSql?.trim()))
const hasResultRows = computed(() => Boolean(store.resultSet?.rows.length))
const resultsCollapsed = ref(false)

async function writeClipboardText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "true")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()

  const copied = document.execCommand?.("copy")
  document.body.removeChild(textarea)

  if (!copied) {
    throw new Error("clipboard unavailable")
  }
}

async function copyAdvancedSql() {
  if (!hasAdvancedSql.value) {
    return
  }

  try {
    await writeClipboardText(store.advancedSql)
    showMessage("已复制 SQL", 2500, "info")
  } catch (error) {
    console.error("[siyuan-query-builder] failed to copy SQL preview", error)
    showMessage("复制 SQL 失败", 3500, "error")
  }
}

async function selectResultViewType(type: "table" | "board" | "list" | "cards") {
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
  gap: 20px;
}

.card {
  min-height: 560px;
  padding: 20px;
  border-radius: 20px;
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
  gap: 18px;
}

.section-head {
  padding-bottom: 16px;
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
  gap: 12px;
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
  gap: 14px;
}

.summary__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--sqb-primary-soft);
  color: var(--sqb-primary);
}

.summary__icon svg {
  width: 20px;
  height: 20px;
}

h3,
h4 {
  margin: 0;
}

h3 {
  font-size: 18px;
  line-height: 1.2;
  font-family: var(--sqb-serif);
}

.muted {
  margin: 0;
  color: var(--sqb-text-muted);
  font: 13px/1.55 var(--sqb-sans);
}

.control {
  width: 100%;
  box-sizing: border-box;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
  color: var(--sqb-text);
  padding: 0 10px;
  font: 13px/1.4 var(--sqb-sans);
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.control::placeholder {
  color: var(--sqb-text-muted);
  opacity: 0.6;
}

.control:hover {
  border-color: var(--sqb-border-strong);
}

.control:focus {
  outline: none;
  border-color: var(--sqb-primary);
  box-shadow: 0 0 0 3px var(--sqb-primary-soft);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  transition: background 80ms ease, border-color 80ms ease, color 80ms ease;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0 12px;
  background: transparent;
  cursor: pointer;
  font: 600 13px/1.2 var(--sqb-sans);
}

.tabs__item:hover {
  background: var(--sqb-bg-strong);
}

.btn--ghost {
  background: transparent;
  color: var(--sqb-text-muted);
  border-color: var(--sqb-border-strong);
}

.btn--ghost:hover {
  background: var(--sqb-bg-strong);
  color: var(--sqb-text);
}

.saved-views {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-soft);
}

.saved-views__head,
.saved-views__actions,
.saved-views__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.saved-views__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

.saved-views__item {
  display: grid;
  gap: 10px;
  min-height: 100px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface);
}

.saved-views__item--active {
  border-color: var(--sqb-primary);
  background: var(--sqb-primary-soft);
}

.saved-views__main {
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
  color: inherit;
  justify-content: flex-start;
  align-items: flex-start;
  min-height: 42px;
}

.saved-views__delete {
  margin-right: -2px;
}

.saved-views__actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 8px;
}

.saved-views__actions .btn {
  width: 100%;
  height: 32px;
  padding: 0 12px;
  justify-content: center;
}

.saved-views__badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--sqb-primary-soft);
  color: var(--sqb-primary-strong);
  font: 700 12px/1.2 var(--sqb-sans);
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
  background: var(--sqb-bg-strong);
  border: 1px solid var(--sqb-border);
}

.tabs__item {
  transition: background 80ms ease, color 80ms ease;
  border: none;
  cursor: pointer;
  padding: 5px 14px;
  border-radius: 8px;
  background: transparent;
  color: var(--sqb-text-muted);
  font: 600 13px/1.2 var(--sqb-sans);
}

.tabs__item--active {
  background: var(--sqb-surface-strong);
  color: var(--sqb-primary-strong);
  box-shadow: 0 1px 4px rgba(57, 61, 52, 0.08);
}

.btn__icon {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.alert {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--sqb-danger-soft);
  color: var(--sqb-danger);
  font: 13px/1.45 var(--sqb-sans);
}

:deep(.advanced-panel) {
  margin-top: 14px;
  border-radius: 16px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-soft);
  overflow: hidden;
}

:deep(.advanced-panel__head) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
}

:deep(.advanced-panel__copy) {
  display: grid;
  gap: 3px;
}

:deep(.advanced-panel__eyebrow) {
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--sqb-primary);
  font: 700 11px/1.2 var(--sqb-sans);
}

:deep(.advanced-panel__copy strong) {
  font: 700 15px/1.25 var(--sqb-sans);
  color: var(--sqb-text);
}

:deep(.advanced-panel__copy span:last-child) {
  color: var(--sqb-text-muted);
  font: 13px/1.45 var(--sqb-sans);
}

:deep(.section-toggle) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--sqb-border);
  border-radius: 8px;
  background: var(--sqb-surface);
  color: var(--sqb-text-muted);
  cursor: pointer;
}

:deep(.section-toggle:hover) {
  background: var(--sqb-bg-strong);
}

:deep(.section-toggle svg) {
  width: 16px;
  height: 16px;
  transition: transform 140ms ease;
}

:deep(.section-toggle svg.is-expanded) {
  transform: rotate(180deg);
}

:deep(.sql-box) {
  padding: 0 18px 18px;
}

:deep(.sql-box__surface) {
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid var(--sqb-border-strong);
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0) 42%),
    var(--sqb-bg-strong);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

:deep(.sql-box__toolbar) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--sqb-border);
  background: rgba(255, 255, 255, 0.22);
}

:deep(.sql-box__actions) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

:deep(.sql-box__language) {
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--sqb-text-muted);
  font: 700 11px/1.2 var(--sqb-mono);
}

:deep(.sql-box__collapse) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--sqb-text-muted);
  cursor: pointer;
  font: 600 12px/1 var(--sqb-sans);
  transition: background 80ms ease, border-color 80ms ease, color 80ms ease;
}

:deep(.sql-box__collapse:hover) {
  border-color: var(--sqb-border);
  background: var(--sqb-surface);
  color: var(--sqb-text);
}

:deep(.sql-box__collapse:focus-visible) {
  outline: 2px solid var(--sqb-primary);
  outline-offset: 2px;
}

:deep(.sql-box__copy) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--sqb-text-muted);
  cursor: pointer;
  transition: background 80ms ease, border-color 80ms ease, color 80ms ease, opacity 80ms ease;
}

:deep(.sql-box__copy:hover:not(:disabled)) {
  border-color: var(--sqb-border);
  background: var(--sqb-surface);
  color: var(--sqb-text);
}

:deep(.sql-box__copy:focus-visible) {
  outline: 2px solid var(--sqb-primary);
  outline-offset: 2px;
}

:deep(.sql-box__copy:disabled) {
  cursor: default;
  opacity: 0.4;
}

:deep(.sql-box__copy svg) {
  width: 16px;
  height: 16px;
}

:deep(.sql-box__code) {
  margin: 0;
  padding: 14px 16px 16px;
  color: var(--sqb-text);
  white-space: pre-wrap;
  word-break: break-word;
  font: 12px/1.55 var(--sqb-mono);
}

:deep(.sql-box__code code) {
  font: inherit;
}

.empty {
  min-height: 280px;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  border-radius: 16px;
  border: 1px dashed var(--sqb-border-strong);
  background: var(--sqb-surface-soft);
}

.empty__icon {
  position: relative;
  width: 48px;
  height: 48px;
}

.empty__icon::before,
.empty__icon::after {
  content: '';
  position: absolute;
}

.empty__icon::before {
  inset: 4px 8px 8px 4px;
  border: 3px solid var(--sqb-border-strong);
  border-radius: 50%;
}

.empty__icon::after {
  right: 4px;
  bottom: 2px;
  width: 16px;
  height: 3px;
  border-radius: 999px;
  background: var(--sqb-border-strong);
  transform: rotate(48deg);
  transform-origin: center;
}

.empty h4 {
  font-size: 15px;
  color: var(--sqb-text-muted);
}

.empty p {
  margin: 0;
  color: var(--sqb-text-muted);
  font: 13px/1.5 var(--sqb-sans);
  max-width: 420px;
}

:deep(.table-wrap) {
  margin-top: 12px;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
}

:deep(.table) {
  width: 100%;
  border-collapse: collapse;
}

:deep(.table th),
:deep(.table td) {
  padding: 10px 12px;
  border-bottom: 1px solid var(--sqb-border);
  text-align: left;
  vertical-align: top;
  font: 13px/1.45 var(--sqb-sans);
}

:deep(.table th) {
  position: sticky;
  top: 0;
  background: var(--sqb-bg-strong);
  color: var(--sqb-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font: 600 11px/1.3 var(--sqb-sans);
}

:deep(.link) {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--sqb-primary-strong);
  cursor: pointer;
  text-align: left;
  font: 600 13px/1.45 var(--sqb-sans);
}

:deep(.link--block) {
  display: block;
  margin-bottom: 10px;
}

:deep(.board) {
  margin-top: 14px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(260px, 1fr);
  gap: 16px;
  overflow-x: auto;
}

:deep(.board__column) {
  min-height: 280px;
  padding: 14px;
  border-radius: 16px;
  background: var(--sqb-surface-soft);
  border: 1px solid var(--sqb-border);
}

:deep(.board__head) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

:deep(.board__card) {
  margin-bottom: 8px;
  padding: 12px;
  border-radius: 12px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  cursor: grab;
}

:deep(.tokens) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.tokens span),
:deep(.board__count) {
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--sqb-accent-soft);
  color: var(--sqb-accent);
  font: 600 12px/1.2 var(--sqb-sans);
}

:deep(.list) {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

:deep(.list__item),
:deep(.cards__item) {
  padding: 12px;
  border-radius: 12px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
}

:deep(.list__meta),
:deep(.cards__item span) {
  color: var(--sqb-text-muted);
  font: 13px/1.4 var(--sqb-sans);
}

:deep(.list__main) {
  display: grid;
  gap: 8px;
}

:deep(.list__meta) {
  display: block;
  margin: 0;
  padding-left: 1px;
}

:deep(.cards) {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

:deep(.cards__item strong) {
  display: block;
  margin-bottom: 4px;
  font: 700 22px/1.1 var(--sqb-serif);
  color: var(--sqb-primary-strong);
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

  .tabs__item {
    flex: 1 1 calc(50% - 6px);
  }
}
</style>
