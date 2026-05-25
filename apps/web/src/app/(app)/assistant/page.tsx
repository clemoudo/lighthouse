"use client"

import { useChat, type UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport, isDataUIPart } from "ai"
import {
  Input,
  Button,
  Typography,
  Space,
  Flex,
  Avatar,
  ConfigProvider,
  theme,
  Drawer,
  Skeleton,
  Tooltip,
  Tag,
} from "antd"
import { Send, User, AlertCircle, PanelRightClose, PanelRightOpen, ShieldCheck } from "lucide-react"
import { env } from "@/env"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import Image from "next/image"
import remarkGfm from "remark-gfm"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/AuthContext"
import { Citations } from "@/components/assistant/citations"
import { MessageRole, type ChatSource } from "@repo/api"
import { HistorySidebar } from "@/components/assistant/history-sidebar"
import {
  getChatConversationsId,
  getGetChatUsageQueryKey,
  getGetChatConversationsQueryKey,
} from "@/api/generated/lighthouse"
import { useIsMobile } from "@/hooks/use-mobile"
import { useQueryClient } from "@tanstack/react-query"
import { useLocalStorage } from "@/hooks/use-local-storage"

const { Text, Title, Paragraph } = Typography

// Dynamic import of heavy markdown components
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => <SkeletonMarkdown />,
})

const SkeletonMarkdown = () => <Skeleton active title={false} paragraph={{ rows: 2 }} />

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
 * Helper to extract the text content from message parts.
 */
const getMessageText = (parts: UIMessage["parts"]): string => {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
}

/**
 * Component to render the markdown content of a message.
 * It uses Ant Design Typography components for consistent styling.
 */
const MessageContent = ({
  role,
  parts,
}: {
  role: UIMessage["role"]
  parts: UIMessage["parts"]
}) => {
  const content = useMemo(() => getMessageText(parts), [parts])

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
              role === MessageRole.user ? "bg-white/20" : "bg-fill-secondary text-text",
            )}
          >
            {children}
          </code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

const AssistantPage = () => {
  const queryClient = useQueryClient()
  const { resolvedTheme } = useTheme()
  const { user } = useAuth()
  const [input, setInput] = useLocalStorage("assistant-draft", "")
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)

  // Navigation History Logic
  const [historyIndex, setHistoryIndex] = useState(-1)

  const isMobile = useIsMobile()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false)
    } else {
      setIsSidebarOpen(true)
    }
  }, [isMobile])

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
          const isNew = !conversationId
          setConversationId((prev) => (id !== prev ? id : prev))

          if (isNew) {
            // Refresh history immediately if it's a new conversation
            queryClient.invalidateQueries({ queryKey: getGetChatConversationsQueryKey() })
          }
        }

        return response
      },
    }),
    messages: [WELCOME_MESSAGE],
    onFinish: () => {
      // Invalidate usage query to refresh the progress bar
      queryClient.invalidateQueries({ queryKey: getGetChatUsageQueryKey() })
      // Refresh history to update the last updated time
      queryClient.invalidateQueries({ queryKey: getGetChatConversationsQueryKey() })
    },
  })

  // Get user messages in chronological order (latest last)
  const userMessages = useMemo(() => {
    return messages.filter((m) => m.role === "user")
  }, [messages])

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
      setHistoryIndex(-1) // Reset history navigation
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Enter to send
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onFinish()
      return
    }

    // Handle History Navigation (Arrow Up/Down)
    if (userMessages.length === 0) return

    if (e.key === "ArrowUp") {
      // Only navigate history if cursor is at the beginning
      const cursorAtStart = e.currentTarget.selectionStart === 0
      if (cursorAtStart) {
        const nextIndex = historyIndex + 1
        if (nextIndex < userMessages.length) {
          e.preventDefault()
          const messageToRestore = userMessages[userMessages.length - 1 - nextIndex]
          const text = getMessageText(messageToRestore.parts)
          if (text) {
            setHistoryIndex(nextIndex)
            setInput(text)
          }
        }
      }
    } else if (e.key === "ArrowDown") {
      // Only navigate history if cursor is at the end
      const cursorAtEnd = e.currentTarget.selectionStart === e.currentTarget.value.length
      if (cursorAtEnd) {
        if (historyIndex > 0) {
          e.preventDefault()
          const nextIndex = historyIndex - 1
          const messageToRestore = userMessages[userMessages.length - 1 - nextIndex]
          const text = getMessageText(messageToRestore.parts)
          setHistoryIndex(nextIndex)
          setInput(text || "")
        } else if (historyIndex === 0) {
          e.preventDefault()
          setHistoryIndex(-1)
          setInput("") // Back to empty
        }
      }
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
            role: m.role,
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
          setHistoryIndex(-1) // Reset history for new conversation
        }
      }
    } catch (err) {
      console.error("Failed to load conversation", err)
    }
  }

  const handleNewChat = () => {
    setConversationId(undefined)
    setMessages([WELCOME_MESSAGE])
    setHistoryIndex(-1)
  }

  return (
    <Flex className="h-full w-full overflow-hidden bg-layout relative">
      <Flex vertical className="flex-1 relative overflow-hidden h-full">
        {/* Toggle Sidebar Button */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            type="text"
            icon={isSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-text/60 hover:text-text bg-container/50 backdrop-blur-sm shadow-sm"
          />
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-8 scrollbar-hide">
          <Space orientation="vertical" size={32} className="w-full max-w-5xl mx-auto flex">
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
                <Flex
                  key={m.id}
                  gap={16}
                  className="w-full"
                  style={{ flexDirection: m.role === "user" ? "row-reverse" : "row" }}
                >
                  <div className="shrink-0 pt-1">
                    <Avatar
                      size={40}
                      icon={
                        m.role === "user" ? (
                          user?.image ? (
                            <Image
                              src={user.image}
                              alt={user.name ?? "User"}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <User size={18} />
                          )
                        ) : (
                          <Image
                            src={assistantAvatar}
                            alt="Félix"
                            width={40}
                            height={40}
                            priority={m.id === "welcome"}
                          />
                        )
                      }
                      className={cn(
                        m.role === "user"
                          ? user?.image
                            ? "bg-transparent border-none"
                            : "bg-primary"
                          : "bg-container border border-border overflow-visible!",
                      )}
                    />
                  </div>

                  <Flex
                    vertical
                    gap={8}
                    className="max-w-[80%] min-w-0"
                    align={m.role === "user" ? "end" : "start"}
                  >
                    <Flex align="center" gap={8}>
                      <Text
                        strong
                        className="text-[11px] uppercase tracking-widest opacity-40 px-1"
                      >
                        {m.role === "user" ? (user?.name ?? "Vous") : "Félix"}
                      </Text>

                      {m.role === "assistant" && m.id !== "welcome" && messageSources && (
                        <Tooltip title="Cette réponse s'appuie directement sur le référentiel officiel.">
                          <Tag
                            color="processing"
                            variant="filled"
                            icon={<ShieldCheck size={12} className="mr-1" />}
                            className="m-0 py-0 px-2 flex items-center text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border-none shadow-none"
                          >
                            Vérifié
                          </Tag>
                        </Tooltip>
                      )}
                    </Flex>

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
                  </Flex>
                </Flex>
              )
            })}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <Flex gap={16}>
                <div className="shrink-0">
                  <Avatar
                    size={40}
                    icon={
                      <Image
                        src={assistantAvatar}
                        alt="Félix"
                        width={40}
                        height={40}
                        className="animate-pulse"
                      />
                    }
                    className="bg-container border border-border overflow-visible!"
                  />
                </div>
                <Flex vertical gap={8}>
                  <Text strong className="text-[11px] uppercase tracking-widest opacity-40 px-1">
                    Félix
                  </Text>
                  <Flex
                    align="center"
                    gap={8}
                    className="bg-container px-5 py-4 rounded-2xl rounded-tl-none border border-border shadow-sm"
                  >
                    <Flex gap={4}>
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
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            )}

            {error && (
              <Flex justify="center">
                <Space className="bg-error-bg text-error px-6 py-3 rounded-xl border border-error-border shadow-sm text-xs">
                  <AlertCircle size={16} />
                  <span>Une erreur est survenue : {error.message}</span>
                </Space>
              </Flex>
            )}
            <div ref={messagesEndRef} />
          </Space>
        </div>

        {/* Input Area */}
        <div className="px-4 pt-4 bg-layout/80 backdrop-blur-sm sticky bottom-0 border-t border-border/20 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.1)]">
          <form onSubmit={onFinish} className="relative group max-w-4xl mx-auto">
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question sur le programme..."
              autoSize={{ minRows: 1, maxRows: 8 }}
              className="pr-14 pl-5 py-4 rounded-2xl border-border hover:border-primary/50 focus:border-primary transition-all resize-none shadow-lg bg-container text-base"
              onKeyDown={handleKeyDown}
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

      {/* Sidebar Area */}
      {isMobile ? (
        <Drawer
          title="Historique"
          placement="right"
          onClose={() => setIsSidebarOpen(false)}
          open={isSidebarOpen}
          size="75%"
          styles={{ body: { padding: 0 } }}
        >
          <HistorySidebar
            currentConversationId={conversationId}
            onSelectConversation={(id) => {
              handleSelectConversation(id)
              setIsSidebarOpen(false)
            }}
            onNewChat={() => {
              handleNewChat()
              setIsSidebarOpen(false)
            }}
          />
        </Drawer>
      ) : (
        <div
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden h-full border-l border-border bg-container shrink-0",
            isSidebarOpen ? "w-72 opacity-100" : "w-0 opacity-0 border-none",
          )}
        >
          <div className="w-72 h-full">
            <HistorySidebar
              currentConversationId={conversationId}
              onSelectConversation={handleSelectConversation}
              onNewChat={handleNewChat}
            />
          </div>
        </div>
      )}
    </Flex>
  )
}

export default AssistantPage
