/**
 * Builds the list of "spreads" (navigation units).
 * - If isTwoPage is true:
 *   - Spread 0: [page 1] (cover)
 *   - Spread n: [left page, right page] (e.g., [2,3], [4,5]...)
 *   - Last spread: [page N] alone if odd number of pages
 * - If isTwoPage is false:
 *   - Spread n: [page n]
 */
export function buildSpreads(totalPages: number, isTwoPage: boolean = true): number[][] {
  if (totalPages === 0) return []

  const spreads: number[][] = []

  if (!isTwoPage) {
    for (let i = 1; i <= totalPages; i++) {
      spreads.push([i])
    }
    return spreads
  }

  spreads.push([1])
  for (let i = 2; i <= totalPages; i += 2) {
    if (i + 1 <= totalPages) {
      spreads.push([i, i + 1])
    } else {
      spreads.push([i])
    }
  }
  return spreads
}

/**
 * Returns the index of the spread containing the given page.
 */
export function spreadIndexForPage(page: number, spreads: number[][]): number {
  return spreads.findIndex((s) => s.includes(page))
}
