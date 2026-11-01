import type { Directive, DirectiveBinding } from "vue"

let tooltipElement: HTMLElement | null = null
let currentTarget: HTMLElement | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null
let showTimer: ReturnType<typeof setTimeout> | null = null

function ensureTooltipElement(): HTMLElement {
  if (typeof document === "undefined") {
    return {} as HTMLElement
  }
  let el = document.getElementById("sqb-tooltip-root")
  if (!el) {
    el = document.createElement("div")
    el.id = "sqb-tooltip-root"
    el.className = "sqb-tooltip-bubble"
    el.setAttribute("role", "tooltip")
    el.setAttribute("aria-hidden", "true")
    document.body.appendChild(el)
  }
  return el
}

export interface TooltipOptions {
  content: string
  placement?: "top" | "bottom" | "left" | "right"
}

export function showTooltip(target: HTMLElement, content: string, placement: "top" | "bottom" = "top") {
  if (typeof document === "undefined" || !target || !content) return

  // 1. 消除原生 HTML title 属性导致的双重 Tooltip 弹出
  if (target.hasAttribute("title")) {
    const rawTitle = target.getAttribute("title") || ""
    if (rawTitle) {
      target.dataset.sqbNativeTitle = rawTitle
      target.removeAttribute("title")
    }
  }

  // 2. 保证 accessibility
  if (!target.getAttribute("aria-label")) {
    target.setAttribute("aria-label", content)
  }

  currentTarget = target
  tooltipElement = ensureTooltipElement()
  const el = tooltipElement
  el.textContent = content

  // 测量位置
  el.style.visibility = "hidden"
  el.style.display = "block"
  el.style.opacity = "0"
  el.style.transform = "scale(0.96)"

  const targetRect = target.getBoundingClientRect()
  const tooltipRect = el.getBoundingClientRect()

  const gap = 6
  let actualPlacement = placement

  // 垂直碰撞翻转检测
  if (actualPlacement === "top" && targetRect.top - tooltipRect.height - gap < 4) {
    actualPlacement = "bottom"
  } else if (actualPlacement === "bottom" && targetRect.bottom + tooltipRect.height + gap > window.innerHeight - 4) {
    actualPlacement = "top"
  }

  let top = 0
  let left = 0

  if (actualPlacement === "top") {
    top = targetRect.top - tooltipRect.height - gap
  } else {
    top = targetRect.bottom + gap
  }

  // 水平居中并限制在屏幕安全边界内
  left = targetRect.left + (targetRect.width - tooltipRect.width) / 2
  const minLeft = 8
  const maxLeft = Math.max(minLeft, (window.innerWidth || document.documentElement.clientWidth) - tooltipRect.width - 8)
  left = Math.max(minLeft, Math.min(maxLeft, left))

  el.style.top = `${Math.round(top)}px`
  el.style.left = `${Math.round(left)}px`
  el.style.visibility = "visible"
  el.style.opacity = "1"
  el.style.transform = "scale(1)"
  el.setAttribute("aria-hidden", "false")
}

export function hideTooltip() {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  if (!tooltipElement && typeof document !== "undefined") {
    tooltipElement = document.getElementById("sqb-tooltip-root")
  }
  if (tooltipElement) {
    tooltipElement.style.opacity = "0"
    tooltipElement.style.transform = "scale(0.96)"
    tooltipElement.style.visibility = "hidden"
    tooltipElement.setAttribute("aria-hidden", "true")
  }

  // 鼠标移开时，若原本有 title 属性，按需恢复以保证测试与 DOM 属性完整
  if (currentTarget && currentTarget.dataset.sqbNativeTitle) {
    currentTarget.setAttribute("title", currentTarget.dataset.sqbNativeTitle)
  }
  currentTarget = null
}

function resolveTooltipText(el: HTMLElement, binding: DirectiveBinding): string {
  if (typeof binding.value === "string") {
    return binding.value
  }
  if (binding.value && typeof binding.value === "object" && binding.value.content) {
    return String(binding.value.content)
  }
  return el.getAttribute("data-sqb-tooltip") || el.getAttribute("title") || el.dataset.sqbNativeTitle || ""
}

export const vSqbTooltip: Directive<HTMLElement, string | TooltipOptions> = {
  mounted(el, binding) {
    const text = resolveTooltipText(el, binding)
    if (!el.getAttribute("aria-label") && text) {
      el.setAttribute("aria-label", text)
    }

    const onEnter = () => {
      const content = resolveTooltipText(el, binding)
      if (!content) return
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }
      showTimer = setTimeout(() => {
        showTooltip(el, content)
      }, 140)
    }

    const onLeave = () => {
      if (showTimer) {
        clearTimeout(showTimer)
        showTimer = null
      }
      hideTimer = setTimeout(() => {
        hideTooltip()
      }, 40)
    }

    el.addEventListener("pointerenter", onEnter)
    el.addEventListener("mouseenter", onEnter)
    el.addEventListener("pointerleave", onLeave)
    el.addEventListener("mouseleave", onLeave)
    el.addEventListener("focusin", onEnter)
    el.addEventListener("focusout", onLeave)
    el.addEventListener("click", onLeave)

    ;(el as any).__sqbTooltipCleanup = () => {
      el.removeEventListener("pointerenter", onEnter)
      el.removeEventListener("mouseenter", onEnter)
      el.removeEventListener("pointerleave", onLeave)
      el.removeEventListener("mouseleave", onLeave)
      el.removeEventListener("focusin", onEnter)
      el.removeEventListener("focusout", onLeave)
      el.removeEventListener("click", onLeave)
    }
  },
  updated(el, binding) {
    const text = resolveTooltipText(el, binding)
    if (text) {
      el.setAttribute("aria-label", text)
      if (currentTarget === el) {
        showTooltip(el, text)
      }
    }
  },
  unmounted(el) {
    if (currentTarget === el) {
      hideTooltip()
    }
    if ((el as any).__sqbTooltipCleanup) {
      ;(el as any).__sqbTooltipCleanup()
      delete (el as any).__sqbTooltipCleanup
    }
  },
}
