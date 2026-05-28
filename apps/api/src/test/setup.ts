import { jest, beforeEach } from "@jest/globals"

// Mock resend
jest.mock("resend", () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn(),
      },
    })),
  }
})

// Mock LlamaCloud
jest.mock("@llamaindex/llama-cloud", () => {
  return {
    LlamaCloud: jest.fn().mockImplementation(() => ({
      files: {
        create: jest.fn(),
      },
      parsing: {
        parse: jest.fn(),
      },
    })),
  }
})

// Mock Mistral/AI SDK
jest.mock("@ai-sdk/mistral", () => ({
  mistral: {
    chat: jest.fn(),
  },
}))

jest.mock("ai", () => ({
  generateText: jest.fn(),
  Output: {
    object: jest.fn(),
  },
}))

// Common setup for tests
beforeEach(() => {
  jest.clearAllMocks()
})
