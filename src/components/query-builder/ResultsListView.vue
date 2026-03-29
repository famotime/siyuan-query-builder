<template>
  <ul class="list">
    <li
      v-for="item in items"
      :key="item.id"
      class="list__item"
      data-list-item
    >
      <div class="list__main">
        <button
          class="link"
          @click="openBlock(item.id)"
        >
          {{ previewTitle(item.title || "") || "未命名块" }}
        </button>
        <small
          v-if="item.meta.length"
          class="list__meta"
          data-list-item-meta
        >{{ item.meta.join(" · ") }}</small>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { ListItemModel } from "@/inline/view-models"
import { truncatePreviewText } from "@/core/view/preview-text"

defineProps<{
  items: ListItemModel[]
  openBlock: (blockId: string) => void
}>()

function previewTitle(title: string) {
  return truncatePreviewText(title)
}
</script>
