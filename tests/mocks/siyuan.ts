export class Dialog {
  element = document.createElement("div")

  constructor(options?: { content?: string }) {
    if (options?.content) {
      this.element.innerHTML = options.content
    }
  }

  destroy() {}
}

export class Plugin {
  async loadData() {
    return null
  }

  async saveData() {}

  async removeData() {}
}

export function showMessage() {}

export function getFrontend() {
  return "desktop"
}

export function fetchSyncPost() {
  return {
    code: 0,
    data: null,
  }
}
