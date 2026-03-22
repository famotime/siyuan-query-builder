import { SQB_EMBED_BRIDGE_KEY } from "@/core/embed"

interface EventBusHost {
  eventBus: {
    on: (name: string, handler: (...args: unknown[]) => void) => void
    off: (name: string, handler: (...args: unknown[]) => void) => void
  }
}

interface ScanLifecycleOptions {
  plugin: EventBusHost
  bridge: Window[typeof SQB_EMBED_BRIDGE_KEY]
  runScan: (root: ParentNode) => void
}

export function createInlineScanLifecycle(options: ScanLifecycleOptions) {
  let frame = 0
  let started = false
  let scheduledRoot: ParentNode = document.body
  let scanQueued = false

  const flushScan = () => {
    scanQueued = false
    options.runScan(scheduledRoot)
    scheduledRoot = document.body
  }

  const scheduleScan = (root: ParentNode = document.body) => {
    if (!started) {
      return
    }
    scheduledRoot = root
    if (scanQueued) {
      return
    }
    scanQueued = true
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(flushScan)
  }

  const onLoaded = (...args: unknown[]) => {
    const maybeRoot = args.find((item): item is ParentNode => item instanceof Node)
    scheduleScan(maybeRoot || document.body)
  }

  return {
    scan() {
      scheduleScan()
    },
    start() {
      if (started) {
        return
      }
      started = true
      window[SQB_EMBED_BRIDGE_KEY] = options.bridge
      options.plugin.eventBus.on("loaded-protyle-static", onLoaded)
      options.plugin.eventBus.on("loaded-protyle-dynamic", onLoaded)
      scheduleScan()
    },
    destroy() {
      started = false
      cancelAnimationFrame(frame)
      scanQueued = false
      if (window[SQB_EMBED_BRIDGE_KEY] === options.bridge) {
        delete window[SQB_EMBED_BRIDGE_KEY]
      }
      options.plugin.eventBus.off("loaded-protyle-static", onLoaded)
      options.plugin.eventBus.off("loaded-protyle-dynamic", onLoaded)
    },
  }
}
