<template>
  <section class="embed-panel">
    <div class="embed-targets">
      <span class="embed-targets__label">嵌入到文档</span>
      <div
        ref="embedTargetPickerRef"
        class="embed-target-picker"
      >
        <input
          :value="modelValue"
          class="control control--embed-merged"
          placeholder="选择或输入目标文档 ID / 父块 ID"
          @focus="emit('refresh')"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        >
        <button
          class="embed-target-picker__toggle"
          data-embed-target-toggle
          type="button"
          aria-label="选择当前文档或历史 ID"
          :aria-expanded="embedTargetMenuOpen"
          @click="toggleEmbedTargetMenu"
        >
          <span
            class="embed-target-picker__chevron"
            :class="{ 'is-open': embedTargetMenuOpen }"
          >⌄</span>
        </button>
        <div
          v-if="embedTargetMenuOpen"
          class="embed-target-menu"
          data-embed-target-menu
        >
          <button
            v-if="currentDocumentTarget"
            class="embed-target-menu__item"
            data-embed-target-current
            type="button"
            @click="selectCurrentDocumentTarget"
          >
            <span class="embed-target-menu__eyebrow">当前文档</span>
            <strong>{{ currentDocumentTarget.title }}</strong>
            <small>{{ currentDocumentTarget.id }}</small>
          </button>
          <template v-if="otherOpenDocumentOptions.length">
            <div class="embed-target-menu__section">
              已打开文档
            </div>
            <button
              v-for="target in otherOpenDocumentOptions"
              :key="target.id"
              class="embed-target-menu__item"
              :data-embed-target-item="target.id"
              type="button"
              @click="selectTarget(target.id)"
            >
              <strong>{{ target.title || target.id }}</strong>
              <small>文档 · {{ target.id }}</small>
            </button>
          </template>
          <template v-if="recentTargetOptions.length">
            <div class="embed-target-menu__section">
              历史 ID
            </div>
            <button
              v-for="target in recentTargetOptions"
              :key="target.id"
              class="embed-target-menu__item"
              :data-embed-target-item="target.id"
              type="button"
              @click="selectTarget(target.id)"
            >
              <strong>{{ target.title || target.id }}</strong>
              <small>{{ target.type === 'document' ? '文档' : '块' }} · {{ target.id }}</small>
              <small v-if="target.content && target.content !== target.title">{{ target.content }}</small>
            </button>
          </template>
          <p
            v-if="!currentDocumentTarget && !otherOpenDocumentOptions.length && !recentTargetOptions.length"
            class="embed-target-menu__empty"
          >
            暂无当前文档、已打开文档或历史 ID，可直接输入。
          </p>
        </div>
      </div>
      <p class="muted muted--embed-target">
        {{ hint }}
      </p>
    </div>
    <button
      class="btn btn--embed"
      @click="emit('insert')"
    >
      <svg
        class="btn__icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3zm7 10l.8 2.2L22 16l-2.2.8L19 19l-.8-2.2L16 16l2.2-.8L19 13zM6 14l1.1 2.9L10 18l-2.9 1.1L6 22l-1.1-2.9L2 18l2.9-1.1L6 14z"
          fill="currentColor"
        />
      </svg>
      生成嵌入块
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"

import type { ActiveDocumentTarget, EmbedTargetPreview } from "@/core/embed-target"

const props = defineProps<{
  currentDocumentTarget: ActiveDocumentTarget | null
  hint: string
  modelValue: string
  openDocumentTargets: ActiveDocumentTarget[]
  recentTargets: EmbedTargetPreview[]
}>()

const emit = defineEmits<{
  insert: []
  refresh: []
  selectCurrent: []
  selectTarget: [targetId: string]
  "update:modelValue": [value: string]
}>()

const embedTargetMenuOpen = ref(false)
const embedTargetPickerRef = ref<HTMLElement | null>(null)
const otherOpenDocumentOptions = computed(() => props.openDocumentTargets.filter(target => target.id !== props.currentDocumentTarget?.id))
const recentTargetOptions = computed(() => {
  const excludedIds = new Set(props.openDocumentTargets.map(target => target.id))
  return props.recentTargets.filter(target => !excludedIds.has(target.id))
})

async function toggleEmbedTargetMenu() {
  if (!embedTargetMenuOpen.value) {
    emit("refresh")
  }
  embedTargetMenuOpen.value = !embedTargetMenuOpen.value
}

function selectCurrentDocumentTarget() {
  emit("selectCurrent")
  embedTargetMenuOpen.value = false
}

function selectTarget(targetId: string) {
  emit("selectTarget", targetId)
  embedTargetMenuOpen.value = false
}

function handleDocumentPointerDown(event: Event) {
  const picker = embedTargetPickerRef.value
  const target = event.target
  if (!picker || !(target instanceof Node) || picker.contains(target)) {
    return
  }
  embedTargetMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener("pointerdown", handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown)
})
</script>

<style lang="scss" scoped>
.embed-panel {
  margin-top: 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 18px 20px;
  border-radius: 20px;
  background: var(--sqb-surface-soft);
  border: 1px solid var(--sqb-border);
}

.embed-targets {
  display: grid;
  gap: 8px;
}

.embed-targets__label {
  color: var(--sqb-primary);
  font: 700 11px/1.2 var(--sqb-sans);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.embed-target-picker {
  position: relative;
}

.embed-target-picker__toggle {
  position: absolute;
  top: 4px;
  right: 4px;
  bottom: 4px;
  width: 38px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--sqb-text-muted);
  cursor: pointer;
  font: 600 16px/1 var(--sqb-sans);
}

.embed-target-picker__chevron {
  display: inline-block;
  transition: transform 0.2s ease;
}

.embed-target-picker__chevron.is-open {
  transform: rotate(180deg);
}

.embed-target-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 20;
  display: grid;
  gap: 6px;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
  box-shadow: var(--sqb-shadow-strong);
}

.embed-target-menu__section {
  padding: 4px 6px 0;
  color: var(--sqb-text-muted);
  font: 600 12px/1.4 var(--sqb-sans);
}

.embed-target-menu__item {
  display: grid;
  gap: 2px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: var(--sqb-surface-soft);
  color: var(--sqb-text);
  cursor: pointer;
  text-align: left;
}

.embed-target-menu__item:hover {
  background: var(--sqb-primary-soft);
}

.embed-target-menu__item strong {
  font: 600 13px/1.4 var(--sqb-sans);
}

.embed-target-menu__item small,
.embed-target-menu__eyebrow,
.embed-target-menu__empty {
  color: var(--sqb-text-muted);
  font: 12px/1.4 var(--sqb-sans);
}

.embed-target-menu__eyebrow {
  color: var(--sqb-primary);
}

.embed-target-menu__empty {
  margin: 0;
  padding: 8px 10px;
}

.muted {
  margin: 0;
  color: var(--sqb-text-muted);
  font: 13px/1.55 var(--sqb-sans);
}

.muted--embed-target {
  color: var(--sqb-text-muted);
}

.control {
  width: 100%;
  box-sizing: border-box;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--sqb-border);
  background: var(--sqb-surface-strong);
  color: var(--sqb-text);
  padding: 0 10px;
  font: 13px/1.4 var(--sqb-sans);
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.control::placeholder {
  color: var(--sqb-text-muted);
  opacity: 0.6;
}

.control:hover {
  border-color: var(--sqb-border-strong);
}

.control--embed-merged {
  min-width: 320px;
  padding-right: 50px;
}

.control:focus {
  outline: none;
  border-color: var(--sqb-primary);
  box-shadow: 0 0 0 3px var(--sqb-primary-soft);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  transition: background 80ms ease, border-color 80ms ease, color 80ms ease;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0 12px;
  background: transparent;
  cursor: pointer;
  font: 600 13px/1.2 var(--sqb-sans);
  white-space: nowrap;
}

.btn__icon {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.btn--embed {
  flex: 0 0 auto;
  background: var(--sqb-primary);
  color: #ffffff;
}

@media (max-width: 720px) {
  .embed-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .control--embed-merged {
    min-width: 100%;
  }
}
</style>
