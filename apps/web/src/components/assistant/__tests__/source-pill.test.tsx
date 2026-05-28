import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { SourcePill } from "../source-pill"
import { type ChatSource } from "@repo/api"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/test-path"),
}))

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe("SourcePill", () => {
  const mockSource: ChatSource = {
    id: "doc-1",
    source: "Programme Scolaire",
    page: 42,
  }

  it("renders the source name and page number", () => {
    render(<SourcePill source={mockSource} />)

    expect(screen.getByText(/Programme Scolaire/)).toBeInTheDocument()
    expect(screen.getByText(/p.42/)).toBeInTheDocument()
  })

  it("renders a link to the curriculum with correct parameters", () => {
    render(<SourcePill source={mockSource} />)

    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/curriculum?docId=doc-1&page=42&returnUrl=/test-path")
  })

  it("contains a BookOpen icon", () => {
    const { container } = render(<SourcePill source={mockSource} />)

    const icon = container.querySelector("svg")
    expect(icon).toBeInTheDocument()
  })
})
