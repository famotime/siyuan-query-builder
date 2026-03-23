<template>
  <div class="board">
    <section
      v-for="column in boardColumns"
      :key="column.id"
      class="board__column"
      @dragover.prevent
      @drop="dropToColumn(column.id)"
    >
      <header class="board__head">
        <h4>{{ column.title }}</h4>
        <span class="board__count">{{ column.rows.length }}</span>
      </header>
      <article
        v-for="row in column.rows"
        :key="row.id"
        class="board__card"
        draggable="true"
        @dragstart="setDraggingRowId(row.id)"
      >
        <button
          class="link link--block"
          @click="openBlock(row.id)"
        >
          {{ row.content || "未命名块" }}
        </button>
        <p class="muted">
          {{ displayValue(row, `attr:${fieldMappings.project}`) || "未绑定项目" }}
        </p>
        <div class="tokens">
          <span>{{ displayValue(row, `attr:${fieldMappings.priority}`) || "无优先级" }}</span>
          <span>{{ displayValue(row, `attr:${fieldMappings.dueDate}`) || "无日期" }}</span>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { FieldMappings, ResultRow } from "@/core/query/types"
import type { BoardColumn } from "@/core/view/board"

defineProps<{
  boardColumns: BoardColumn[]
  fieldMappings: FieldMappings
  displayValue: (row: ResultRow, field: string) => string
  openBlock: (blockId: string) => void
  setDraggingRowId: (rowId: string) => void
  dropToColumn: (columnId: string) => void | Promise<void>
}>()
</script>
