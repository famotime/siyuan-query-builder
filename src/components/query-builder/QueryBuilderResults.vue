<template>
  <section class="results">
    <article class="card">
      <div class="section-head">
        <div>
          <h3>结果面板</h3>
          <p class="muted">
            {{ store.resultSummary }}
          </p>
        </div>
        <div class="actions">
          <div class="embed-targets">
            <select
              class="control control--embed-select"
              :value="store.embedParentId === store.currentDocumentTarget?.id ? store.currentDocumentTarget.id : ''"
              @focus="store.refreshCurrentDocumentTarget"
              @change="($event) => ($event.target as HTMLSelectElement).value && store.selectCurrentDocumentTarget()"
            >
              <option value="">
                选择当前打开文档
              </option>
              <option
                v-if="store.currentDocumentTarget"
                :value="store.currentDocumentTarget.id"
              >
                {{ store.currentDocumentTarget.title }} · {{ store.currentDocumentTarget.id }}
              </option>
            </select>
            <input
              v-model="store.embedParentId"
              class="control control--embed"
              placeholder="父块或文档 ID"
            >
            <p class="muted muted--embed-target">
              {{ store.embedTargetHint }}
            </p>
          </div>
          <button
            class="btn btn--ghost btn--small"
            @click="store.insertEmbed"
          >
            生成嵌入块
          </button>
        </div>
      </div>

      <div
        v-if="store.error"
        class="alert"
      >
        {{ store.error }}
      </div>

      <div
        v-if="store.advancedMode"
        class="sql-box"
      >
        <pre>{{ store.advancedSql || "运行查询后会显示生成后的 SQL 表达。" }}</pre>
      </div>

      <div
        v-if="!store.resultSet?.rows.length"
        class="empty"
      >
        <h4>结果会在这里出现</h4>
        <p>运行查询后，可切换表格、看板、列表或统计卡片，并直接编辑状态、日期、优先级。</p>
      </div>

      <div
        v-else-if="store.draft.view.type === 'table'"
        class="table-wrap"
      >
        <table class="table">
          <thead>
            <tr>
              <th
                v-for="field in store.draft.template.fields"
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
                v-for="field in store.draft.template.fields"
                :key="`${row.id}-${field}`"
              >
                <button
                  v-if="field === 'content'"
                  class="link"
                  @click="store.openBlock(row.id)"
                >
                  {{ store.displayValue(row, field) || "打开原始块" }}
                </button>
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
    </article>
  </section>
</template>

<script setup lang="ts">
import { useQueryBuilderStore } from "@/composables/query-builder-store"

const store = useQueryBuilderStore()
</script>

<style lang="scss" scoped>
.results {
  margin-top: 18px;
}

.card {
  min-height: calc(100vh - 114px);
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 251, 245, 0.9);
  border: 1px solid rgba(59, 46, 32, 0.12);
  box-shadow: 0 18px 48px rgba(87, 63, 33, 0.08);
}

.section-head,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

h3,
h4 {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
}

.muted {
  margin: 0;
  color: rgba(32, 26, 21, 0.68);
  font: 14px/1.5 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.control {
  width: 100%;
  box-sizing: border-box;
  border-radius: 14px;
  border: 1px solid rgba(59, 46, 32, 0.16);
  background: rgba(255, 255, 255, 0.78);
  color: #201a15;
  padding: 11px 13px;
  font: 14px/1.4 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.control--compact {
  min-width: 120px;
  padding: 8px 10px;
}

.control--embed {
  min-width: 220px;
}

.control--embed-select {
  min-width: 280px;
}

.control:focus {
  outline: none;
  border-color: rgba(208, 93, 13, 0.46);
  box-shadow: 0 0 0 3px rgba(242, 126, 34, 0.12);
}

.btn {
  border: none;
  border-radius: 12px;
  padding: 8px 12px;
  background: transparent;
  cursor: pointer;
  font: 600 13px/1.2 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.btn--ghost {
  border: 1px solid rgba(59, 46, 32, 0.16);
}

.embed-targets {
  display: grid;
  gap: 8px;
  min-width: min(520px, 100%);
}

.muted--embed-target {
  font-size: 13px;
}

.alert {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(177, 39, 22, 0.12);
  color: #8f2417;
  font: 14px/1.45 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.sql-box {
  margin-top: 14px;
}

.sql-box pre {
  margin: 0;
  padding: 14px;
  border-radius: 16px;
  background: #201a15;
  color: #f8f1e6;
  white-space: pre-wrap;
  word-break: break-word;
  font: 12px/1.55 "Consolas", "Courier New", monospace;
}

.empty {
  min-height: 320px;
  margin-top: 14px;
  display: grid;
  place-items: center;
  text-align: center;
  border-radius: 18px;
  border: 1px dashed rgba(59, 46, 32, 0.18);
  background: rgba(255, 255, 255, 0.44);
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
  padding: 14px 12px;
  border-bottom: 1px solid rgba(59, 46, 32, 0.08);
  text-align: left;
  vertical-align: top;
  font: 14px/1.45 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.table th {
  position: sticky;
  top: 0;
  background: rgba(248, 241, 230, 0.98);
}

.link {
  padding: 0;
  border: none;
  background: transparent;
  color: #b54a08;
  cursor: pointer;
  text-align: left;
  font: 600 14px/1.45 "Trebuchet MS", "Microsoft YaHei", sans-serif;
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
  gap: 14px;
  overflow-x: auto;
}

.board__column {
  min-height: 320px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(59, 46, 32, 0.08);
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
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(252, 243, 228, 0.88));
  border: 1px solid rgba(208, 93, 13, 0.12);
  cursor: grab;
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
  background: rgba(242, 126, 34, 0.12);
  color: #7b3404;
  font: 600 12px/1.2 "Trebuchet MS", "Microsoft YaHei", sans-serif;
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
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(59, 46, 32, 0.08);
}

.list__item small,
.cards__item span {
  color: rgba(32, 26, 21, 0.68);
  font: 13px/1.4 "Trebuchet MS", "Microsoft YaHei", sans-serif;
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
  font: 700 28px/1 Georgia, "Times New Roman", serif;
  color: #a24004;
}

@media (max-width: 720px) {
  .section-head,
  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .embed-targets {
    min-width: 100%;
  }
}
</style>
