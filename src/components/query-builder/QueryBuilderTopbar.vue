<template>
  <header class="topbar card">
    <div class="topbar__draft-line">
      <h2 class="topbar__title">
        查询草稿
      </h2>
      <input
        v-model="store.draft.template.name"
        class="title-input"
        placeholder="未命名查询..."
      >
    </div>
    <div class="actions">
      <span
        class="dirty-indicator"
        :class="{ 'dirty-indicator--saved': !store.isDirty }"
      >{{ store.isDirty ? store.t("dirtyUnsaved") : store.t("dirtySaved") }}</span>
      <button
        class="btn btn--ghost"
        data-topbar-reset
        type="button"
        @click="store.resetDraft"
      >
        <Plus
          class="btn__icon"
          :size="16"
          :stroke-width="1.75"
        />
        新建查询
      </button>
      <button
        class="btn btn--ghost"
        :disabled="store.saving"
        type="button"
        @click="store.saveTemplate"
      >
        <Save
          class="btn__icon"
          :size="16"
          :stroke-width="1.75"
        />
        {{ store.saving ? "保存中..." : "保存模板" }}
      </button>
      <button
        class="btn btn--solid"
        :disabled="store.loading"
        @click="store.runQuery"
      >
        <Play
          class="btn__icon"
          :size="16"
          :stroke-width="1.75"
        />
        {{ store.loading ? "运行中..." : "运行查询" }}
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Play, Plus, Save } from 'lucide-vue-next'
import { useQueryBuilderStore } from "@/composables/query-builder-store"

const store = useQueryBuilderStore()
</script>

<style lang="scss" scoped>
.topbar,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.topbar {
  padding: 14px 18px;
  border-radius: 24px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  box-shadow: var(--sqb-shadow-soft);
  backdrop-filter: blur(18px);
}

.topbar__draft-line {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  gap: 18px;
}

.topbar__title {
  margin: 0;
  flex: 0 0 auto;
  color: var(--sqb-primary);
  font: 700 18px/1.2 var(--sqb-serif);
  white-space: nowrap;
}

.title-input {
  width: 100%;
  box-sizing: border-box;
  flex: 1 1 360px;
  min-width: 220px;
  max-width: 680px;
  height: 32px;
  background: var(--sqb-surface-strong);
  border: 1px solid var(--sqb-border);
  padding: 0 10px;
  border-radius: 8px;
  color: var(--sqb-text);
  font: 13px/1.4 var(--sqb-sans);
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.title-input::placeholder {
  color: var(--sqb-text-muted);
  opacity: 0.6;
}

.title-input:hover {
  border-color: var(--sqb-border-strong);
}

.title-input:focus {
  outline: none;
  border-color: var(--sqb-primary);
  box-shadow: 0 0 0 3px var(--sqb-primary-soft);
}

.dirty-indicator {
  flex: 0 0 auto;
  font: 600 11px/1.2 var(--sqb-sans);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sqb-primary);
}

.dirty-indicator--saved {
  color: var(--sqb-text-muted);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  flex: 0 0 auto;
  transition: background 80ms ease, border-color 80ms ease, color 80ms ease;
  cursor: pointer;
  white-space: nowrap;
  border-radius: 8px;
  padding: 0 12px;
  border: 1px solid transparent;
  font: 600 13px/1.2 var(--sqb-sans);
}

.btn--solid {
  background: var(--sqb-primary);
  color: #ffffff;
}

.btn--solid:hover {
  background: var(--sqb-primary-strong);
}

.btn--ghost {
  background: transparent;
  color: var(--sqb-text-muted);
  border-color: transparent;
}

.btn--ghost:hover {
  background: var(--sqb-bg-strong);
  color: var(--sqb-text);
}

.btn__icon {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.actions {
  flex: 0 0 auto;
  flex-wrap: nowrap;
  gap: 10px;
}

.actions > * {
  flex-shrink: 0;
}

@media (max-width: 1260px) {
  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .topbar__draft-line,
  .actions {
    width: 100%;
  }

  .actions {
    justify-content: flex-end;
  }
}

@media (max-width: 720px) {
  .topbar,
  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .topbar {
    padding: 16px;
  }

  .topbar__draft-line {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .title-input {
    min-width: 100%;
    max-width: none;
    font-size: 16px;
  }

  .btn--solid,
  .btn--ghost {
    width: 100%;
  }
}
</style>
