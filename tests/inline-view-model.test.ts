import { describe, expect, it } from "vitest"

import { buildCardsSummary, buildListItems } from "@/inline/view-models"
import type { ResultRow } from "@/core/query/types"

describe("inline view models", () => {
  const rows: ResultRow[] = [
    {
      id: "1",
      content: "Design screen",
      attrs: {
        status: "Todo",
        priority: "P1",
      },
    },
    {
      id: "2",
      content: "Implement runtime",
      attrs: {
        status: "Doing",
        priority: "P0",
      },
    },
    {
      id: "3",
      content: "Ship package",
      attrs: {
        status: "Done",
      },
    },
  ]

  it("builds summary cards from result rows", () => {
    const cards = buildCardsSummary(rows, "attr:status")

    expect(cards[0]).toEqual({
      label: "总结果",
      value: "3",
    })
    expect(cards.some(card => card.label === "Todo" && card.value === "1")).toBe(true)
  })

  it("builds list items with projected meta fields", () => {
    const items = buildListItems(rows, ["attr:priority", "attr:status"])

    expect(items[0]?.title).toBe("Design screen")
    expect(items[0]?.meta).toEqual(["P1", "Todo"])
  })
})
