<template>
  <label class="sy-checkbox">
    <input
      class="sy-checkbox__input"
      type="checkbox"
      :checked="modelValue"
      v-bind="$attrs"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="sy-checkbox__track" />
  </label>
</template>

<script setup lang="ts">
defineProps(['modelValue'])
defineEmits(['update:modelValue'])
</script>

<style scoped>
.sy-checkbox {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.sy-checkbox__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.sy-checkbox__track {
  display: inline-block;
  width: 32px;
  height: 18px;
  border-radius: 9999px;
  background: var(--sqb-border-strong);
  position: relative;
  transition: background 140ms ease;
  flex-shrink: 0;
}

.sy-checkbox__track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: #ffffff;
  transition: transform 140ms ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.18);
}

.sy-checkbox__input:checked + .sy-checkbox__track {
  background: var(--sqb-primary);
}

.sy-checkbox__input:checked + .sy-checkbox__track::after {
  transform: translateX(14px);
}

.sy-checkbox__input:focus-visible + .sy-checkbox__track {
  outline: 2px solid var(--sqb-primary);
  outline-offset: 2px;
}

.sy-checkbox:has(.sy-checkbox__input:disabled) {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
