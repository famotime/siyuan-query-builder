<template>
  <div class="table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th
            v-for="field in resultFields"
            :key="field"
          >
            {{ fieldLabel(field) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.id"
        >
          <td
            v-for="field in resultFields"
            :key="`${row.id}-${field}`"
          >
            <button
              v-if="field === 'content' && canOpenRow(row)"
              class="link"
              @click="openBlock(row.id)"
            >
              {{ displayValue(row, field) || "打开原始块" }}
            </button>
            <span v-else-if="field === 'content'">{{ displayValue(row, field) || "—" }}</span>
            <select
              v-else-if="editableField(field) === 'status'"
              class="control control--compact"
              :value="displayValue(row, field)"
              @change="quickEdit(row.id, 'status', ($event.target as HTMLSelectElement).value)"
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
              v-else-if="editableField(field) === 'priority'"
              class="control control--compact"
              :value="displayValue(row, field)"
              @change="quickEdit(row.id, 'priority', ($event.target as HTMLSelectElement).value)"
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
              v-else-if="editableField(field) === 'dueDate'"
              class="control control--compact"
              type="date"
              :value="displayValue(row, field)"
              @change="quickEdit(row.id, 'dueDate', ($event.target as HTMLInputElement).value)"
            >
            <span v-else>{{ displayValue(row, field) || "—" }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { ResultRow } from "@/core/query/types"

defineProps<{
  resultFields: string[]
  rows: ResultRow[]
  fieldLabel: (field: string) => string
  canOpenRow: (row: ResultRow) => boolean
  displayValue: (row: ResultRow, field: string) => string
  editableField: (field: string) => string | null
  quickEdit: (rowId: string, field: "status" | "priority" | "dueDate", value: string) => void | Promise<void>
  openBlock: (blockId: string) => void
}>()
</script>
