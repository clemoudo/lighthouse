"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { Document, pdfjs } from "react-pdf"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Button, Flex, Space, Typography, InputNumber, Skeleton } from "antd"
import { ChevronLeft, ChevronRight, X, Maximize2, Minimize2, RefreshCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { buildSpreads, spreadIndexForPage } from "@/lib/pdf-utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { SpreadItem } from "./spread-item"

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const { Text } = Typography

// Constants for layout logic
export const PDF_PAGE_GAP = 8
export const PDF_CONTAINER_PADDING = 32
export const PDF_ASPECT_RATIO = 1.414

interface PdfReaderProps {
  fileUrl: string
  initialPage?: number
  onClose: () => void
  title?: string
}

export const PdfReader = ({ fileUrl, initialPage = 1, onClose, title }: PdfReaderProps) => {
  const [numPages, setNumPages] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [jumpValue, setJumpValue] = useState<number | null>(initialPage)

  const containerRef = useRef<HTMLDivElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const showDoublePage = isDesktop

  const spreads = useMemo(() => buildSpreads(numPages, showDoublePage), [numPages, showDoublePage])

  // Precise height estimation based on the actual math used in SpreadItem
  const estimateHeight = useCallback(() => {
    if (containerWidth === 0) return 800

    // Exact same math as SpreadItem.tsx
    const availableWidth = containerWidth - PDF_CONTAINER_PADDING
    const pageWidth = showDoublePage
      ? availableWidth / 2 - PDF_PAGE_GAP / 2
      : Math.min(availableWidth - 16, 900)

    return pageWidth * PDF_ASPECT_RATIO + 16 // page height + py-2 padding (16px)
  }, [containerWidth, showDoublePage])

  const virtualizer = useVirtualizer({
    count: spreads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateHeight,
    overscan: 3,
  })

  // Re-measure when layout-impacting state changes
  useEffect(() => {
    virtualizer.measure()
  }, [containerWidth, showDoublePage, virtualizer])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  // Effect to handle initial page scrolling
  useEffect(() => {
    if (numPages > 0 && initialPage) {
      const targetIndex = spreadIndexForPage(initialPage, spreads)
      if (targetIndex !== -1) {
        requestAnimationFrame(() => {
          virtualizer.scrollToIndex(targetIndex, { align: "start" })
        })
      }
    }
  }, [numPages, initialPage, spreads, virtualizer])

  useEffect(() => {
    if (parentRef.current) {
      observerRef.current = new ResizeObserver((entries) => {
        if (!entries[0]) return
        const width = entries[0].contentRect.width
        if (width > 0) setContainerWidth(width)
      })
      observerRef.current.observe(parentRef.current)
    }
    return () => observerRef.current?.disconnect()
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const virtualItems = virtualizer.getVirtualItems()

  // Calculate current page based on visible items (filtering out overscan)
  const currentPage = useMemo(() => {
    if (virtualItems.length === 0) return initialPage

    // Find the first item that is actually visible in the viewport
    const scrollTop = parentRef.current?.scrollTop || 0
    const firstVisible =
      virtualItems.find((item) => item.start + item.size > scrollTop + 10) || virtualItems[0]

    return spreads[firstVisible.index]?.[0] || initialPage
  }, [virtualItems, spreads, initialPage])

  // Sync jumpValue with current scroll position
  useEffect(() => {
    setJumpValue(currentPage)
  }, [currentPage])

  const handleJumpToPage = useCallback(
    (val: number | null) => {
      if (!val || spreads.length === 0) return
      const targetIndex = spreadIndexForPage(val, spreads)
      if (targetIndex !== -1) {
        // Small delay to ensure virtualizer is ready and state is settled
        requestAnimationFrame(() => {
          virtualizer.scrollToIndex(targetIndex, { align: "start" })
        })
      }
    },
    [spreads, virtualizer],
  )

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const options = useMemo(
    () => ({
      disableStream: false,
      disableAutoFetch: false,
    }),
    [],
  )

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-mask backdrop-blur-md",
        isFullscreen ? "p-0" : "p-1 md:p-2",
      )}
    >
      {/* Header - Perfectly centered and aligned */}
      <div
        className={cn(
          "mb-1 bg-container h-10 px-3 border border-border shadow-sm shrink-0 flex items-center relative transition-all duration-300",
          isFullscreen ? "rounded-none" : "rounded-lg",
        )}
      >
        {/* Left section - Actions & Title */}
        <Flex align="center" gap={12} className="min-w-0 z-10">
          <Button
            type="text"
            icon={<X size={18} />}
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8"
          />
          <Text strong className="truncate max-w-[120px] md:max-w-md text-sm mb-0 leading-none">
            {title || "Consultation"}
          </Text>
        </Flex>

        {/* Center section - Page Selector (Centered on PC, Right on Mobile) */}
        <div className="absolute inset-0 flex items-center justify-end pr-2 lg:justify-center lg:pr-0 pointer-events-none">
          <Flex
            align="center"
            gap={isDesktop ? 12 : 6}
            className="bg-fill-secondary/50 px-2 lg:px-4 h-8 rounded-full border border-border pointer-events-auto"
          >
            <Button
              type="text"
              size="small"
              icon={<ChevronLeft size={16} />}
              disabled={currentPage <= 1}
              onClick={() => handleJumpToPage(Math.max(1, currentPage - (showDoublePage ? 2 : 1)))}
              className="flex items-center justify-center disabled:opacity-30 h-6 w-6"
            />
            <Flex align="center" gap={4} className="h-full">
              <InputNumber
                min={1}
                max={numPages}
                value={jumpValue}
                onChange={(val) => setJumpValue(val as number | null)}
                onPressEnter={() => handleJumpToPage(jumpValue)}
                onBlur={() => handleJumpToPage(jumpValue)}
                size="small"
                className="w-12 lg:w-14 bg-transparent! border-border! text-text! text-center shadow-none h-6 flex items-center"
                controls={false}
              />
              <Text className="text-text-description text-[10px] lg:text-xs opacity-60 mb-0">
                / {numPages || "--"}
              </Text>
            </Flex>
            <Button
              type="text"
              size="small"
              icon={<ChevronRight size={16} />}
              disabled={currentPage >= numPages}
              onClick={() =>
                handleJumpToPage(Math.min(numPages, currentPage + (showDoublePage ? 2 : 1)))
              }
              className="flex items-center justify-center disabled:opacity-30 h-6 w-6"
            />
          </Flex>
        </div>

        {/* Right section - Controls */}
        <div className="ml-auto z-10">
          <Button
            type="text"
            icon={isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            onClick={toggleFullscreen}
            className="hidden sm:flex items-center justify-center h-8 w-8"
          />
        </div>
      </div>

      {/* Main Content */}
      <div
        ref={parentRef}
        className={cn(
          "flex-1 overflow-y-auto bg-layout border border-border shadow-inner custom-scrollbar relative",
          isFullscreen ? "rounded-none" : "rounded-lg",
        )}
      >
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          options={options}
          loading={
            <Flex vertical align="center" justify="center" gap={16} className="h-full w-full">
              <Skeleton.Button active block className="h-[70vh] w-[400px] opacity-10" />
              <Text className="text-text-description text-xs uppercase tracking-widest">
                Chargement...
              </Text>
            </Flex>
          }
          error={
            <Flex vertical align="center" justify="center" gap={16} className="h-full w-full">
              <Text className="text-error">Échec du chargement.</Text>
              <Space>
                <Button icon={<RefreshCcw size={14} />} onClick={() => window.location.reload()}>
                  Réessayer
                </Button>
                <Button onClick={onClose}>Fermer</Button>
              </Space>
            </Flex>
          }
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => (
              <div
                key={virtualItem.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <SpreadItem
                  spread={spreads[virtualItem.index]}
                  isTwoPage={showDoublePage}
                  containerWidth={containerWidth}
                />
              </div>
            ))}
          </div>
        </Document>
      </div>
    </div>
  )
}
