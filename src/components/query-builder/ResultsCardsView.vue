<template>
  <div class="cards">
    <article
      v-for="card in cards"
      :key="card.label"
      class="cards__item"
    >
      <strong>{{ card.value }}</strong>
      <span>{{ card.label }}</span>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { SummaryCard } from "@/inline/view-models"

defineProps<{
  cards: SummaryCard[]
}>()
</script>
