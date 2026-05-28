import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { Citations } from "../citations"
import { type ChatSource } from "@repo/api"

// Mock SourcePill to avoid testing it twice and simplify dependencies
vi.mock("../source-pill", () => ({
  SourcePill: ({ source }: { source: ChatSource }) => (
    <div data-testid="source-pill">{source.source}</div>
  ),
}))

describe("Citations", () => {
  const mockSources: ChatSource[] = [
    { id: "1", source: "Source 1", page: 1 },
    { id: "2", source: "Source 2", page: 2 },
  ]

  it("renders null if no sources are provided", () => {
    const { container } = render(<Citations sources={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders null if sources array is empty", () => {
    const { container } = render(<Citations sources={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders a SourcePill for each source", () => {
    render(<Citations sources={mockSources} />)

    const pills = screen.getAllByTestId("source-pill")
    expect(pills).toHaveLength(2)
    expect(pills[0]).toHaveTextContent("Source 1")
    expect(pills[1]).toHaveTextContent("Source 2")
  })
})
