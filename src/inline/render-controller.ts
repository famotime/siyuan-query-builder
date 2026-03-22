import { parseInlineEmbedPayload } from "@/core/embed"

type DisposeFn = () => void

export function createInlineRenderController(options: {
  mount: (element: HTMLElement, payload: ReturnType<typeof parseInlineEmbedPayload>) => Promise<DisposeFn | void> | DisposeFn | void
  selector?: string
}) {
  const selector = options.selector || "[data-sqb-inline]"
  const mounted = new Map<HTMLElement, DisposeFn | undefined>()

  return {
    async scan(root: ParentNode) {
      const elements: HTMLElement[] = []
      if (root instanceof HTMLElement && root.matches(selector)) {
        elements.push(root)
      }
      elements.push(...[...root.querySelectorAll(selector)] as HTMLElement[])
      for (const element of elements) {
        if (mounted.has(element)) {
          continue
        }
        const payload = parseInlineEmbedPayload(element)
        if (!payload) {
          continue
        }
        const dispose = await options.mount(element, payload)
        mounted.set(element, dispose || undefined)
      }
    },
    cleanup() {
      for (const [element, dispose] of mounted.entries()) {
        if (element.isConnected) {
          continue
        }
        dispose?.()
        mounted.delete(element)
      }
    },
    destroy() {
      for (const [element, dispose] of mounted.entries()) {
        dispose?.()
        mounted.delete(element)
      }
    },
  }
}
