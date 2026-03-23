<template>
  <section class="results">
    <article class="card">
      <div class="section-head">
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
        <div class="view-switcher">
          <div class="tabs">
            <button
              class="tabs__item"
              :class="{ 'tabs__item--active': store.draft.view.type === 'table' }"
              data-view-type="table"
              type="button"
              @click="store.setViewType('table')"
            >
              表格
            </button>
            <button
              class="tabs__item"
              :class="{ 'tabs__item--active': store.draft.view.type === 'board' }"
              data-view-type="board"
              type="button"
              @click="store.setViewType('board')"
            >
              看板
            </button>
            <button
              class="tabs__item"
              :class="{ 'tabs__item--active': store.draft.view.type === 'list' }"
              data-view-type="list"
              type="button"
              @click="store.setViewType('list')"
            >
              列表
            </button>
            <button
              class="tabs__item"
              :class="{ 'tabs__item--active': store.draft.view.type === 'cards' }"
              data-view-type="cards"
              type="button"
              @click="store.setViewType('cards')"
            >
              卡片
            </button>
          </div>
        </div>
      </div>

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
            :title="store.advancedMode ? '收起 SQL 预览' : '展开 SQL 预览'"
            :aria-label="store.advancedMode ? '收起 SQL 预览' : '展开 SQL 预览'"
            :aria-expanded="String(store.advancedMode)"
            @click="store.advancedMode = !store.advancedMode"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              :class="{ 'is-expanded': store.advancedMode }"
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
          v-if="store.advancedMode"
          class="sql-box"
          data-sql-preview
        >
          <div class="sql-box__surface">
            <div class="sql-box__toolbar">
              <span class="sql-box__language">SQL</span>
              <button
                class="sql-box__copy"
                data-sql-copy
                type="button"
                title="复制 SQL"
                aria-label="复制 SQL"
                :disabled="!hasAdvancedSql"
                @click="copyAdvancedSql"
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
            <pre class="sql-box__code"><code>{{ store.advancedSql || "运行查询后会显示生成后的 SQL 表达。" }}</code></pre>
          </div>
        </div>
      </section>

      <div
        v-if="!store.resultSet?.rows.length"
        class="empty"
        data-results-empty
      >
        <div class="empty__icon" />
        <h4>结果会在这里出现</h4>
        <p>运行查询后，可切换表格、看板、列表或统计视图，并继续编辑状态、日期和优先级。</p>
      </div>

      <div
        v-else-if="store.draft.view.type === 'table'"
        class="table-wrap"
      >
        <table class="table">
          <thead>
            <tr>
              <th
                v-for="field in store.resultFields"
                :key="field"
              >
                {{ store.fieldLabel(field) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in store.resultSet.rows"
              :key="row.id"
            >
              <td
                v-for="field in store.resultFields"
                :key="`${row.id}-${field}`"
              >
                <button
                  v-if="field === 'content' && store.canOpenRow(row)"
                  class="link"
                  @click="store.openBlock(row.id)"
                >
                  {{ store.displayValue(row, field) || "打开原始块" }}
                </button>
                <span v-else-if="field === 'content'">{{ store.displayValue(row, field) || "—" }}</span>
                <select
                  v-else-if="store.editableField(field) === 'status'"
                  class="control control--compact"
                  :value="store.displayValue(row, field)"
                  @change="store.quickEdit(row.id, 'status', ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">
                    未设置
                  </option>
                  <option value="Todo">
                    Todo
                  </option>
                  <option value="Doing">
                    Doing
                  </option>
                  <option value="Done">
                    Done
                  </option>
                </select>
                <select
                  v-else-if="store.editableField(field) === 'priority'"
                  class="control control--compact"
                  :value="store.displayValue(row, field)"
                  @change="store.quickEdit(row.id, 'priority', ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">
                    未设置
                  </option>
                  <option value="P0">
                    P0
                  </option>
                  <option value="P1">
                    P1
                  </option>
                  <option value="P2">
                    P2
                  </option>
                  <option value="P3">
                    P3
                  </option>
                </select>
                <input
                  v-else-if="store.editableField(field) === 'dueDate'"
                  class="control control--compact"
                  type="date"
                  :value="store.displayValue(row, field)"
                  @change="store.quickEdit(row.id, 'dueDate', ($event.target as HTMLInputElement).value)"
                >
                <span v-else>{{ store.displayValue(row, field) || "—" }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-else-if="store.draft.view.type === 'board'"
        class="board"
      >
        <section
          v-for="column in store.boardColumns"
          :key="column.id"
          class="board__column"
          @dragover.prevent
          @drop="store.dropToColumn(column.id)"
        >
          <header class="board__head">
            <h4>{{ column.title }}</h4>
            <span class="pill">{{ column.rows.length }}</span>
          </header>
          <article
            v-for="row in column.rows"
            :key="row.id"
            class="board__card"
            draggable="true"
            @dragstart="store.draggingRowId = row.id"
          >
            <button
              class="link link--block"
              @click="store.openBlock(row.id)"
            >
              {{ row.content || "未命名块" }}
            </button>
            <p class="muted">
              {{ store.displayValue(row, `attr:${store.draft.view.fieldMappings.project}`) || "未绑定项目" }}
            </p>
            <div class="tokens">
              <span>{{ store.displayValue(row, `attr:${store.draft.view.fieldMappings.priority}`) || "无优先级" }}</span>
              <span>{{ store.displayValue(row, `attr:${store.draft.view.fieldMappings.dueDate}`) || "无日期" }}</span>
            </div>
          </article>
        </section>
      </div>

      <ul
        v-else-if="store.draft.view.type === 'list'"
        class="list"
      >
        <li
          v-for="item in store.listItems"
          :key="item.id"
          class="list__item"
        >
          <button
            class="link"
            @click="store.openBlock(item.id)"
          >
            {{ item.title || "未命名块" }}
          </button>
          <small>{{ item.meta.join(" · ") || "无附加信息" }}</small>
        </li>
      </ul>

      <div
        v-else
        class="cards"
      >
        <article
          v-for="card in store.cardsSummary"
          :key="card.label"
          class="cards__item"
        >
          <strong>{{ card.value }}</strong>
          <span>{{ card.label }}</span>
        </article>
      </div>

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
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue"

import ResultsEmbedPanel from "@/components/query-builder/ResultsEmbedPanel.vue"
import ResultsSavedViewsPanel from "@/components/query-builder/ResultsSavedViewsPanel.vue"
import { useQueryBuilderStore } from "@/composables/query-builder-store"
import { showMessage } from "@/external/siyuan"

const store = useQueryBuilderStore()

const hasAdvancedSql = computed(() => Boolean(store.advancedSql?.trim()))

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
</script>

<style lang="scss" scoped>
.results {
  margin-top: 0;
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

.summary {
  min-width: 0;
}

.view-switcher {
  display: flex;
  align-items: center;
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

.control--embed-merged {
  min-width: 320px;
  padding-right: 50px;
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

.embed-targets {
  display: grid;
  gap: 8px;
}

.embed-targets__label {
  color: var(--sqb-primary);
  font: 700 11px/1.2 var(--sqb-sans);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.embed-target-picker {
  position: relative;
}

.embed-target-picker__toggle {
  position: absolute;
  top: 4px;
  right: 4px;
  bottom: 4px;
  width: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--sqb-text-muted);
  cursor: pointer;
  font: 600 18px/1 var(--sqb-sans);
}

.embed-target-picker__chevron {
  display: inline-block;
  transition: transform 0.2s ease;
}

.embed-target-picker__chevron.is-open {
  transform: rotate(180deg);
}

.embed-target-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 20;
  display: grid;
  gap: 4px;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
  box-shadow: var(--sqb-shadow-strong);
}

.embed-target-menu__section {
  padding: 4px 6px 0;
  color: var(--sqb-text-muted);
  font: 600 12px/1.4 var(--sqb-sans);
}

.embed-target-menu__item {
  display: grid;
  gap: 2px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--sqb-text);
  cursor: pointer;
  text-align: left;
}

.embed-target-menu__item:hover {
  background: var(--sqb-primary-soft);
}

.embed-target-menu__item strong {
  font: 600 13px/1.4 var(--sqb-sans);
}

.embed-target-menu__item small,
.embed-target-menu__eyebrow,
.embed-target-menu__empty {
  color: var(--sqb-text-muted);
  font: 12px/1.4 var(--sqb-sans);
}

.embed-target-menu__eyebrow {
  color: var(--sqb-primary);
}

.embed-target-menu__empty {
  margin: 0;
  padding: 8px 10px;
}

.muted--embed-target {
  color: var(--sqb-text-muted);
  font-size: 13px;
  font-style: normal;
  white-space: normal;
  word-break: break-word;
}

.alert {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--sqb-danger-soft);
  color: var(--sqb-danger);
  font: 13px/1.45 var(--sqb-sans);
}

.advanced-panel {
  margin-top: 14px;
  border-radius: 16px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-soft);
  overflow: hidden;
}

.advanced-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
}

.advanced-panel__copy {
  display: grid;
  gap: 3px;
}

.advanced-panel__eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--sqb-primary);
  font: 700 11px/1.2 var(--sqb-sans);
}

.advanced-panel__copy strong {
  font: 700 15px/1.25 var(--sqb-sans);
  color: var(--sqb-text);
}

.advanced-panel__copy span:last-child {
  color: var(--sqb-text-muted);
  font: 13px/1.45 var(--sqb-sans);
}

.section-toggle {
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

.section-toggle:hover {
  background: var(--sqb-bg-strong);
}

.section-toggle svg {
  width: 16px;
  height: 16px;
  transition: transform 140ms ease;
}

.section-toggle svg.is-expanded {
  transform: rotate(180deg);
}

.sql-box {
  padding: 0 18px 18px;
}

.sql-box__surface {
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid var(--sqb-border-strong);
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0) 42%),
    var(--sqb-bg-strong);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.sql-box__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--sqb-border);
  background: rgba(255, 255, 255, 0.22);
}

.sql-box__language {
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--sqb-text-muted);
  font: 700 11px/1.2 var(--sqb-mono);
}

.sql-box__copy {
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

.sql-box__copy:hover:not(:disabled) {
  border-color: var(--sqb-border);
  background: var(--sqb-surface);
  color: var(--sqb-text);
}

.sql-box__copy:focus-visible {
  outline: 2px solid var(--sqb-primary);
  outline-offset: 2px;
}

.sql-box__copy:disabled {
  cursor: default;
  opacity: 0.4;
}

.sql-box__copy svg {
  width: 16px;
  height: 16px;
}

.sql-box__code {
  margin: 0;
  padding: 14px 16px 16px;
  color: var(--sqb-text);
  white-space: pre-wrap;
  word-break: break-word;
  font: 12px/1.55 var(--sqb-mono);
}

.sql-box__code code {
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

.table-wrap {
  margin-top: 12px;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--sqb-border);
  text-align: left;
  vertical-align: top;
  font: 13px/1.45 var(--sqb-sans);
}

.table th {
  position: sticky;
  top: 0;
  background: var(--sqb-bg-strong);
  color: var(--sqb-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font: 600 11px/1.3 var(--sqb-sans);
}

.link {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--sqb-primary-strong);
  cursor: pointer;
  text-align: left;
  font: 600 13px/1.45 var(--sqb-sans);
}

.link--block {
  display: block;
  margin-bottom: 10px;
}

.board {
  margin-top: 14px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(260px, 1fr);
  gap: 16px;
  overflow-x: auto;
}

.board__column {
  min-height: 280px;
  padding: 14px;
  border-radius: 16px;
  background: var(--sqb-surface-soft);
  border: 1px solid var(--sqb-border);
}

.board__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.board__card {
  margin-bottom: 8px;
  padding: 12px;
  border-radius: 12px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  cursor: grab;
}

.tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tokens span,
.pill {
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--sqb-accent-soft);
  color: var(--sqb-accent);
  font: 600 12px/1.2 var(--sqb-sans);
}

.list {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list__item,
.cards__item {
  padding: 12px;
  border-radius: 12px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
}

.list__item small,
.cards__item span {
  color: var(--sqb-text-muted);
  font: 13px/1.4 var(--sqb-sans);
}

.cards {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.cards__item strong {
  display: block;
  margin-bottom: 4px;
  font: 700 22px/1.1 var(--sqb-serif);
  color: var(--sqb-primary-strong);
}

.embed-panel {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  border-radius: 20px;
  background: var(--sqb-surface-soft);
  border: 1px solid var(--sqb-border);
}

.embed-panel .control {
  border-radius: 8px;
  height: 32px;
  padding: 0 10px;
  background: var(--sqb-surface-strong);
  border-color: var(--sqb-border);
}

.btn--embed {
  flex: 0 0 auto;
  height: 32px;
  padding: 0 16px;
  border-radius: 8px;
  background: var(--sqb-primary);
  color: #ffffff;
  font: 600 13px/1.2 var(--sqb-sans);
  border: none;
  cursor: pointer;
  transition: background 80ms ease;
}

.btn--embed:hover {
  background: var(--sqb-primary-strong);
}

@media (max-width: 720px) {
  .section-head,
  .embed-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .control--embed-merged {
    min-width: 100%;
  }

  .tabs__item {
    flex: 1 1 calc(50% - 6px);
  }
}
</style>
