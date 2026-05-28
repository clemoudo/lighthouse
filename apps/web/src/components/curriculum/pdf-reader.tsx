"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { Document, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/TextLayer.css"
import "react-pdf/dist/Page/AnnotationLayer.css"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  Button,
  Flex,
  Space,
  Typography,
  InputNumber,
  Skeleton,
  Select,
  Tooltip,
  FloatButton,
} from "antd"
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  RefreshCcw,
  ZoomIn,
  ZoomOut,
  Maximize,
  ExternalLink,
  MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { buildSpreads, spreadIndexForPage } from "@/lib/pdf-utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { SpreadItem } from "./spread-item"
import { useRouter } from "next/navigation"

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const { Text } = Typography

// Constants for layout logic
export const PDF_PAGE_GAP = 8
export const PDF_CONTAINER_PADDING = 32
export const PDF_ASPECT_RATIO = 1.414

type ZoomMode = number | "fit-width" | "fit-page"

interface PdfReaderProps {
  fileUrl: string
  initialPage?: number
  onClose: () => void
  title?: string
  returnUrl?: string
}

export const PdfReader = ({
  fileUrl,
  initialPage = 1,
  onClose,
  title,
  returnUrl,
}: PdfReaderProps) => {
  const router = useRouter()
  const [numPages, setNumPages] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [jumpValue, setJumpValue] = useState<number | null>(initialPage)
  const [zoomMode, setZoomMode] = useState<ZoomMode>(1)

  const containerRef = useRef<HTMLDivElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const showDoublePage = isDesktop

  const spreads = useMemo(() => buildSpreads(numPages, showDoublePage), [numPages, showDoublePage])

  // Calculate actual scale factor based on mode or numeric value
  const zoomScale = useMemo(() => {
    if (typeof zoomMode === "number") return zoomMode
    if (containerWidth === 0) return 1

    const availableWidth = containerWidth - PDF_CONTAINER_PADDING
    const basePageWidth = showDoublePage
      ? availableWidth / 2 - PDF_PAGE_GAP / 2
      : Math.min(availableWidth - 16, 900)

    if (zoomMode === "fit-width") {
      // Scale so basePageWidth (one or two pages) fits perfectly
      return availableWidth / (showDoublePage ? basePageWidth * 2 + PDF_PAGE_GAP : basePageWidth)
    }

    if (zoomMode === "fit-page" && containerHeight > 0) {
      const availableHeight = containerHeight - 32 // vertical padding buffer
      const basePageHeight = basePageWidth * PDF_ASPECT_RATIO
      return availableHeight / basePageHeight
    }

    return 1
  }, [zoomMode, containerWidth, containerHeight, showDoublePage])

  // Precise height estimation based on the actual math used in SpreadItem
  const estimateHeight = useCallback(() => {
    if (containerWidth === 0) return 800

    // Exact same math as SpreadItem.tsx
    const availableWidth = containerWidth - PDF_CONTAINER_PADDING
    const pageWidth = showDoublePage
      ? availableWidth / 2 - PDF_PAGE_GAP / 2
      : Math.min(availableWidth - 16, 900)

    // Apply zoom to the calculated page width
    const scaledPageWidth = pageWidth * zoomScale

    return scaledPageWidth * PDF_ASPECT_RATIO + 16 // page height + py-2 padding (16px)
  }, [containerWidth, showDoublePage, zoomScale])

  const virtualizer = useVirtualizer({
    count: spreads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateHeight,
    overscan: 3,
  })

  // Re-measure when layout-impacting state changes
  useEffect(() => {
    virtualizer.measure()
  }, [containerWidth, containerHeight, showDoublePage, zoomScale, virtualizer])

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
        const { width, height } = entries[0].contentRect
        if (width > 0) setContainerWidth(width)
        if (height > 0) setContainerHeight(height)
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
    if (numPages === 0 || virtualItems.length === 0) return initialPage

    // Find the first item that is actually visible in the viewport
    const scrollTop = parentRef.current?.scrollTop || 0
    const firstVisible =
      virtualItems.find((item) => item.start + item.size > scrollTop + 10) || virtualItems[0]

    const page = spreads[firstVisible.index]?.[0]
    return page && page > 0 ? page : initialPage
  }, [virtualItems, spreads, initialPage, numPages])

  // Sync jumpValue with current scroll position
  useEffect(() => {
    if (currentPage > 0) {
      setJumpValue(currentPage)
    }
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

  const handleZoomChange = (value: ZoomMode) => {
    setZoomMode(value)
  }

  const zoomOut = () => {
    const current = typeof zoomMode === "number" ? zoomMode : zoomScale
    setZoomMode(Math.max(0.25, current - 0.25))
  }

  const zoomIn = () => {
    const current = typeof zoomMode === "number" ? zoomMode : zoomScale
    setZoomMode(Math.min(3, current + 0.25))
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
      {/* Header - Balanced 3-column grid layout */}
      <div
        className={cn(
          "mb-1 bg-container h-10 px-3 border border-border shadow-sm shrink-0 grid grid-cols-3 items-center relative transition-all duration-300",
          isFullscreen ? "rounded-none" : "rounded-lg",
        )}
      >
        {/* Left section - Title & Close */}
        <Flex align="center" gap={8} className="min-w-0">
          <Button
            type="text"
            icon={<X size={18} />}
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 shrink-0"
          />
          <Text strong className="truncate text-sm mb-0 leading-none">
            {title || "Consultation"}
          </Text>
        </Flex>

        {/* Center section - Page Selector & Zoom (Centered) */}
        <Flex align="center" justify="center" gap={8} className="w-full">
          {/* Zoom Controls - PC Only for space */}
          <Flex
            align="center"
            gap={2}
            className="hidden md:flex bg-fill-secondary/50 px-2 h-8 rounded-full border border-border"
          >
            <Button
              type="text"
              size="small"
              icon={<ZoomOut size={14} />}
              onClick={zoomOut}
              className="flex items-center justify-center h-6 w-6"
            />
            <Select
              size="small"
              value={zoomMode}
              onChange={handleZoomChange}
              variant="borderless"
              className="w-24 lg:w-28 text-[10px] lg:text-xs"
              popupMatchSelectWidth={false}
              labelRender={(props) => {
                if (props.value === "fit-width") return "Pleine largeur"
                if (props.value === "fit-page") return "Page entière"
                return `${Math.round(zoomScale * 100)}%`
              }}
              options={[
                { value: "fit-width", label: "Pleine largeur" },
                { value: "fit-page", label: "Page entière" },
                { value: 0.5, label: "50%" },
                { value: 0.75, label: "75%" },
                { value: 1, label: "100%" },
                { value: 1.25, label: "125%" },
                { value: 1.5, label: "150%" },
                { value: 2, label: "200%" },
              ]}
            />
            <Button
              type="text"
              size="small"
              icon={<ZoomIn size={14} />}
              onClick={zoomIn}
              className="flex items-center justify-center h-6 w-6"
            />
          </Flex>

          {/* Page Selector */}
          <Flex
            align="center"
            gap={isDesktop ? 12 : 4}
            className="bg-fill-secondary/50 px-2 lg:px-4 h-8 rounded-full border border-border"
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
                max={numPages || 1}
                value={jumpValue}
                status={
                  jumpValue && (jumpValue < 1 || (numPages > 0 && jumpValue > numPages))
                    ? "error"
                    : undefined
                }
                onChange={(val) => setJumpValue(val as number | null)}
                onPressEnter={() => handleJumpToPage(jumpValue)}
                onBlur={() => handleJumpToPage(jumpValue)}
                size="small"
                className="w-10 lg:w-14 border-border! text-text! text-center shadow-none h-6 flex items-center"
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
        </Flex>

        {/* Right section - Global Controls */}
        <Flex align="center" justify="end" gap={4}>
          <Tooltip title="Ouvrir dans un nouvel onglet">
            <Button
              type="text"
              icon={<ExternalLink size={18} />}
              onClick={() => window.open(`${fileUrl}#page=${currentPage}`, "_blank")}
              className="flex items-center justify-center h-8 w-8"
            />
          </Tooltip>
          {/* Zoom reset for mobile only (when main zoom is hidden) */}
          <Tooltip title="Réinitialiser le zoom">
            <Button
              type="text"
              icon={<Maximize size={18} />}
              onClick={() => setZoomMode(1)}
              disabled={zoomScale === 1}
              className="md:hidden flex items-center justify-center h-8 w-8 disabled:opacity-20"
            />
          </Tooltip>
          <Button
            type="text"
            icon={isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            onClick={toggleFullscreen}
            className="hidden sm:flex items-center justify-center h-8 w-8"
          />
        </Flex>
      </div>

      {/* Main Content */}
      <div
        ref={parentRef}
        className={cn(
          "flex-1 overflow-auto bg-layout border border-border shadow-inner custom-scrollbar relative",
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
              width: "fit-content",
              minWidth: "100%",
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
                  width: "fit-content",
                  minWidth: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <SpreadItem
                  spread={spreads[virtualItem.index]}
                  isTwoPage={showDoublePage}
                  containerWidth={containerWidth}
                  zoom={zoomScale}
                />
              </div>
            ))}
          </div>
        </Document>

        {/* Floating Back to Chat Button */}
        {returnUrl && (
          <FloatButton
            icon={<MessageCircle size={28} style={{ transform: "scaleX(-1)" }} />}
            tooltip="Retour à la conversation"
            type="primary"
            onClick={() => router.push(returnUrl)}
            className="w-14 h-14"
          />
        )}
      </div>
    </div>
  )
}
