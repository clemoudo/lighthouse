"use client"

import { Button, Flex, Typography } from "antd"
import { X, ExternalLink } from "lucide-react"
import { useMemo } from "react"

const { Text } = Typography

interface PdfReaderProps {
  fileUrl: string
  initialPage?: number
  onClose: () => void
  title?: string
}

export const PdfReader = ({ fileUrl, initialPage = 1, onClose, title }: PdfReaderProps) => {
  // Use view=Fit to fit the page in the viewer.
  const nativeUrl = useMemo(() => `${fileUrl}#page=${initialPage}&view=Fit`, [fileUrl, initialPage])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md p-1 md:p-2">
      {/* Minimized Header with perfect vertical alignment */}
      <Flex
        align="center"
        justify="space-between"
        className="mb-1 bg-container h-10 px-2 rounded-md border border-border shadow-sm shrink-0"
      >
        <Flex align="center" gap={8} className="min-w-0 h-full">
          <Button
            type="text"
            size="small"
            icon={<X size={16} />}
            onClick={onClose}
            className="hover:bg-fill-secondary flex items-center justify-center h-8 w-8"
          />
          <div className="flex items-center h-full ml-1">
            <Text strong className="truncate max-w-[140px] md:max-w-md text-xs leading-none">
              {title || "Document"}
            </Text>
          </div>
        </Flex>

        <Button
          type="primary"
          ghost
          size="small"
          icon={<ExternalLink size={14} />}
          onClick={() => window.open(nativeUrl, "_blank")}
          className="hidden sm:flex text-[11px]"
        >
          Plein écran
        </Button>
      </Flex>

      {/* Native Browser PDF Viewer - key forces reload on page change */}
      <div className="flex-1 rounded-md overflow-hidden bg-white shadow-2xl relative">
        <iframe
          key={nativeUrl}
          src={nativeUrl}
          className="w-full h-full border-none"
          title={title}
        />
      </div>
    </div>
  )
}
