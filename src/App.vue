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
        <QueryBuilderEditor />
        <QueryBuilderResults />
      </main>
    </template>
  </section>
</template>

<script setup lang="ts">
import { onErrorCaptured, onMounted, provide, ref } from "vue"

import QueryBuilderEditor from "@/components/query-builder/QueryBuilderEditor.vue"
import QueryBuilderResults from "@/components/query-builder/QueryBuilderResults.vue"
import QueryBuilderSidebar from "@/components/query-builder/QueryBuilderSidebar.vue"
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
  min-height: 100%;
  display: grid;
  grid-template-columns: 320px 1fr;
  background: linear-gradient(135deg, #f8f1e6, #fffefb 56%, #ece0c8);
}

.workspace {
  overflow: auto;
  min-height: 0;
  padding: 24px;
  background-image:
    linear-gradient(rgba(59, 46, 32, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 46, 32, 0.04) 1px, transparent 1px);
  background-size: 24px 24px;
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
  background: rgba(255, 252, 245, 0.92);
  border: 1px solid rgba(59, 46, 32, 0.12);
  box-shadow: 0 18px 42px rgba(30, 22, 14, 0.12);
}

.boot-error__eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font: 700 11px/1.2 "Trebuchet MS", "Microsoft YaHei", sans-serif;
  color: rgba(59, 46, 32, 0.66);
}

.boot-error h2 {
  margin: 0 0 12px;
  font: 700 28px/1.1 Georgia, "Times New Roman", serif;
  color: #241d17;
}

.boot-error pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font: 13px/1.55 Consolas, "Courier New", monospace;
  color: #5c2a04;
}

@media (max-width: 1100px) {
  .panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .workspace {
    padding: 16px;
  }
}
</style>
