"use client"

import { Input, Button } from "antd"
import { Send, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import React from "react"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  isStreaming: boolean
  isLoading: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  placeholder?: string
}

export const ChatInput = ({
  value,
  onChange,
  onSend,
  isStreaming,
  isLoading,
  onKeyDown,
  placeholder = "Posez votre question sur le programme...",
}: ChatInputProps) => {
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    onSend()
  }

  return (
    <div className="px-4 pt-4 bg-layout sticky bottom-0 border-t border-border/20 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.05)]">
      <form onSubmit={handleSubmit} className="relative group max-w-4xl mx-auto">
        <Input.TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoSize={{ minRows: 1, maxRows: 8 }}
          className="pr-14 pl-5 py-4 rounded-2xl border-border hover:border-primary/50 focus:border-primary transition-all resize-none shadow-lg bg-container text-base"
          onKeyDown={onKeyDown}
        />
        <Button
          type="primary"
          htmlType="submit"
          icon={
            <div className="relative w-5 h-5 flex items-center justify-center">
              <Send
                size={20}
                className={cn(
                  "absolute transition-all duration-300 transform",
                  isStreaming ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
                )}
              />
              <Square
                size={16}
                fill="currentColor"
                className={cn(
                  "absolute transition-all duration-300 transform",
                  isStreaming ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0",
                )}
              />
            </div>
          }
          onClick={handleSubmit}
          disabled={!isStreaming && (!value.trim() || isLoading)}
          className={cn(
            "absolute right-2.5 bottom-2.5 h-10 w-10 flex items-center justify-center rounded-xl shadow-md transition-all active:scale-95",
            isStreaming ? "bg-error hover:bg-error/80 border-none" : "",
          )}
        />
      </form>
      <p className="text-[10px] text-center mt-4 text-text-description opacity-50 font-medium pb-4">
        L'IA peut faire des erreurs. Vérifiez les informations dans le référentiel officiel.
      </p>
    </div>
  )
}
