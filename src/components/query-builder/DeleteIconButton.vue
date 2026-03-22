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
        d="M9.75 3.75h4.5c.83 0 1.5.67 1.5 1.5v1.5h3.5M5.25 6.75h13.5M8.25 6.75l.67 11.01c.05.84.75 1.49 1.59 1.49h3c.84 0 1.54-.65 1.59-1.49l.67-11.01M10.5 10.25v5.5M13.5 10.25v5.5"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.8"
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
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: color-mix(in srgb, var(--sqb-danger) 82%, white);
  cursor: pointer;
  flex: 0 0 auto;
  transition: color 140ms ease, opacity 140ms ease, transform 140ms ease;
}

.delete-icon-button:hover {
  color: var(--sqb-danger);
  transform: translateY(-1px);
}

.delete-icon-button:focus-visible {
  outline: 2px solid rgba(184, 50, 48, 0.22);
  outline-offset: 2px;
  border-radius: 10px;
}

.delete-icon-button:disabled {
  cursor: default;
  opacity: 0.45;
  transform: none;
}

.delete-icon-button svg {
  width: 18px;
  height: 18px;
  display: block;
}
</style>
