"use client"

import React from "react"
import { Page } from "react-pdf"
import { Flex } from "antd"
import { cn } from "@/lib/utils"
import { PDF_PAGE_GAP, PDF_CONTAINER_PADDING } from "./pdf-reader"

interface SpreadItemProps {
  spread: number[]
  isTwoPage: boolean
  containerWidth: number
  rotate?: number
  zoom?: number
}

/**
 * Renders one or two PDF pages side-by-side.
 * Memoized to prevent unnecessary re-renders during virtualization.
 */
const SpreadItemComponent = ({
  spread,
  isTwoPage,
  containerWidth,
  rotate = 0,
  zoom = 1,
}: SpreadItemProps) => {
  // Exact same math as PdfReader.tsx height estimation
  const availableWidth = containerWidth - PDF_CONTAINER_PADDING

  // CRITICAL FIX: In TwoPage mode, the page width should ALWAYS be half the available width
  // (minus gap), even if there is only one page in the spread (e.g. the cover).
  // This ensures consistent height across all spreads.
  const basePageWidth = isTwoPage
    ? availableWidth / 2 - PDF_PAGE_GAP / 2
    : Math.min(availableWidth - 16, 900)

  const pageWidth = basePageWidth * zoom

  // Ensure consistent spread width for alignment when zooming
  const spreadWidth = isTwoPage ? pageWidth * 2 + PDF_PAGE_GAP : pageWidth

  return (
    <Flex
      gap={isTwoPage ? PDF_PAGE_GAP : 0}
      justify="center"
      align="start"
      style={{ width: spreadWidth }}
      className="mx-auto py-2 relative"
    >
      {spread.map((pageNumber, index) => (
        <div
          key={pageNumber}
          className={cn(
            "shadow-xl bg-white transition-all duration-300",
            isTwoPage && spread.length === 2
              ? index === 0
                ? "rounded-l-sm border-r border-black/5"
                : "rounded-r-sm"
              : "rounded-sm",
          )}
        >
          <Page
            pageNumber={pageNumber}
            width={pageWidth}
            rotate={rotate}
            renderTextLayer={true}
            renderAnnotationLayer={false}
            loading={
              <div
                style={{ width: pageWidth, height: pageWidth * 1.414 }}
                className="bg-fill-quaternary animate-pulse"
              />
            }
          />
        </div>
      ))}
    </Flex>
  )
}

export const SpreadItem = React.memo(SpreadItemComponent)
