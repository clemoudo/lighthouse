import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import ComingSoon from "../coming-soon"

describe("ComingSoon Component", () => {
  it("renders correctly", () => {
    render(<ComingSoon />)

    expect(screen.getByText("Prochainement disponible")).toBeInTheDocument()
    expect(
      screen.getByText("Cette fonctionnalité est actuellement en cours de développement."),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retour à l'Assistant" })).toBeInTheDocument()
  })
})
