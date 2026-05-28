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
  Drawer,
  Skeleton,
  Tooltip,
  Tag,
  Spin,
} from "antd"
import {
  Send,
  User,
  AlertCircle,
  PanelRightClose,
  PanelRightOpen,
  ShieldCheck,
  Square,
} from "lucide-react"
import { env } from "@/env"
import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from "react"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import Image from "next/image"
import remarkGfm from "remark-gfm"
import { useTheme } from "next-themes"
import { useParams, useRouter } from "next/navigation"
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
import { User as TUser } from "better-auth"

const { Text } = Typography

// Memoize components to prevent re-renders on every token
const MemoizedHistorySidebar = memo(HistorySidebar)

// Dynamic import of heavy markdown components
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => <SkeletonMarkdown />,
})

const SkeletonMarkdown = () => <Skeleton active title={false} paragraph={{ rows: 2 }} />

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
 * Optimized Markdown components using plain HTML for speed.
 */
const getMarkdownComponents = (role: UIMessage["role"]) => ({
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="m-0 last:mb-0 mb-4">{children}</p>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-lg font-bold mt-2 mb-4">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-base font-bold mt-2 mb-3">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-bold mt-2 mb-2">{children}</h3>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="pl-6 mb-4 space-y-1 list-disc">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="pl-6 mb-4 space-y-1 list-decimal">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li className="mb-1">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-bold">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  code: ({ children }: { children?: React.ReactNode }) => (
    <code
      className={cn(
        "px-1.5 py-0.5 rounded text-xs font-mono",
        role === MessageRole.user ? "bg-white/20" : "bg-fill-secondary text-text",
      )}
    >
      {children}
    </code>
  ),
})

/**
 * Component to render the markdown content of a message.
 */
const MessageContent = memo(
  ({ role, parts }: { role: UIMessage["role"]; parts: UIMessage["parts"] }) => {
    const content = useMemo(() => getMessageText(parts), [parts])
    const components = useMemo(() => getMarkdownComponents(role), [role])

    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    )
  },
)
MessageContent.displayName = "MessageContent"

/**
 * Define the data types for type safety in message parts
 */
interface ChatDataTypes {
  sources: ChatSource[]
  [key: string]: unknown
}

// Custom UIMessage type with our data parts
type ChatUIMessage = UIMessage<never, ChatDataTypes>

/**
 * Memoized Message Item with simplified structure and no nested providers.
 */
const MessageItem = memo(
  ({
    m,
    user,
    assistantAvatar,
  }: {
    m: ChatUIMessage
    user: TUser | null
    assistantAvatar: string
  }) => {
    const sourcesPart = m.parts.find((part) => isDataUIPart(part) && part.type === "data-sources")
    const messageSources =
      sourcesPart && isDataUIPart(sourcesPart) ? (sourcesPart.data as ChatSource[]) : undefined

    const isUser = m.role === "user"

    return (
      <Flex gap={16} className="w-full" style={{ flexDirection: isUser ? "row-reverse" : "row" }}>
        <div className="shrink-0 pt-1">
          <Avatar
            size={40}
            icon={
              isUser ? (
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
                <Image src={assistantAvatar} alt="Félix" width={40} height={40} />
              )
            }
            className={cn(
              isUser
                ? user?.image
                  ? "bg-transparent border-none"
                  : "bg-primary"
                : "bg-container border border-border overflow-visible!",
            )}
          />
        </div>

        <Flex vertical gap={8} className="max-w-[80%] min-w-0" align={isUser ? "end" : "start"}>
          <Flex align="center" gap={8}>
            <Text strong className="text-[11px] uppercase tracking-widest opacity-40 px-1">
              {isUser ? (user?.name ?? "Vous") : "Félix"}
            </Text>

            {!isUser && m.id !== "welcome" && messageSources && (
              <Tooltip title="Cette réponse s'appuie directement sur le référentiel officiel.">
                <Tag
                  color="processing"
                  variant="filled"
                  icon={<ShieldCheck size={12} className="mr-1" />}
                  className="m-0 py-0 px-2 flex items-center text-[10px] font-bold uppercase tracking-wider bg-primary/10 dark:bg-info/20 text-primary dark:text-info border-none shadow-none"
                >
                  Vérifié
                </Tag>
              </Tooltip>
            )}
          </Flex>

          <div
            className={cn(
              "px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm",
              isUser
                ? "bg-primary rounded-tr-none text-white"
                : "bg-container text-text rounded-tl-none border border-border",
            )}
          >
            <div className="wrap-break-word">
              <MessageContent role={m.role} parts={m.parts} />
            </div>
          </div>

          {/* Citations UI Component */}
          {!isUser && <Citations sources={messageSources} />}
        </Flex>
      </Flex>
    )
  },
)
MessageItem.displayName = "MessageItem"

/**
 * Memoized list of messages.
 */
const MessageList = memo(
  ({
    messages,
    user,
    assistantAvatar,
  }: {
    messages: ChatUIMessage[]
    user: TUser | null
    assistantAvatar: string
  }) => {
    return (
      <>
        {messages.map((m) => (
          <MessageItem key={m.id} m={m} user={user} assistantAvatar={assistantAvatar} />
        ))}
      </>
    )
  },
)
MessageList.displayName = "MessageList"

const WELCOME_DATA = {
  id: "welcome",
  role: "assistant" as const,
  parts: [
    {
      type: "text" as const,
      text: "Bonjour ! Je suis **Félix**, votre assistant **Lighthouse**. 🕊️\n\nEn tant qu'expert du programme scolaire belge (*Pacte pour un Enseignement d'excellence*), je suis là pour prendre de la hauteur et vous éclairer dans la planification de vos activités en maternelle.\n\nPosez-moi vos questions, je chercherai les réponses directement dans le référentiel officiel pour vous aider à garder le cap !",
    },
  ],
}

/**
 * Isolated component to handle the chat streaming logic and UI.
 * This prevents the sidebar and page layout from re-rendering on every token.
 */
const ChatInterface = ({
  initialConversationId,
  user,
  assistantAvatar,
}: {
  initialConversationId?: string
  user: TUser | null
  assistantAvatar: string
}) => {
  const queryClient = useQueryClient()
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId)
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [input, setInput] = useLocalStorage("assistant-draft", "")
  const [historyIndex, setHistoryIndex] = useState(-1)
  const prevUrlChatIdRef = useRef<string | undefined>(undefined) // Important: initialize to undefined to trigger load
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  /**
   * Scroll logic:
   * - "smooth" for new message additions (user or initial assistant)
   * - "auto" for following the stream (if already at bottom)
   */
  const scrollToBottom = useCallback((force = false, behavior: ScrollBehavior = "auto") => {
    const container = scrollContainerRef.current
    if (!container) return

    const threshold = 150
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold

    if (force || isNearBottom) {
      window.requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior,
        })
      })
    }
  }, [])

  const { messages, sendMessage, status, error, setMessages, stop } = useChat<ChatUIMessage>({
    experimental_throttle: 250, // Heavily throttle for maximum Firefox stability
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
        if (id && id !== conversationId) {
          window.history.replaceState(null, "", `/assistant/${id}`)
          setConversationId(id)
          prevUrlChatIdRef.current = id
          queryClient.invalidateQueries({ queryKey: getGetChatConversationsQueryKey() })
        }

        return response
      },
    }),
    messages: [],
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: getGetChatUsageQueryKey() })
      queryClient.invalidateQueries({ queryKey: getGetChatConversationsQueryKey() })
    },
  })

  // Smart Auto-scroll Effect
  const lastMessagesLength = useRef(messages.length)
  useEffect(() => {
    const isNewMessage = messages.length > lastMessagesLength.current
    const isStreaming = status === "streaming"

    if (isNewMessage) {
      // A new message block was added: smooth scroll to it
      scrollToBottom(true, "smooth")
    } else if (isStreaming) {
      // We are streaming tokens: follow only if already at bottom (pin to bottom)
      scrollToBottom(false, "auto")
    }

    lastMessagesLength.current = messages.length
  }, [messages, status, scrollToBottom])

  const loadConversation = useCallback(
    async (id: string) => {
      setIsInitialLoading(true)
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
                ...(m.sources ? [{ type: "data-sources" as const, data: m.sources }] : []),
              ],
              createdAt: new Date(m.createdAt),
            }))
            setMessages(uiMessages)
            setConversationId(id)
            setHistoryIndex(-1)

            // Immediate scroll to bottom after historical messages render
            setTimeout(() => scrollToBottom(true, "auto"), 50)
          }
        }
      } catch (err) {
        console.error("Failed to load conversation", err)
      } finally {
        setIsInitialLoading(false)
      }
    },
    [setMessages, scrollToBottom],
  )

  const resetToNewChat = useCallback(() => {
    setConversationId(undefined)
    setMessages([])
    setHistoryIndex(-1)
    // Clear scroll position
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0
  }, [setMessages])

  useEffect(() => {
    if (initialConversationId !== prevUrlChatIdRef.current) {
      if (initialConversationId) {
        loadConversation(initialConversationId)
      } else {
        resetToNewChat()
      }
      prevUrlChatIdRef.current = initialConversationId
    }
  }, [initialConversationId, loadConversation, resetToNewChat])

  const userMessages = useMemo(() => {
    return messages.filter((m) => m.role === "user")
  }, [messages])

  const isLoading = status !== "ready"
  const isStreaming = status === "streaming"

  const onFinish = (e?: React.SubmitEvent | React.MouseEvent) => {
    e?.preventDefault()

    if (isStreaming) {
      stop()
      return
    }

    if (input.trim() && !isLoading) {
      sendMessage({ text: input }, { body: { conversationId } })
      setInput("")
      setHistoryIndex(-1)

      // Scroll to bottom when user sends a message
      setTimeout(() => scrollToBottom(true), 50)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onFinish()
      return
    }
    if (userMessages.length === 0) return
    if (e.key === "ArrowUp") {
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
          setInput("")
        }
      }
    }
  }

  return (
    <Flex vertical className="flex-1 relative overflow-hidden h-full">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-8 scrollbar-hide">
        {isInitialLoading ? (
          <Flex align="center" justify="center" className="h-full w-full">
            <Spin size="large" />
          </Flex>
        ) : (
          <Space orientation="vertical" size={32} className="w-full max-w-5xl mx-auto flex">
            <Flex gap={16} className="w-full">
              <div className="shrink-0 pt-1">
                <Avatar
                  size={40}
                  icon={<Image src={assistantAvatar} alt="Félix" width={40} height={40} priority />}
                  className="bg-container border border-border overflow-visible!"
                />
              </div>
              <Flex vertical gap={8} className="max-w-[80%] min-w-0">
                <Flex align="center" gap={8}>
                  <Text strong className="text-[11px] uppercase tracking-widest opacity-40 px-1">
                    Félix
                  </Text>
                </Flex>
                <div className="px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm bg-container text-text rounded-tl-none border border-border">
                  <div className="wrap-break-word">
                    <MessageContent role="assistant" parts={WELCOME_DATA.parts} />
                  </div>
                </div>
              </Flex>
            </Flex>

            <MessageList messages={messages} user={user} assistantAvatar={assistantAvatar} />

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <Flex gap={16}>
                <div className="shrink-0">
                  <Avatar
                    size={40}
                    icon={<Image src={assistantAvatar} alt="Félix" width={40} height={40} />}
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
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
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
          </Space>
        )}
      </div>

      <div className="px-4 pt-4 bg-layout sticky bottom-0 border-t border-border/20 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.05)]">
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
            onClick={onFinish}
            disabled={!isStreaming && (!input.trim() || isLoading)}
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
    </Flex>
  )
}

const AssistantPage = () => {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const { user } = useAuth()
  const params = useParams<{ chatId?: string[] }>()
  const urlChatId = params.chatId?.[0]

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

  return (
    <Flex className="h-full w-full overflow-hidden bg-layout relative">
      <Flex vertical className="flex-1 relative overflow-hidden h-full">
        {/* Toggle Sidebar Button */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            type="text"
            icon={isSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-text/60 hover:text-text bg-container shadow-sm border border-border/20"
          />
        </div>

        {/* Chat Interface - State is localized here */}
        <ChatInterface
          initialConversationId={urlChatId}
          user={user as TUser | null}
          assistantAvatar={assistantAvatar}
        />
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
          <MemoizedHistorySidebar
            currentConversationId={urlChatId}
            onSelectConversation={(id) => {
              router.push(`/assistant/${id}`)
              setIsSidebarOpen(false)
            }}
            onNewChat={() => {
              router.push("/assistant")
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
            <MemoizedHistorySidebar
              currentConversationId={urlChatId}
              onSelectConversation={(id) => router.push(`/assistant/${id}`)}
              onNewChat={() => router.push("/assistant")}
            />
          </div>
        </div>
      )}
    </Flex>
  )
}

export default AssistantPage
