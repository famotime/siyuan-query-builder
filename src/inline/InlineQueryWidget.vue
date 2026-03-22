<template>
  <section class="inline-widget">
    <header class="inline-widget__header">
      <div>
        <p class="eyebrow">
          siyuan-query-builder
        </p>
        <h4>{{ title }}</h4>
      </div>
      <span class="pill">{{ result.total }} 项</span>
    </header>

    <div
      v-if="viewType === 'cards'"
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
        <button
          class="link"
          @click="openBlock(item.id)"
        >
          {{ item.title || "未命名块" }}
        </button>
        <small>{{ item.meta.join(" · ") || "无附加信息" }}</small>
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
          <span>{{ column.title }}</span>
          <span class="pill pill--soft">{{ column.rows.length }}</span>
        </header>
        <article
          v-for="row in column.rows"
          :key="row.id"
          class="board__card"
        >
          <button
            class="link"
            @click="openBlock(row.id)"
          >
            {{ row.content || "未命名块" }}
          </button>
          <small>{{ displayValue(row, `attr:${fieldMappings.project}`) || "未绑定项目" }}</small>
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
              <span v-else>{{ displayValue(row, field) || "—" }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue"

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
}>()

const cards = computed(() => buildCardsSummary(props.result.rows, props.groupBy || `attr:${props.fieldMappings.status}`))
const listItems = computed(() => buildListItems(props.result.rows, [
  `attr:${props.fieldMappings.priority}`,
  `attr:${props.fieldMappings.status}`,
  `attr:${props.fieldMappings.dueDate}`,
]))
const boardColumns = computed(() => buildBoardColumns(props.result.rows, props.groupBy || `attr:${props.fieldMappings.status}`))

function fieldLabel(field: string) {
  if (field === "content")
    return "标题 / 内容"
  if (field.startsWith("attr:"))
    return field.slice("attr:".length)
  return field
}

function displayValue(row: ResultSet["rows"][number], field: string) {
  if (field.startsWith("attr:")) {
    return row.attrs[field.slice("attr:".length)] || ""
  }
  return String(row[field] || "")
}

function openBlock(blockId: string) {
  window.open(`siyuan://blocks/${blockId}`)
}
</script>

<style lang="scss" scoped>
.inline-widget {
  margin: 8px 0;
  padding: 16px;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(242, 126, 34, 0.15), transparent 34%),
    linear-gradient(180deg, rgba(255, 252, 245, 0.98), rgba(248, 241, 230, 0.94));
  border: 1px solid rgba(59, 46, 32, 0.12);
  box-shadow: 0 12px 28px rgba(87, 63, 33, 0.08);
}

.inline-widget__header,
.board__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.eyebrow {
  margin: 0 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font: 700 10px/1.2 "Trebuchet MS", "Microsoft YaHei", sans-serif;
  opacity: 0.7;
}

h4 {
  margin: 0;
  font: 600 20px/1.1 Georgia, "Times New Roman", serif;
  color: #241d17;
}

.pill {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(242, 126, 34, 0.12);
  color: #7b3404;
  font: 700 12px/1.2 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.pill--soft {
  padding: 4px 8px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.cards__item,
.board__card,
.list__item {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(59, 46, 32, 0.08);
}

.cards__item strong {
  display: block;
  margin-bottom: 4px;
  font: 700 26px/1 Georgia, "Times New Roman", serif;
  color: #a24004;
}

.cards__item span,
.board__card small,
.list__item small {
  color: rgba(36, 29, 23, 0.66);
  font: 13px/1.4 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.list {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.board {
  margin-top: 14px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(220px, 1fr);
  gap: 12px;
  overflow-x: auto;
}

.board__column {
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(59, 46, 32, 0.08);
}

.board__card {
  margin-top: 10px;
}

.table-wrap {
  margin-top: 14px;
  overflow: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 10px 8px;
  border-bottom: 1px solid rgba(59, 46, 32, 0.08);
  text-align: left;
  font: 13px/1.4 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.link {
  padding: 0;
  border: none;
  background: transparent;
  color: #b54a08;
  cursor: pointer;
  text-align: left;
  font: 600 13px/1.35 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}
</style>
