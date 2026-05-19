"use client"

import { useChat, type UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Input, Button, Typography, Space, Flex, Avatar } from "antd"
import { Send, User, Bot, AlertCircle } from "lucide-react"
import { env } from "@/env"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const { Text } = Typography

export default function AssistantPage() {
  const [input, setInput] = useState("")
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: env.NEXT_PUBLIC_API_URL + "/chat",
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          credentials: "include",
        })
      },
    }),
    messages: [
      {
        id: "welcome",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Bonjour ! Je suis votre assistant Lighthouse. Posez-moi vos questions sur le programme scolaire (Pacte pour un Enseignement d'excellence), je chercherai les réponses dans le référentiel officiel.",
          },
        ],
      },
    ] as UIMessage[],
  })

  const isLoading = status !== "ready"
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const onFinish = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (input.trim() && !isLoading) {
      sendMessage({ text: input })
      setInput("")
    }
  }

  return (
    <Flex vertical className="h-[calc(100vh-32px)] max-w-4xl mx-auto relative">
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-8 scrollbar-hide">
        <div className="space-y-8">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex w-full gap-4",
                m.role === "user" ? "flex-row-reverse" : "flex-row",
              )}
            >
              <div className="shrink-0 pt-1">
                <Avatar
                  size={36}
                  icon={m.role === "user" ? <User size={18} /> : <Bot size={18} />}
                  className={
                    m.role === "user" ? "bg-primary" : "bg-white border border-border text-primary"
                  }
                />
              </div>

              <div
                className={cn(
                  "flex flex-col gap-2 max-w-[80%]",
                  m.role === "user" ? "items-end" : "items-start",
                )}
              >
                <Text strong className="text-[11px] uppercase tracking-widest opacity-40 px-1">
                  {m.role === "user" ? "Vous" : "Assistant Lighthouse"}
                </Text>

                <div
                  className={cn(
                    "px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "bg-primary text-white rounded-tr-none"
                      : "bg-white text-foreground rounded-tl-none border border-border",
                  )}
                >
                  <div className="whitespace-pre-wrap">
                    {m.parts.map((part, i) =>
                      part.type === "text" ? <span key={i}>{part.text}</span> : null,
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-4">
              <div className="shrink-0">
                <Avatar
                  size={36}
                  icon={<Bot size={18} />}
                  className="bg-white border border-border text-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Text strong className="text-[11px] uppercase tracking-widest opacity-40 px-1">
                  Assistant Lighthouse
                </Text>
                <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none border border-border shadow-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <span
                      className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <Space className="bg-red-50 text-red-600 px-6 py-3 rounded-xl border border-red-100 shadow-sm text-xs">
                <AlertCircle size={16} />
                <span>Une erreur est survenue : {error.message}</span>
              </Space>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="px-10 pt-4 bg-layout/80 backdrop-blur-sm sticky bottom-0">
        <form onSubmit={onFinish} className="relative group max-w-3xl mx-auto">
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question sur le programme..."
            autoSize={{ minRows: 1, maxRows: 8 }}
            className="pr-14 pl-5 py-4 rounded-2xl border-border hover:border-primary/50 focus:border-primary transition-all resize-none shadow-lg bg-white text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                onFinish()
              }
            }}
          />
          <Button
            type="primary"
            htmlType="submit"
            icon={<Send size={20} />}
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 bottom-2.5 h-10 w-10 flex items-center justify-center rounded-xl shadow-md transition-transform active:scale-95"
          />
        </form>
        <p className="text-[10px] text-center mt-4 text-muted-foreground opacity-50 font-medium">
          L'IA peut faire des erreurs. Vérifiez les informations dans le référentiel officiel.
        </p>
      </div>
    </Flex>
  )
}
