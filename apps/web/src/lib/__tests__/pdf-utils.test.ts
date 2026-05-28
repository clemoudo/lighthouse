import { describe, it, expect } from "vitest"
import { buildSpreads, spreadIndexForPage } from "../pdf-utils"

describe("pdf-utils", () => {
  describe("buildSpreads", () => {
    it("should return empty array for 0 pages", () => {
      expect(buildSpreads(0)).toEqual([])
    })

    it("should build single page spreads when isTwoPage is false", () => {
      const spreads = buildSpreads(3, false)
      expect(spreads).toEqual([[1], [2], [3]])
    })

    it("should build spreads correctly for odd number of pages (two-page mode)", () => {
      const spreads = buildSpreads(5, true)
      // Page 1 (cover)
      // Pages 2-3
      // Pages 4-5
      expect(spreads).toEqual([[1], [2, 3], [4, 5]])
    })

    it("should build spreads correctly for even number of pages (two-page mode)", () => {
      const spreads = buildSpreads(4, true)
      // Page 1
      // Pages 2-3
      // Page 4
      expect(spreads).toEqual([[1], [2, 3], [4]])
    })
  })

  describe("spreadIndexForPage", () => {
    it("should find the correct spread index", () => {
      const spreads = [[1], [2, 3], [4, 5]]
      expect(spreadIndexForPage(1, spreads)).toBe(0)
      expect(spreadIndexForPage(3, spreads)).toBe(1)
      expect(spreadIndexForPage(4, spreads)).toBe(2)
      expect(spreadIndexForPage(10, spreads)).toBe(-1)
    })
  })
})
