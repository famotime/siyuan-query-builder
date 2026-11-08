import { describe, expect, it, vi } from "vitest"

const { arrayBoardSpy } = vi.hoisted(() => ({
  arrayBoardSpy: {
    computeViewModel: vi.fn(),
  },
}))

// 部分 mock catalog:注入一个使用数组 SQL 的假定义,其余走真实实现
vi.mock("@/core/dashboard/catalog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/core/dashboard/catalog")>()
  return {
    ...actual,
    getDashboardDefinition: (id: string) => {
      if (id === "array-board") {
        return {
          id: "array-board",
          category: "project",
          title: "数组 SQL 仪表板",
          description: "",
          parameters: [],
          buildSql: () => ["SELECT 1", "SELECT 2"],
          computeViewModel: arrayBoardSpy.computeViewModel,
        } as any
      }
      return actual.getDashboardDefinition(id)
    },
  }
})

import { executeDashboard } from "@/core/dashboard/runtime"
import type { KernelAdapter } from "@/core/runtime/query-runtime"

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

  it("flattens multi-query results before handing rows to computeViewModel", async () => {
    const mockSql = vi.fn()
      .mockResolvedValueOnce([{ id: "r1" }])
      .mockResolvedValueOnce([{ id: "r2" }])
    const mockAdapter: Partial<KernelAdapter> = { sql: mockSql as any }
    arrayBoardSpy.computeViewModel.mockReset()
    arrayBoardSpy.computeViewModel.mockReturnValue({ id: "array-board" })

    const vm = await executeDashboard(
      "array-board",
      {},
      { kernelAdapter: mockAdapter as KernelAdapter },
    )

    expect(mockSql).toHaveBeenCalledTimes(2)
    // runtime 层完成数组结果归一:computeViewModel 拿到拼接后的扁平 rows
    expect(arrayBoardSpy.computeViewModel).toHaveBeenCalledWith(
      [{ id: "r1" }, { id: "r2" }],
      {},
    )
    expect(vm).toEqual({ id: "array-board" })
  })
})
