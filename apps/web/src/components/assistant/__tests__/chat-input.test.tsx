import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ChatInput } from "../chat-input"

describe("ChatInput", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
    onSend: vi.fn(),
    isStreaming: false,
    isLoading: false,
  }

  it("renders the textarea with placeholder", () => {
    render(<ChatInput {...defaultProps} />)
    expect(
      screen.getByPlaceholderText(/Posez votre question sur le programme.../),
    ).toBeInTheDocument()
  })

  it("calls onChange when typing", () => {
    render(<ChatInput {...defaultProps} />)
    const textarea = screen.getByPlaceholderText(/Posez votre question/)
    fireEvent.change(textarea, { target: { value: "Hello" } })
    expect(defaultProps.onChange).toHaveBeenCalledWith("Hello")
  })

  it("calls onSend when clicking the send button", () => {
    render(<ChatInput {...defaultProps} value="Some message" />)
    const button = screen.getByRole("button")
    fireEvent.click(button)
    expect(defaultProps.onSend).toHaveBeenCalled()
  })

  it("disables the button when value is empty and not streaming", () => {
    render(<ChatInput {...defaultProps} value="" />)
    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
  })

  it("enables the button when streaming even if value is empty (to stop)", () => {
    render(<ChatInput {...defaultProps} value="" isStreaming={true} />)
    const button = screen.getByRole("button")
    expect(button).not.toBeDisabled()
  })

  it("disables the button when loading", () => {
    render(<ChatInput {...defaultProps} value="test" isLoading={true} />)
    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
  })

  it("calls onSend when Enter is pressed (without Shift)", () => {
    const onKeyDown = vi.fn((e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        defaultProps.onSend()
      }
    })
    render(<ChatInput {...defaultProps} onKeyDown={onKeyDown} />)
    const textarea = screen.getByPlaceholderText(/Posez votre question/)
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false })
    expect(defaultProps.onSend).toHaveBeenCalled()
  })
})
