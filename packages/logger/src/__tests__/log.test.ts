import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals"
import { log, logger } from ".."

describe("@repo/logger", () => {
  beforeEach(() => {
    jest.spyOn(console, "info").mockImplementation(() => {})
    jest.spyOn(console, "warn").mockImplementation(() => {})
    jest.spyOn(console, "error").mockImplementation(() => {})
    jest.spyOn(console, "debug").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("prints a message (old)", () => {
    log("hello")
    expect(console.info).toHaveBeenCalled()
  })
  it("prints a message (info)", () => {
    logger.info("hello")
    expect(console.info).toHaveBeenCalled()
  })
  it("prints a message (warn)", () => {
    logger.warn("hello")
    expect(console.warn).toHaveBeenCalled()
  })
  it("prints a message (error)", () => {
    logger.error("hello")
    expect(console.error).toHaveBeenCalled()
  })
})
