<template>
  <section class="inline-widget inline-widget--dark">
    <header class="inline-widget__header">
      <div class="inline-widget__heading">
        <div class="inline-widget__icon" aria-hidden="true">
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
          <h2>{{ title }}</h2>
        </div>
      </div>
      <span class="pill">{{ result.total }}</span>
    </header>

    <section
      v-if="!result.rows.length"
      class="empty"
    >
      <div class="empty__icon" aria-hidden="true" />
      <h5>嵌入结果为空</h5>
      <p>当前查询还没有匹配到内容。调整条件后重新运行，嵌入块会自动呈现新的结果。</p>
    </section>

    <div
      v-else-if="viewType === 'cards'"
      class="cards"
    >
      <article
        v-for="card in cards"
        :key="card.label"
        class="cards__item"
      >
        <strong>{{ card.value }}</strong>
        <span>{{ card.label }}</span>
      </article>
    </div>

    <ul
      v-else-if="viewType === 'list'"
      class="list"
    >
        <li
          v-for="item in listItems"
          :key="item.id"
          class="list__item"
        >
          <div class="list__main">
            <button
              class="link"
              @click="openBlock(item.id)"
            >
              {{ item.title || "未命名块" }}
            </button>
            <small>{{ item.meta.join(" · ") || "无附加信息" }}</small>
          </div>
        </li>
      </ul>

    <div
      v-else-if="viewType === 'board'"
      class="board"
    >
      <section
        v-for="column in boardColumns"
        :key="column.id"
        class="board__column"
      >
        <header class="board__head">
          <span class="board__title">{{ column.title }}</span>
          <span class="pill pill--soft">{{ column.rows.length }}</span>
        </header>
        <article
          v-for="row in column.rows"
          :key="row.id"
          class="board__card"
        >
          <button
            class="link link--block"
            @click="openBlock(row.id)"
          >
            {{ row.content || "未命名块" }}
          </button>
          <p class="board__project">
            {{ displayValue(row, `attr:${fieldMappings.project}`) || "未绑定项目" }}
          </p>
          <p class="board__date">
            {{ displayValue(row, `attr:${fieldMappings.dueDate}`) || "无截止日期" }}
          </p>
          <div class="tokens">
            <span>{{ displayValue(row, `attr:${fieldMappings.priority}`) || "无优先级" }}</span>
            <span>{{ displayValue(row, `attr:${fieldMappings.status}`) || "未设置状态" }}</span>
          </div>
        </article>
      </section>
    </div>

    <div
      v-else
      class="table-wrap"
    >
      <table class="table">
        <thead>
          <tr>
            <th
              v-for="field in fields"
              :key="field"
            >
              {{ fieldLabel(field) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in result.rows"
            :key="row.id"
            class="table__row"
          >
            <td
              v-for="field in fields"
              :key="`${row.id}-${field}`"
            >
              <button
                v-if="field === 'content'"
                class="link"
                @click="openBlock(row.id)"
              >
                {{ displayValue(row, field) || "打开原始块" }}
              </button>
              <span
                v-else
                :class="{ 'table__muted': !displayValue(row, field) }"
              >{{ displayValue(row, field) || "—" }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue"

import { displayValue as formatDisplayValue } from "@/composables/query-builder-store/shared"
import { buildBoardColumns } from "@/core/view/board"
import type { FieldMappings, ResultSet, ViewType } from "@/core/query/types"
import { buildCardsSummary, buildListItems } from "@/inline/view-models"

const props = defineProps<{
  title: string
  viewType: ViewType
  result: ResultSet
  fields: string[]
  groupBy?: string
  fieldMappings: FieldMappings
  notebooks?: Array<{ id: string, name: string }>
}>()

const cards = computed(() => buildCardsSummary(props.result.rows, props.groupBy || `attr:${props.fieldMappings.status}`))
const listItems = computed(() => buildListItems(props.result.rows, [
  `attr:${props.fieldMappings.priority}`,
  `attr:${props.fieldMappings.status}`,
  `attr:${props.fieldMappings.dueDate}`,
]))
const boardColumns = computed(() => buildBoardColumns(props.result.rows, props.groupBy || `attr:${props.fieldMappings.status}`))
const notebookNameById = computed(() => Object.fromEntries(
  (props.notebooks || []).map(notebook => [notebook.id, notebook.name]),
))

function fieldLabel(field: string) {
  if (field === "content")
    return "标题 / 内容"
  if (field.startsWith("attr:"))
    return field.slice("attr:".length)
  return field
}

function displayValue(row: ResultSet["rows"][number], field: string) {
  return formatDisplayValue(row, field, {
    notebookNameById: notebookNameById.value,
  })
}

function openBlock(blockId: string) {
  window.open(`siyuan://blocks/${blockId}`)
}
</script>

<style lang="scss" scoped>
.inline-widget {
  margin: 8px 0;
  padding: 18px;
  border-radius: 24px;
}

.inline-widget--dark {
  background:
    radial-gradient(circle at top right, rgba(196, 166, 106, 0.16), transparent 26%),
    radial-gradient(circle at bottom left, rgba(74, 124, 89, 0.18), transparent 30%),
    linear-gradient(180deg, rgba(27, 32, 30, 0.98), rgba(19, 24, 22, 0.96));
  border: 1px solid rgba(154, 178, 160, 0.18);
  box-shadow: 0 16px 34px rgba(10, 14, 12, 0.28);
  color: rgba(240, 244, 241, 0.96);
}

.inline-widget__header,
.board__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.inline-widget__header {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(154, 178, 160, 0.16);
}

.inline-widget__heading {
  min-width: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 12px;
}

.inline-widget__icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(74, 124, 89, 0.2);
  color: rgba(215, 233, 221, 0.96);
}

.inline-widget__icon svg {
  width: 22px;
  height: 22px;
}

.eyebrow {
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--sqb-primary);
  font: 700 10px/1.2 var(--sqb-sans);
}

h4 {
  margin: 0;
  font: 700 20px/1.08 var(--sqb-serif);
  color: var(--sqb-text);
}

h2 {
  margin: 0;
  font: 700 20px/1.08 var(--sqb-serif);
  color: rgba(242, 245, 243, 0.96);
}

.inline-widget__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.inline-widget__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(79, 87, 83, 0.9);
  color: rgba(230, 236, 232, 0.92);
  font: 700 11px/1.2 var(--sqb-sans);
  letter-spacing: 0.04em;
}

.inline-widget__badge--primary {
  background: rgba(74, 124, 89, 0.24);
  color: rgba(215, 233, 221, 0.96);
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  padding: 7px 11px;
  border-radius: 999px;
  background: rgba(74, 124, 89, 0.24);
  color: rgba(221, 236, 226, 0.98);
  font: 700 12px/1.2 var(--sqb-sans);
}

.pill--soft {
  padding: 4px 8px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.cards__item,
.board__card,
.list__item {
  padding: 14px;
  border-radius: 18px;
  background: rgba(40, 47, 44, 0.92);
  border: 1px solid rgba(154, 178, 160, 0.14);
  box-shadow: 0 10px 20px rgba(10, 14, 12, 0.12);
}

.empty {
  margin-top: 18px;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  border-radius: 22px;
  border: 1px dashed rgba(154, 178, 160, 0.28);
  background: rgba(34, 40, 37, 0.82);
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
  border: 4px solid rgba(171, 184, 176, 0.56);
  border-radius: 50%;
}

.empty__icon::after {
  right: 4px;
  bottom: 2px;
  width: 16px;
  height: 4px;
  border-radius: 999px;
  background: rgba(171, 184, 176, 0.56);
  transform: rotate(48deg);
  transform-origin: center;
}

.empty h5 {
  margin: 0;
  color: rgba(236, 241, 238, 0.94);
  font: 700 18px/1.2 var(--sqb-serif);
}

.empty p {
  max-width: 360px;
  margin: 0;
  color: rgba(197, 206, 200, 0.84);
  font: 13px/1.55 var(--sqb-sans);
}

.cards__item strong {
  display: block;
  margin-bottom: 6px;
  font: 700 28px/1 var(--sqb-serif);
  color: rgba(232, 240, 235, 0.98);
}

.cards__item span,
.board__card small,
.list__item small {
  color: rgba(195, 205, 199, 0.82);
  font: 13px/1.45 var(--sqb-sans);
}

.list {
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list__main {
  display: grid;
  gap: 6px;
}

.board {
  margin-top: 18px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(240px, 1fr);
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.board__column {
  padding: 14px;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(34, 40, 37, 0.88), rgba(25, 30, 28, 0.9));
  border: 1px solid rgba(154, 178, 160, 0.12);
}

.board__title {
  color: rgba(238, 242, 239, 0.96);
  font: 600 14px/1.3 var(--sqb-sans);
}

.board__card {
  margin-top: 10px;
  display: grid;
  gap: 10px;
}

.link--block {
  display: block;
}

.board__project,
.board__date {
  margin: 0;
  color: rgba(195, 205, 199, 0.82);
  font: 13px/1.45 var(--sqb-sans);
}

.board__project {
  color: rgba(238, 242, 239, 0.96);
  font-weight: 600;
}

.table-wrap {
  margin-top: 18px;
  overflow: auto;
  border-radius: 18px;
  border: 1px solid rgba(154, 178, 160, 0.14);
  background: rgba(33, 39, 36, 0.88);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 12px 10px;
  border-bottom: 1px solid rgba(154, 178, 160, 0.12);
  text-align: left;
  vertical-align: top;
  font: 13px/1.45 var(--sqb-sans);
}

.table th {
  position: sticky;
  top: 0;
  background: rgba(43, 50, 47, 0.96);
  color: rgba(206, 217, 210, 0.84);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font: 700 10px/1.2 var(--sqb-sans);
}

.table td:first-child {
  min-width: 220px;
}

.table__row {
  transition: background 140ms ease;
}

.table__row:hover {
  background: rgba(57, 66, 61, 0.52);
}

.table__muted {
  color: rgba(181, 191, 185, 0.76);
}

.link {
  padding: 0;
  border: none;
  background: transparent;
  color: rgba(222, 236, 226, 0.98);
  cursor: pointer;
  text-align: left;
  font: 600 13px/1.4 var(--sqb-sans);
}

.tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tokens span {
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(196, 166, 106, 0.2);
  color: rgba(245, 226, 183, 0.96);
  font: 600 11px/1.2 var(--sqb-sans);
}

@media (max-width: 720px) {
  .inline-widget {
    padding: 14px;
    border-radius: 20px;
  }

  .inline-widget__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .inline-widget__heading {
    width: 100%;
  }

  .inline-widget__badges {
    margin-top: 8px;
  }

  .board {
    grid-auto-columns: minmax(210px, 1fr);
  }
}
</style>
