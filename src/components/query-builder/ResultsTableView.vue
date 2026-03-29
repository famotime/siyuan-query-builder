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
              {{ previewContent(row, field) || "打开原始块" }}
            </button>
            <span v-else-if="field === 'content'">{{ previewContent(row, field) || "—" }}</span>
            <select
              v-else-if="resolveEditableField(field) === 'status'"
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
              v-else-if="resolveEditableField(field) === 'priority'"
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
              v-else-if="resolveEditableField(field) === 'dueDate'"
              class="control control--compact"
              type="date"
              :value="displayValue(row, field)"
              @change="quickEdit(row.id, 'dueDate', ($event.target as HTMLInputElement).value)"
            >
            <input
              v-else-if="isCustomAttributeTextField(field)"
              class="control control--compact"
              type="text"
              :value="displayValue(row, field)"
              @change="onTextFieldChange(row.id, field, ($event.target as HTMLInputElement).value)"
            >
            <span v-else>{{ displayValue(row, field) || "—" }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { EditableField } from "@/composables/query-builder-store/shared"
import type { ResultRow } from "@/core/query/types"
import { truncatePreviewText } from "@/core/view/preview-text"

const props = defineProps<{
  resultFields: string[]
  rows: ResultRow[]
  fieldLabel: (field: string) => string
  canOpenRow: (row: ResultRow) => boolean
  displayValue: (row: ResultRow, field: string) => string
  editableField: (field: string) => EditableField | null
  quickEdit: (rowId: string, field: EditableField, value: string) => void | Promise<void>
  openBlock: (blockId: string) => void
}>()

function resolveEditableField(field: string) {
  return props.editableField(field)
}

function isCustomAttributeTextField(field: string) {
  const editable = resolveEditableField(field)
  return Boolean(editable?.startsWith("attr:"))
}

function onTextFieldChange(rowId: string, field: string, value: string) {
  const editable = resolveEditableField(field)
  if (!editable) {
    return
  }

  void props.quickEdit(rowId, editable, value)
}

function previewContent(row: ResultRow, field: string) {
  return truncatePreviewText(props.displayValue(row, field))
}
</script>
