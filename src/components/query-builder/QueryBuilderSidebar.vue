<template>
  <aside class="sidebar">
    <div class="card card--dark">
      <p class="eyebrow">
        Siyuan Query Builder
      </p>
      <h1>把查询变成工作界面</h1>
      <p class="muted muted--light">
        先定义要看什么，再切成表格或看板，并直接回写原始块属性。
      </p>
      <div class="actions">
        <button
          class="btn btn--ghost"
          @click="store.resetDraft"
        >
          新建查询
        </button>
        <button
          class="btn btn--solid"
          :disabled="store.loading"
          @click="store.runQuery"
        >
          {{ store.loading ? "运行中..." : "运行查询" }}
        </button>
      </div>
    </div>

    <div class="card card--dark">
      <div class="section-head">
        <h2>预设场景</h2>
      </div>
      <button
        v-for="preset in store.presets"
        :key="preset.id"
        class="item"
        @click="store.applySnapshot(preset.snapshot)"
      >
        <strong>{{ preset.title }}</strong>
        <span>{{ preset.description }}</span>
      </button>
    </div>

    <div class="card card--dark">
      <div class="section-head">
        <h2>已保存模板</h2>
        <span class="pill">{{ store.savedTemplates.length }}</span>
      </div>
      <button
        v-for="snapshot in store.savedTemplates"
        :key="snapshot.template.id"
        class="item item--row"
        @click="store.applySnapshot(snapshot)"
      >
        <strong>{{ snapshot.template.name }}</strong>
        <span>{{ snapshot.view.type === "board" ? "看板" : "表格" }}</span>
      </button>
      <p
        v-if="!store.savedTemplates.length"
        class="muted muted--light"
      >
        先保存一个查询模板。
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useQueryBuilderStore } from "@/composables/query-builder-store"

const store = useQueryBuilderStore()
</script>

<style lang="scss" scoped>
.sidebar {
  overflow: auto;
  padding: 24px 18px;
  background: linear-gradient(180deg, rgba(32, 27, 22, 0.96), rgba(48, 40, 34, 0.98));
  color: #f8f1e6;
}

.card {
  padding: 18px;
  border-radius: 20px;
  margin-bottom: 16px;
}

.card--dark {
  background: rgba(255, 248, 236, 0.07);
  border: 1px solid rgba(255, 248, 236, 0.12);
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font: 700 11px/1.3 "Trebuchet MS", "Microsoft YaHei", sans-serif;
  opacity: 0.72;
}

h1,
h2 {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
}

h1 {
  font-size: 30px;
  line-height: 1.06;
}

.muted {
  margin: 0;
  color: rgba(248, 241, 230, 0.72);
  font: 14px/1.5 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.actions,
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.actions {
  margin-top: 14px;
}

.btn,
.item {
  transition: transform 140ms ease;
  border: none;
  cursor: pointer;
  font: 600 13px/1.2 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

.btn:hover,
.item:hover {
  transform: translateY(-1px);
}

.btn {
  border-radius: 999px;
  padding: 11px 16px;
}

.btn--solid {
  background: linear-gradient(135deg, #ce5b0a, #f27e22);
  color: #fff7ef;
}

.btn--ghost {
  background: transparent;
  color: inherit;
  border: 1px solid rgba(255, 248, 236, 0.16);
}

.item {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  border-radius: 16px;
  padding: 14px;
  margin-top: 10px;
  background: rgba(255, 248, 236, 0.06);
  color: inherit;
}

.item--row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.pill {
  min-width: 24px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(242, 126, 34, 0.18);
  color: #f7d9bd;
  text-align: center;
  font: 700 12px/1.2 "Trebuchet MS", "Microsoft YaHei", sans-serif;
}

@media (max-width: 720px) {
  .sidebar {
    padding: 16px;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
