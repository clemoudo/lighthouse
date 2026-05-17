"use client"

import { useChat, type UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Input, Button, Typography, Space } from "antd"
import { Send, User, Bot, Sparkles, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { env } from "@/env"
import { useEffect, useRef, useState } from "react"

const { Text } = Typography

export default function AssistantPage() {
  const [input, setInput] = useState("")
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: `${env.NEXT_PUBLIC_API_URL}/chat`,
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
    <div className="flex h-full flex-col p-6">
      <PageHeader
        title="Assistant IA"
        description="Posez des questions pédagogiques basées sur le programme officiel."
        icon={Sparkles}
      />

      <div className="flex-1 overflow-y-auto mb-6 pr-2">
        <div className="space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex max-w-[80%] gap-3 p-4 rounded-2xl ${
                  m.role === "user"
                    ? "bg-primary text-white rounded-tr-none shadow-md"
                    : "bg-white text-foreground rounded-tl-none border border-border shadow-sm"
                }`}
              >
                <div className="shrink-0 mt-1">
                  {m.role === "user" ? (
                    <User size={18} />
                  ) : (
                    <Bot size={18} className="text-primary" />
                  )}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                    {m.role === "user" ? "Vous" : "Assistant Lighthouse"}
                  </span>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {m.parts.map((part, i) =>
                      part.type === "text" ? <span key={i}>{part.text}</span> : null,
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start mt-4">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-border shadow-sm flex items-center gap-2">
              <Bot size={18} className="text-primary animate-pulse" />
              <Text italic type="secondary" className="text-sm">
                L'assistant réfléchit...
              </Text>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center mt-4">
            <Space className="bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100 shadow-sm text-xs">
              <AlertCircle size={14} />
              <span>Désolé, une erreur est survenue : {error.message}</span>
            </Space>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 bg-surface-secondary pt-2">
        <form onSubmit={onFinish} className="relative">
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question sur l'autonomie, les domaines d'apprentissage..."
            autoSize={{ minRows: 1, maxRows: 6 }}
            className="pr-12 py-3 rounded-xl shadow-lg border-primary/20 focus:border-primary transition-all resize-none"
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
            icon={<Send size={18} />}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 h-10 w-10 flex items-center justify-center rounded-lg shadow-md"
          />
        </form>
        <p className="text-[10px] text-center mt-3 text-muted-foreground opacity-70">
          L'IA peut faire des erreurs. Vérifiez toujours les informations importantes dans le
          référentiel officiel.
        </p>
      </div>
    </div>
  )
}
