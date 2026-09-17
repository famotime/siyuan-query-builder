import { describe, expect, it, vi } from "vitest"
import { executeDashboard } from "@/core/dashboard/runtime"
import type { KernelAdapter } from "@/core/runtime/kernel-adapter"

describe("dashboard runtime execution", () => {
  it("executes dashboard query and returns view model", async () => {
    const mockSql = vi.fn().mockResolvedValue([
      { id: "b1", content: "- [ ] 调研需求", markdown: "- [ ] 调研需求", hpath: "/2026-09-17" },
    ])
    const mockAdapter: Partial<KernelAdapter> = {
      sql: mockSql as any,
    }

    const vm = await executeDashboard(
      "daily-cockpit",
      { statusFilter: "open", month: "2026-09" },
      { kernelAdapter: mockAdapter as KernelAdapter },
    )

    expect(mockSql).toHaveBeenCalled()
    expect(vm.id).toBe("daily-cockpit")
    expect(vm.metrics.length).toBeGreaterThan(0)
    expect(vm.calendar?.tasks.length).toBe(1)
  })

  it("throws on unknown dashboard id", async () => {
    const mockAdapter: Partial<KernelAdapter> = { sql: vi.fn() }
    await expect(
      executeDashboard("non-existent", {}, { kernelAdapter: mockAdapter as KernelAdapter }),
    ).rejects.toThrow("未找到仪表板定义")
  })
})
