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

      <section
        v-if="store.savedViews?.length"
        class="saved-views"
      >
        <div class="saved-views__head">
          <div>
            <h4>已保存视图</h4>
            <p class="muted">同一模板下可切换多个视图配置，并可指定默认视图。</p>
          </div>
          <button
            class="btn btn--ghost btn--small"
            data-view-save-as
            type="button"
            @click="store.saveViewAs"
          >
            添加为新视图
          </button>
        </div>
        <div
          class="saved-views__list"
          data-saved-views-grid
        >
          <article
            v-for="view in store.savedViews"
            :key="view.id"
            class="saved-views__item"
            data-saved-view-card
            :class="{ 'saved-views__item--active': view.id === store.draft.view.id }"
          >
            <button
              class="saved-views__main"
              type="button"
              :data-view-load="view.id"
              @click="store.loadSavedView(view.id)"
            >
              <strong>{{ viewTypeLabel(view.type) }}</strong>
              <span
                v-if="view.defaultView"
                class="saved-views__badge"
              >默认</span>
            </button>
            <div class="saved-views__actions">
              <button
                class="btn btn--ghost btn--small"
                type="button"
                :data-view-default="view.id"
                @click="store.setDefaultSavedView(view.id)"
              >
                设为默认
              </button>
              <DeleteIconButton
                :data-view-delete="view.id"
                class="saved-views__delete"
                title="删除视图"
                aria-label="删除视图"
                @click="store.deleteSavedView(view.id)"
              />
            </div>
          </article>
        </div>
      </section>

      <div
        v-if="store.draft.view.type === 'board' && store.boardDragCapability && !store.boardDragCapability.enabled && store.boardDragCapability.reason"
        class="alert alert--warning"
      >
        {{ store.boardDragCapability.reason }}
      </div>

      <section class="advanced-panel">
        <button
          class="advanced-panel__toggle"
          data-advanced-mode-toggle
          type="button"
          :aria-expanded="String(store.advancedMode)"
          @click="store.advancedMode = !store.advancedMode"
        >
          <div class="advanced-panel__copy">
            <strong>SQL</strong>
            <span>查看当前查询生成的 SQL 表达。</span>
          </div>
          <span
            class="advanced-panel__chevron"
            :class="{ 'advanced-panel__chevron--open': store.advancedMode }"
            aria-hidden="true"
          >⌄</span>
        </button>
        <div
          v-if="store.advancedMode"
          class="sql-box"
        >
          <pre>{{ store.advancedSql || "运行查询后会显示生成后的 SQL 表达。" }}</pre>
        </div>
      </section>

      <div
        v-if="!store.resultSet?.rows.length"
        class="empty"
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

      <section class="embed-panel">
        <div class="embed-targets">
          <span class="embed-targets__label">嵌入到文档</span>
          <div
            ref="embedTargetPickerRef"
            class="embed-target-picker"
          >
            <input
              v-model="store.embedParentId"
              class="control control--embed-merged"
              placeholder="选择或输入目标文档 ID / 父块 ID"
              @focus="store.refreshCurrentDocumentTarget"
            >
            <button
              class="embed-target-picker__toggle"
              type="button"
              aria-label="选择当前文档或历史 ID"
              :aria-expanded="embedTargetMenuOpen"
              @click="toggleEmbedTargetMenu"
            >
              <span
                class="embed-target-picker__chevron"
                :class="{ 'is-open': embedTargetMenuOpen }"
              >⌄</span>
            </button>
            <div
              v-if="embedTargetMenuOpen"
              class="embed-target-menu"
            >
              <button
                v-if="store.currentDocumentTarget"
                class="embed-target-menu__item"
                type="button"
                @click="selectCurrentDocumentTarget"
              >
                <span class="embed-target-menu__eyebrow">当前文档</span>
                <strong>{{ store.currentDocumentTarget.title }}</strong>
                <small>{{ store.currentDocumentTarget.id }}</small>
              </button>
              <template v-if="otherOpenDocumentOptions.length">
                <div class="embed-target-menu__section">
                  已打开文档
                </div>
                <button
                  v-for="target in otherOpenDocumentOptions"
                  :key="target.id"
                  class="embed-target-menu__item"
                  type="button"
                  @click="selectRecentTarget(target.id)"
                >
                  <strong>{{ target.title || target.id }}</strong>
                  <small>文档 · {{ target.id }}</small>
                </button>
              </template>
              <template v-if="recentTargetOptions.length">
                <div class="embed-target-menu__section">
                  历史 ID
                </div>
                <button
                  v-for="target in recentTargetOptions"
                  :key="target.id"
                  class="embed-target-menu__item"
                  type="button"
                  @click="selectRecentTarget(target.id)"
                >
                  <strong>{{ target.title || target.id }}</strong>
                  <small>{{ target.type === "document" ? "文档" : "块" }} · {{ target.id }}</small>
                  <small v-if="target.content && target.content !== target.title">{{ target.content }}</small>
                </button>
              </template>
              <p
                v-if="!store.currentDocumentTarget && !otherOpenDocumentOptions.length && !recentTargetOptions.length"
                class="embed-target-menu__empty"
              >
                暂无当前文档、已打开文档或历史 ID，可直接输入。
              </p>
            </div>
          </div>
          <p class="muted muted--embed-target">
            {{ store.embedTargetHint }}
          </p>
        </div>
        <button
          class="btn btn--embed"
          @click="store.insertEmbed"
        >
          <svg
            class="btn__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3zm7 10l.8 2.2L22 16l-2.2.8L19 19l-.8-2.2L16 16l2.2-.8L19 13zM6 14l1.1 2.9L10 18l-2.9 1.1L6 22l-1.1-2.9L2 18l2.9-1.1L6 14z"
              fill="currentColor"
            />
          </svg>
          生成嵌入块
        </button>
      </section>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"

import DeleteIconButton from "@/components/query-builder/DeleteIconButton.vue"
import { useQueryBuilderStore } from "@/composables/query-builder-store"

const store = useQueryBuilderStore()
const embedTargetMenuOpen = ref(false)
const embedTargetPickerRef = ref<HTMLElement | null>(null)
const otherOpenDocumentOptions = computed(() => store.openDocumentTargets.filter(target => target.id !== store.currentDocumentTarget?.id))
const recentTargetOptions = computed(() => {
  const excludedIds = new Set(store.openDocumentTargets.map(target => target.id))
  return store.recentEmbedTargets.filter(target => !excludedIds.has(target.id))
})

async function toggleEmbedTargetMenu() {
  if (!embedTargetMenuOpen.value) {
    await store.refreshCurrentDocumentTarget()
  }
  embedTargetMenuOpen.value = !embedTargetMenuOpen.value
}

async function selectCurrentDocumentTarget() {
  const selected = await store.selectCurrentDocumentTarget()
  if (selected) {
    embedTargetMenuOpen.value = false
  }
}

async function selectRecentTarget(targetId: string) {
  await store.selectEmbedTarget(targetId)
  embedTargetMenuOpen.value = false
}

function viewTypeLabel(type: string) {
  switch (type) {
    case "board":
      return "看板"
    case "list":
      return "列表"
    case "cards":
      return "统计卡片"
    default:
      return "表格"
  }
}

function handleDocumentPointerDown(event: Event) {
  const picker = embedTargetPickerRef.value
  const target = event.target
  if (!picker || !(target instanceof Node) || picker.contains(target)) {
    return
  }
  embedTargetMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener("pointerdown", handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown)
})
</script>

<style lang="scss" scoped>
.results {
  margin-top: 0;
}

.card {
  min-height: 560px;
  padding: 24px;
  border-radius: 28px;
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
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(228, 224, 216, 0.9);
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
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: rgba(74, 124, 89, 0.14);
  color: var(--sqb-primary);
}

.summary__icon svg {
  width: 28px;
  height: 28px;
}

h3,
h4 {
  margin: 0;
}

h3 {
  font-size: 26px;
  line-height: 1.08;
}

.muted {
  margin: 0;
  color: var(--sqb-text-muted);
  font: 14px/1.55 var(--sqb-sans);
}

.control {
  width: 100%;
  box-sizing: border-box;
  border-radius: 16px;
  border: 1px solid var(--sqb-border);
  background: rgba(255, 255, 255, 0.9);
  color: var(--sqb-text);
  padding: 12px 14px;
  font: 14px/1.4 var(--sqb-sans);
  transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
}

.control--compact {
  min-width: 120px;
  padding: 9px 11px;
}

.control--embed-merged {
  min-width: 320px;
  padding-right: 50px;
}

.control:focus {
  outline: none;
  border-color: rgba(74, 124, 89, 0.42);
  box-shadow: 0 0 0 4px rgba(74, 124, 89, 0.12);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: transform 140ms ease, background 140ms ease, border-color 140ms ease;
  border: 1px solid transparent;
  border-radius: 16px;
  padding: 10px 14px;
  background: transparent;
  cursor: pointer;
  font: 600 13px/1.2 var(--sqb-sans);
}

.btn:hover,
.tabs__item:hover {
  transform: translateY(-1px);
}

.btn--ghost {
  background: var(--sqb-primary);
  border-color: rgba(74, 124, 89, 0.22);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(74, 124, 89, 0.18);
}

.saved-views {
  display: grid;
  gap: 12px;
  margin-bottom: 18px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(59, 46, 32, 0.12);
  background: rgba(255, 255, 255, 0.56);
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
  gap: 12px;
  min-height: 126px;
  padding: 14px;
  border-radius: 20px;
  border: 1px solid rgba(59, 46, 32, 0.1);
  background:
    linear-gradient(180deg, rgba(255, 251, 245, 0.88), rgba(248, 244, 237, 0.74));
  box-shadow: 0 10px 22px rgba(57, 61, 52, 0.05);
}

.saved-views__item--active {
  border-color: rgba(74, 124, 89, 0.26);
  background:
    linear-gradient(180deg, rgba(74, 124, 89, 0.12), rgba(255, 255, 255, 0.82));
  box-shadow: 0 14px 26px rgba(74, 124, 89, 0.08);
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
  min-height: 40px;
  padding-inline: 12px;
  justify-content: center;
}

.saved-views__badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(74, 124, 89, 0.12);
  color: #365943;
  font: 700 12px/1.2 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px;
  border-radius: 999px;
  background: rgba(226, 219, 205, 0.9);
}

.tabs__item {
  transition: transform 140ms ease, background 140ms ease, color 140ms ease, box-shadow 140ms ease;
  border: none;
  cursor: pointer;
  padding: 10px 22px;
  border-radius: 999px;
  background: transparent;
  color: rgba(58, 53, 47, 0.86);
  font: 600 13px/1.2 var(--sqb-sans);
}

.tabs__item--active {
  background: #ffffff;
  color: var(--sqb-primary-strong);
  box-shadow: 0 2px 8px rgba(57, 61, 52, 0.08);
}

.btn__icon {
  width: 18px;
  height: 18px;
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
  width: 38px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #87a98b;
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
  gap: 6px;
  padding: 8px;
  border-radius: 18px;
  border: 1px solid var(--sqb-border);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 36px rgba(57, 61, 52, 0.16);
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
  padding: 10px 12px;
  border: none;
  border-radius: 14px;
  background: var(--sqb-surface-soft);
  color: var(--sqb-text);
  cursor: pointer;
  text-align: left;
}

.embed-target-menu__item:hover {
  background: rgba(74, 124, 89, 0.12);
}

.embed-target-menu__item strong {
  font: 600 14px/1.4 var(--sqb-sans);
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
  color: #b6c5b6;
  font-size: 13px;
  font-style: italic;
}

.alert {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: var(--sqb-danger-soft);
  color: var(--sqb-danger);
  font: 14px/1.45 var(--sqb-sans);
}

.advanced-panel {
  margin-top: 16px;
  border-radius: 22px;
  border: 1px solid rgba(116, 121, 110, 0.14);
  background:
    linear-gradient(180deg, rgba(245, 241, 234, 0.92), rgba(255, 255, 255, 0.82));
  overflow: hidden;
}

.advanced-panel__toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
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
  font: 700 16px/1.25 var(--sqb-sans);
  color: var(--sqb-text);
}

.advanced-panel__copy span:last-child {
  color: var(--sqb-text-muted);
  font: 13px/1.45 var(--sqb-sans);
}

.advanced-panel__chevron {
  flex: 0 0 auto;
  color: var(--sqb-text-muted);
  font: 600 18px/1 var(--sqb-sans);
  transition: transform 140ms ease;
}

.advanced-panel__chevron--open {
  transform: rotate(180deg);
}

.sql-box {
  padding: 0 18px 18px;
}

.sql-box pre {
  margin: 0;
  padding: 14px;
  border-radius: 18px;
  background: #2f342f;
  color: #f5f0e8;
  white-space: pre-wrap;
  word-break: break-word;
  font: 12px/1.55 "Consolas", "Courier New", monospace;
}

.empty {
  min-height: 330px;
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  border-radius: 24px;
  border: 1px dashed rgba(205, 201, 191, 0.9);
  background: rgba(255, 255, 255, 0.56);
}

.empty__icon {
  position: relative;
  width: 54px;
  height: 54px;
}

.empty__icon::before,
.empty__icon::after {
  content: '';
  position: absolute;
}

.empty__icon::before {
  inset: 4px 8px 8px 4px;
  border: 4px solid #d2cec8;
  border-radius: 50%;
}

.empty__icon::after {
  right: 4px;
  bottom: 2px;
  width: 18px;
  height: 4px;
  border-radius: 999px;
  background: #d2cec8;
  transform: rotate(48deg);
  transform-origin: center;
}

.empty h4 {
  font-size: 18px;
  color: #8e877e;
}

.empty p {
  margin: 0;
  color: #8e877e;
  font: 14px/1.5 var(--sqb-sans);
  max-width: 420px;
}

.table-wrap {
  margin-top: 14px;
  overflow: auto;
  border-radius: 20px;
  border: 1px solid rgba(116, 121, 110, 0.12);
  background: rgba(255, 255, 255, 0.72);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 14px 12px;
  border-bottom: 1px solid rgba(116, 121, 110, 0.12);
  text-align: left;
  vertical-align: top;
  font: 14px/1.45 var(--sqb-sans);
}

.table th {
  position: sticky;
  top: 0;
  background: rgba(245, 241, 234, 0.96);
  color: var(--sqb-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font: 700 11px/1.3 var(--sqb-sans);
}

.link {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--sqb-primary-strong);
  cursor: pointer;
  text-align: left;
  font: 600 14px/1.45 var(--sqb-sans);
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
  min-height: 320px;
  padding: 16px;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(240, 236, 228, 0.74), rgba(255, 255, 255, 0.74));
  border: 1px solid rgba(116, 121, 110, 0.14);
}

.board__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.board__card {
  margin-bottom: 10px;
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 241, 234, 0.88));
  border: 1px solid rgba(74, 124, 89, 0.12);
  cursor: grab;
  box-shadow: 0 12px 24px rgba(57, 61, 52, 0.08);
}

.tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tokens span,
.pill {
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--sqb-accent-soft);
  color: #6e5723;
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
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(116, 121, 110, 0.14);
  box-shadow: 0 10px 20px rgba(57, 61, 52, 0.05);
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
  margin-bottom: 6px;
  font: 700 30px/1 var(--sqb-serif);
  color: var(--sqb-primary-strong);
}

.embed-panel {
  margin-top: 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 30px;
  border-radius: 30px;
  background: #f0f2ef;
  border: 1px solid rgba(210, 214, 206, 0.9);
}

.embed-panel .control {
  border-radius: 999px;
  min-height: 58px;
  padding-inline: 20px 52px;
  background: #ffffff;
  border-color: rgba(219, 224, 216, 0.9);
}

.btn--embed {
  flex: 0 0 auto;
  min-width: 216px;
  min-height: 72px;
  border-radius: 20px;
  background: var(--sqb-primary);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(74, 124, 89, 0.18);
  font-size: 16px;
  font-weight: 700;
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
