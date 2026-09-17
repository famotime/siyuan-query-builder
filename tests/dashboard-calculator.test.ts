import { describe, expect, it } from "vitest"
import {
  aggregateByWeekday,
  calculateBuckets,
  calculateMA7,
  calculateStreak,
  formatIsoDate,
  generateDateRange,
  parseDateFromHPath,
  parseTaskStatus,
} from "@/core/dashboard/calculator"

describe("dashboard calculator", () => {
  it("generates date range correctly", () => {
    const range = generateDateRange("2026-09-01", "2026-09-04")
    expect(range).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
    ])
  })

  it("calculates current and max streaks correctly", () => {
    const map = {
      "2026-09-10": 8,
      "2026-09-11": 8,
      "2026-09-12": 3, // break
      "2026-09-13": 8,
      "2026-09-14": 8,
      "2026-09-15": 8,
      "2026-09-16": 8,
      "2026-09-17": 8,
    }
    const { curStreak, maxStreak } = calculateStreak(map, 8, "2026-09-17")
    expect(curStreak).toBe(5) // 13, 14, 15, 16, 17
    expect(maxStreak).toBe(5)
  })

  it("calculates streak when today is not yet reached but yesterday was", () => {
    const map = {
      "2026-09-15": 8,
      "2026-09-16": 8,
      "2026-09-17": 2, // today not yet reached
    }
    const { curStreak } = calculateStreak(map, 8, "2026-09-17")
    expect(curStreak).toBe(2) // 15, 16
  })

  it("calculates 7-day moving average", () => {
    const vals = [10, 10, 10, 10, 10, 10, 10, 20]
    const ma = calculateMA7(vals)
    expect(ma[0]).toBe(10)
    expect(ma[6]).toBe(10)
    // 8th day: sum of last 7 is 10*6 + 20 = 80, / 7 = 11.4
    expect(ma[7]).toBe(11.4)
  })

  it("aggregates by weekday correctly", () => {
    // 2026-09-14 is Monday, 2026-09-15 is Tuesday, 2026-09-20 is Sunday
    const map = {
      "2026-09-14": 5,
      "2026-09-15": 10,
      "2026-09-20": 4,
    }
    const days = ["2026-09-14", "2026-09-15", "2026-09-20"]
    const agg = aggregateByWeekday(map, days, 5)

    expect(agg[0].label).toBe("周一")
    expect(agg[0].total).toBe(5)
    expect(agg[0].reachCount).toBe(1)

    expect(agg[1].label).toBe("周二")
    expect(agg[1].total).toBe(10)

    expect(agg[6].label).toBe("周日")
    expect(agg[6].total).toBe(4)
    expect(agg[6].reachCount).toBe(0)
  })

  it("calculates frequency buckets", () => {
    const vals = [0, 2, 4, 8, 9, 12]
    const buckets = calculateBuckets(vals, [
      { min: 0, max: 0, label: "0" },
      { min: 1, max: 7, label: "1-7" },
      { min: 8, max: 999, label: "8+" },
    ])
    expect(buckets[0].count).toBe(1) // 0
    expect(buckets[1].count).toBe(2) // 2, 4
    expect(buckets[2].count).toBe(3) // 8, 9, 12
  })

  it("parses task status properly", () => {
    expect(parseTaskStatus("- [ ] Write report")).toBe("todo")
    expect(parseTaskStatus("- [/] In progress task")).toBe("doing")
    expect(parseTaskStatus("- [x] Done task")).toBe("done")
    expect(parseTaskStatus("- [X] Done task capital")).toBe("done")
    expect(parseTaskStatus("- [-] Canceled item")).toBe("canceled")
    expect(parseTaskStatus("- [+] Deferred item")).toBe("deferred")
    expect(parseTaskStatus("Normal paragraph")).toBe("todo")
  })

  it("parses date from hpath", () => {
    expect(parseDateFromHPath("/Daily Notes/2026-09-17")).toBe("2026-09-17")
    expect(parseDateFromHPath("/2026-9-5 晨会")).toBe("2026-09-05")
    expect(parseDateFromHPath("/无日期的文档")).toBeNull()
  })
})
