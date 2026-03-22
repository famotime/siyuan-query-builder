<template>
  <button
    class="sy-button"
    :class="`sy-button--${variant}`"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot>Button</slot>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
}>()
</script>

<style scoped>
.sy-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  font: 600 13px/1.2 var(--sqb-sans);
  cursor: pointer;
  white-space: nowrap;
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
}

.sy-button:disabled {
  opacity: 0.4;
  pointer-events: none;
}

.sy-button:focus-visible {
  outline: 2px solid var(--sqb-primary);
  outline-offset: 2px;
}

/* Primary */
.sy-button--primary {
  background: var(--sqb-primary);
  color: #ffffff;
  border-color: transparent;
}
.sy-button--primary:hover {
  background: var(--sqb-primary-strong);
}
.sy-button--primary:active {
  background: var(--sqb-primary-strong);
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.15);
}

/* Secondary (outline) */
.sy-button--secondary,
.sy-button:not([class*='sy-button--']) {
  background: transparent;
  color: var(--sqb-text);
  border-color: var(--sqb-border-strong);
}
.sy-button--secondary:hover {
  background: var(--sqb-bg-strong);
}
.sy-button--secondary:active {
  background: var(--sqb-bg-strong);
  border-color: var(--sqb-primary);
}

/* Ghost */
.sy-button--ghost {
  background: transparent;
  color: var(--sqb-text-muted);
  border-color: transparent;
}
.sy-button--ghost:hover {
  background: var(--sqb-bg-strong);
  color: var(--sqb-text);
}
.sy-button--ghost:active {
  background: var(--sqb-primary-soft);
  color: var(--sqb-primary);
}

/* Danger */
.sy-button--danger {
  background: var(--sqb-danger);
  color: #ffffff;
  border-color: transparent;
}
.sy-button--danger:hover {
  filter: brightness(1.1);
}
</style>
