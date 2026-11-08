import { afterEach, describe, expect, it, vi } from "vitest"

import { writeClipboardText } from "@/utils/clipboard"

describe("writeClipboardText", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("uses the async clipboard API when available", async () => {
    const writeText = vi.fn(async () => {})
    vi.stubGlobal("navigator", { clipboard: { writeText } })

    await writeClipboardText("hello")

    expect(writeText).toHaveBeenCalledWith("hello")
  })

  it("falls back to a temporary textarea and execCommand", async () => {
    vi.stubGlobal("navigator", {})
    const execCommand = vi.fn(() => true)
    document.execCommand = execCommand as unknown as typeof document.execCommand
    const appendSpy = vi.spyOn(document.body, "appendChild")
    const removeSpy = vi.spyOn(document.body, "removeChild")

    await writeClipboardText("fallback text")

    expect(execCommand).toHaveBeenCalledWith("copy")
    expect(appendSpy).toHaveBeenCalledTimes(1)
    expect(removeSpy).toHaveBeenCalledTimes(1)
    const textarea = appendSpy.mock.calls[0][0] as HTMLTextAreaElement
    expect(textarea.value).toBe("fallback text")
    expect(textarea.getAttribute("readonly")).toBe("true")
  })

  it("throws when no clipboard strategy succeeds", async () => {
    vi.stubGlobal("navigator", {})
    document.execCommand = vi.fn(() => false) as unknown as typeof document.execCommand

    await expect(writeClipboardText("nope")).rejects.toThrow("clipboard unavailable")
  })
})
