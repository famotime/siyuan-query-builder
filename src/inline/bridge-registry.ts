import type { InlineEmbedPayload } from "@/core/embed"

type DisposeFn = () => void

interface BridgeRegistryOptions {
  mount: (element: HTMLElement, payload: InlineEmbedPayload) => Promise<DisposeFn | void>
  onError: (element: HTMLElement, error: unknown) => void
}

export function createInlineBridgeRegistry(options: BridgeRegistryOptions) {
  const mounted = new Map<HTMLElement, DisposeFn | undefined>()

  return {
    bridge: {
      renderHost: async (element: HTMLElement, payload: InlineEmbedPayload) => {
        const currentDispose = mounted.get(element)
        currentDispose?.()
        mounted.delete(element)

        try {
          const dispose = await options.mount(element, payload)
          mounted.set(element, dispose || undefined)
        } catch (error) {
          options.onError(element, error)
        }
      },
    },
    destroy() {
      for (const dispose of mounted.values()) {
        dispose?.()
      }
      mounted.clear()
    },
  }
}
