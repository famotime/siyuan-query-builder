export class Dialog {
  element = document.createElement("div")
  destroyCallback?: () => void

  constructor(options?: { content?: string, destroyCallback?: () => void }) {
    if (options?.content) {
      this.element.innerHTML = options.content
    }
    this.destroyCallback = options?.destroyCallback
  }

  destroy() {
    this.destroyCallback?.()
  }
}

export class Plugin {
  app: any
  name: string
  i18n: Record<string, string>
  displayName: string
  setting: any = null
  topBarItems: any[] = []
  commands: any[] = []
  tabDefinitions: any[] = []
  dockDefinitions: any[] = []
  private storage = new Map<string, unknown>()

  constructor(options?: { app?: any, name?: string, i18n?: Record<string, string> }) {
    this.app = options?.app || {}
    this.name = options?.name || "mock-plugin"
    this.i18n = options?.i18n || {}
    this.displayName = this.name
  }

  async loadData(storageName?: string) {
    if (!storageName) {
      return null
    }
    return this.storage.get(storageName) ?? null
  }

  async saveData(storageName?: string, value?: unknown) {
    if (!storageName) {
      return
    }
    this.storage.set(storageName, value)
  }

  async removeData(storageName?: string) {
    if (!storageName) {
      return null
    }
    const current = this.storage.get(storageName) ?? null
    this.storage.delete(storageName)
    return current
  }

  addIcons(_svg: string) {}

  addTopBar(options: any) {
    this.topBarItems.push(options)
    return document.createElement("button")
  }

  addCommand(options: any) {
    this.commands.push(options)
  }

  addTab(options: any) {
    this.tabDefinitions.push(options)
    return () => ({
      element: document.createElement("div"),
      type: options.type,
    })
  }

  addDock(options: any) {
    this.dockDefinitions.push(options)
    const element = document.createElement("div")
    const dockModel = {
      element,
      type: options.type,
      config: options.config,
      data: options.data,
    }
    if (typeof options.init === "function") {
      options.init.call(dockModel, dockModel)
    }
    return {
      config: options.config,
      model: dockModel,
    }
  }

  seed(storageName: string, value: unknown) {
    this.storage.set(storageName, value)
  }

  read(storageName: string) {
    return this.storage.get(storageName)
  }
}

export function showMessage() {}

export function getFrontend() {
  return "desktop"
}

export class Setting {
  items: Array<{
    title: string
    description?: string
    actionElement?: HTMLElement
    createActionElement?: () => HTMLElement
  }> = []
  openedName = ""

  addItem(options: {
    title: string
    description?: string
    actionElement?: HTMLElement
    createActionElement?: () => HTMLElement
  }) {
    this.items.push(options)
  }

  open(name: string) {
    this.openedName = name
  }
}

export async function openTab() {
  return {
    id: "mock-tab",
  }
}

export function fetchSyncPost() {
  return {
    code: 0,
    data: null,
  }
}
