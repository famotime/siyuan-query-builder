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
      <button
        class="btn btn--ghost"
        data-topbar-reset
        type="button"
        @click="store.resetDraft"
      >
        新建查询
      </button>
      <button
        class="btn btn--ghost"
        :disabled="store.saving"
        type="button"
        @click="store.saveTemplate"
      >
        <svg
          class="btn__icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M5 4h11l3 3v13H5V4zm2 2v12h10V8.2L15.8 6H15v4H9V6H7zm4 0v2h2V6h-2z"
            fill="currentColor"
          />
        </svg>
        {{ store.saving ? "保存中..." : "保存模板" }}
      </button>
      <button
        class="btn btn--solid"
        :disabled="store.loading"
        @click="store.runQuery"
      >
        <svg
          class="btn__icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M8 6l10 6-10 6V6z"
            fill="currentColor"
          />
        </svg>
        {{ store.loading ? "运行中..." : "运行查询" }}
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
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
  padding: 18px 22px;
  border-radius: 28px;
  background: rgba(250, 247, 242, 0.94);
  border: 1px solid rgba(116, 121, 110, 0.12);
  box-shadow: 0 12px 28px rgba(57, 61, 52, 0.08);
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
  font: 700 28px/1.05 var(--sqb-serif);
  white-space: nowrap;
}

.title-input {
  width: 100%;
  box-sizing: border-box;
  border: none;
  flex: 1 1 360px;
  min-width: 220px;
  max-width: 680px;
  background: rgba(245, 241, 234, 0.98);
  padding: 12px 20px;
  border-radius: 999px;
  color: var(--sqb-secondary);
  font: 600 18px/1.2 var(--sqb-sans);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  transition: box-shadow 140ms ease, background 140ms ease;
}

.title-input:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(74, 124, 89, 0.12);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex: 0 0 auto;
  transition: transform 140ms ease, background 140ms ease, border-color 140ms ease, color 140ms ease;
  cursor: pointer;
  white-space: nowrap;
  border-radius: 16px;
  padding: 12px 18px;
  border: 1px solid transparent;
  font: 600 13px/1.2 var(--sqb-sans);
}

.btn:hover {
  transform: translateY(-1px);
}

.btn--solid {
  min-width: 148px;
  border-radius: 24px;
  background: var(--sqb-primary);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(74, 124, 89, 0.18);
}

.btn--ghost {
  background: transparent;
  color: var(--sqb-primary);
  border-color: transparent;
  box-shadow: none;
}

.btn__icon {
  width: 18px;
  height: 18px;
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
