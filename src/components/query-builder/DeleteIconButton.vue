<template>
  <button
    class="delete-icon-button"
    type="button"
    :title="title"
    :aria-label="ariaLabel || title"
  >
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M8.5 5.75h7M10 4.25h4c.55 0 1 .45 1 1v.5h3M5.5 5.75h3M7.5 7.75h9l-.7 9.1a1.8 1.8 0 0 1-1.79 1.65h-4a1.8 1.8 0 0 1-1.79-1.65zM10.25 10.5v4.75M13.75 10.5v4.75"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  ariaLabel?: string
}>()
</script>

<style lang="scss" scoped>
.delete-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--sqb-text-muted);
  cursor: pointer;
  flex: 0 0 auto;
  transition: color 140ms ease, opacity 140ms ease;
}

.delete-icon-button:hover {
  color: var(--sqb-danger);
}

.delete-icon-button:focus-visible {
  outline: 2px solid var(--sqb-danger);
  outline-offset: 2px;
  border-radius: 6px;
}

.delete-icon-button:disabled {
  cursor: default;
  opacity: 0.45;
}

.delete-icon-button svg {
  width: 17px;
  height: 17px;
  display: block;
}
</style>
