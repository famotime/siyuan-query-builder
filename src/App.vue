<template>
  <section class="panel">
    <template v-if="bootError">
      <main class="workspace workspace--boot-error">
        <section class="boot-error">
          <p class="boot-error__eyebrow">
            siyuan-query-builder
          </p>
          <h2>面板初始化失败</h2>
          <pre>{{ bootError }}</pre>
        </section>
      </main>
    </template>
    <template v-else>
      <QueryBuilderSidebar />
      <main class="workspace">
        <div class="workspace__topbar">
          <QueryBuilderTopbar />
        </div>
        <div class="workspace__scroll">
          <QueryBuilderEditor />
          <QueryBuilderResults />
        </div>
      </main>
    </template>
  </section>
</template>

<script setup lang="ts">
import { onErrorCaptured, onMounted, provide, ref } from "vue"

import QueryBuilderEditor from "@/components/query-builder/QueryBuilderEditor.vue"
import QueryBuilderResults from "@/components/query-builder/QueryBuilderResults.vue"
import QueryBuilderSidebar from "@/components/query-builder/QueryBuilderSidebar.vue"
import QueryBuilderTopbar from "@/components/query-builder/QueryBuilderTopbar.vue"
import { createQueryBuilderStore, queryBuilderStoreKey } from "@/composables/query-builder-store"

const store = createQueryBuilderStore()
const bootError = ref("")

provide(queryBuilderStoreKey, store)

onMounted(async () => {
  try {
    await store.initialize()
  } catch (error) {
    bootError.value = error instanceof Error ? error.stack || error.message : String(error)
    console.error("[siyuan-query-builder] panel initialization failed", error)
  }
})

onErrorCaptured((error, instance, info) => {
  bootError.value = error instanceof Error
    ? `${info}\n\n${error.stack || error.message}`
    : `${info}\n\n${String(error)}`
  console.error("[siyuan-query-builder] panel render error", error, info, instance)
  return false
})
</script>

<style lang="scss" scoped>
.panel {
  height: 100%;
  min-height: 100%;
  display: grid;
  grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
  color: var(--sqb-text);
  overflow: hidden;
}

.workspace {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  overflow: hidden;
  min-height: 0;
  padding: 20px 24px 28px;
}

.workspace::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 12% 10%, rgba(74, 124, 89, 0.08), transparent 26%),
    radial-gradient(circle at 88% 4%, rgba(196, 166, 106, 0.18), transparent 20%);
  opacity: 0.95;
}

.workspace > * {
  position: relative;
  z-index: 1;
}

.workspace__topbar {
  flex: 0 0 auto;
}

.workspace__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-right: 6px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.workspace--boot-error {
  display: flex;
  align-items: center;
  justify-content: center;
}

.boot-error {
  max-width: 720px;
  padding: 28px;
  border-radius: 20px;
  background: var(--sqb-surface);
  border: 1px solid var(--sqb-border);
  box-shadow: var(--sqb-shadow-strong);
}

.boot-error__eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font: 700 11px/1.2 var(--sqb-sans);
  color: var(--sqb-text-muted);
}

.boot-error h2 {
  margin: 0 0 12px;
  font: 700 30px/1.08 var(--sqb-serif);
  color: var(--sqb-text);
}

.boot-error pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font: 13px/1.55 Consolas, "Courier New", monospace;
  color: #5f4430;
}

@media (max-width: 1100px) {
  .panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .workspace {
    padding: 16px;
    gap: 16px;
  }

  .workspace__scroll {
    padding-right: 0;
  }
}
</style>
