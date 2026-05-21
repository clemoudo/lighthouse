"use client"

import { useChat, type UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport, isDataUIPart } from "ai"
import { Input, Button, Typography, Space, Flex, Avatar, ConfigProvider, theme } from "antd"
import { Send, User, AlertCircle } from "lucide-react"
import { env } from "@/env"
import { useEffect, useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useTheme } from "next-themes"
import { useSession } from "@/lib/auth-client"
import { Citations } from "@/components/assistant/citations"
import { type ChatSource } from "@repo/api"
import { HistorySidebar } from "@/components/assistant/history-sidebar"
import { getChatConversationsId } from "@/api/generated/lighthouse"

const { Text, Title, Paragraph } = Typography

// Define the data types for type safety in message parts
interface ChatDataTypes {
  sources: ChatSource[]
  [key: string]: unknown
}

// Custom UIMessage type with our data parts
type ChatUIMessage = UIMessage<never, ChatDataTypes>

const WELCOME_MESSAGE: ChatUIMessage = {
  id: "welcome",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Bonjour ! Je suis **Félix**, votre assistant **Lighthouse**. 🕊️\n\nEn tant qu'expert du programme scolaire belge (*Pacte pour un Enseignement d'excellence*), je suis là pour prendre de la hauteur et vous éclairer dans la planification de vos activités en maternelle.\n\nPosez-moi vos questions, je chercherai les réponses directement dans le référentiel officiel pour vous aider à garder le cap !",
    },
  ],
}

/**
 * Component to render the markdown content of a message.
 * It uses Ant Design Typography components for consistent styling.
 */
function MessageContent({ role, parts }: { role: string; parts: UIMessage["parts"] }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <Paragraph className="m-0 last:mb-0 mb-4">{children}</Paragraph>,
        h1: ({ children }) => (
          <Title level={4} className="mt-2 mb-4">
            {children}
          </Title>
        ),
        h2: ({ children }) => (
          <Title level={5} className="mt-2 mb-3">
            {children}
          </Title>
        ),
        h3: ({ children }) => (
          <Text strong className="block mt-2 mb-2">
            {children}
          </Text>
        ),
        ul: ({ children }) => <ul className="pl-6 mb-4 space-y-1 list-disc">{children}</ul>,
        ol: ({ children }) => <ol className="pl-6 mb-4 space-y-1 list-decimal">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        strong: ({ children }) => <Text strong>{children}</Text>,
        em: ({ children }) => <Text italic>{children}</Text>,
        code: ({ children }) => (
          <code
            className={cn(
              "px-1.5 py-0.5 rounded text-xs font-mono",
              role === "user" ? "bg-white/20" : "bg-fill-secondary text-text",
            )}
          >
            {children}
          </code>
        ),
      }}
    >
      {parts
        .filter((part) => part.type === "text")
        .map((part) => (part.type === "text" ? part.text : ""))
        .join("")}
    </ReactMarkdown>
  )
}

export default function AssistantPage() {
  const { resolvedTheme } = useTheme()
  const { data: session } = useSession()
  const [input, setInput] = useState("")
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)

  const assistantAvatar = resolvedTheme === "dark" ? "/albatross-dark-64.png" : "/albatross-64.png"

  const { messages, sendMessage, status, error, setMessages } = useChat<ChatUIMessage>({
    transport: new DefaultChatTransport({
      api: env.NEXT_PUBLIC_API_URL + "/chat",
      body: {
        conversationId,
      },
      fetch: async (url, options) => {
        const response = await fetch(url, {
          ...options,
          credentials: "include",
        })

        const id = response.headers.get("x-conversation-id")
        if (id) {
          setConversationId((prev) => (id !== prev ? id : prev))
        }

        return response
      },
    }),
    messages: [WELCOME_MESSAGE],
  })

  const isLoading = status !== "ready"
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const onFinish = (e?: React.SubmitEvent) => {
    e?.preventDefault()
    if (input.trim() && !isLoading) {
      sendMessage({ text: input }, { body: { conversationId } })
      setInput("")
    }
  }

  const handleSelectConversation = async (id: string) => {
    if (id === conversationId) return

    try {
      const response = await getChatConversationsId(id)

      if (response.status === 200) {
        const conv = response.data

        if (conv && conv.messages) {
          const uiMessages: ChatUIMessage[] = conv.messages.map((m) => ({
            id: m.id,
            role: m.role.toLowerCase() as "user" | "assistant",
            content: m.content,
            parts: [
              { type: "text", text: m.content },
              ...(m.sources
                ? [
                    {
                      type: "data-sources" as const,
                      data: m.sources,
                    },
                  ]
                : []),
            ],
            createdAt: new Date(m.createdAt),
          }))

          setMessages(uiMessages)
          setConversationId(id)
        }
      }
    } catch (err) {
      console.error("Failed to load conversation", err)
    }
  }

  const handleNewChat = () => {
    setConversationId(undefined)
    setMessages([WELCOME_MESSAGE])
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-layout">
      <HistorySidebar
        currentConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
      />

      <Flex vertical className="flex-1 relative overflow-hidden h-full">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-8 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-8">
            {messages.map((m) => {
              // Logic to find sources in message parts
              const sourcesPart = m.parts.find(
                (part) => isDataUIPart(part) && part.type === "data-sources",
              )
              const messageSources =
                sourcesPart && isDataUIPart(sourcesPart)
                  ? (sourcesPart.data as ChatSource[])
                  : undefined

              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex w-full gap-4",
                    m.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div className="shrink-0 pt-1">
                    <Avatar
                      size={40}
                      src={m.role === "user" ? session?.user.image : assistantAvatar}
                      icon={
                        m.role === "user" && !session?.user.image ? <User size={18} /> : undefined
                      }
                      className={cn(
                        m.role === "user"
                          ? session?.user.image
                            ? "border-none"
                            : "bg-primary"
                          : "bg-container border border-border overflow-visible!",
                      )}
                    />
                  </div>

                  <div
                    className={cn(
                      "flex flex-col gap-2 max-w-[80%] min-w-0",
                      m.role === "user" ? "items-end" : "items-start",
                    )}
                  >
                    <Text strong className="text-[11px] uppercase tracking-widest opacity-40 px-1">
                      {m.role === "user" ? (session?.user.name ?? "Vous") : "Félix"}
                    </Text>

                    <div
                      className={cn(
                        "px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                        m.role === "user"
                          ? "bg-primary rounded-tr-none"
                          : "bg-container text-text rounded-tl-none border border-border",
                      )}
                    >
                      <div className="wrap-break-word">
                        {m.role === "user" ? (
                          <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
                            <MessageContent role={m.role} parts={m.parts} />
                          </ConfigProvider>
                        ) : (
                          <MessageContent role={m.role} parts={m.parts} />
                        )}
                      </div>
                    </div>

                    {/* Citations UI Component */}
                    <Citations sources={messageSources} />
                  </div>
                </div>
              )
            })}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-4">
                <div className="shrink-0">
                  <Avatar
                    size={40}
                    src={assistantAvatar}
                    className="bg-container border border-border overflow-visible!"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Text strong className="text-[11px] uppercase tracking-widest opacity-40 px-1">
                    Félix
                  </Text>
                  <div className="bg-container px-5 py-4 rounded-2xl rounded-tl-none border border-border shadow-sm flex items-center gap-2">
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
                <Space className="bg-error-bg text-error px-6 py-3 rounded-xl border border-error-border shadow-sm text-xs">
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
              className="pr-14 pl-5 py-4 rounded-2xl border-border hover:border-primary/50 focus:border-primary transition-all resize-none shadow-lg bg-container text-base"
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
          <p className="text-[10px] text-center mt-4 text-text-description opacity-50 font-medium pb-4">
            L'IA peut faire des erreurs. Vérifiez les informations dans le référentiel officiel.
          </p>
        </div>
      </Flex>
    </div>
  )
}
