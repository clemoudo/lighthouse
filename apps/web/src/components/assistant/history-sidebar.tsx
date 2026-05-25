"use client"

import {
  useGetChatConversations,
  useDeleteChatConversationsId,
  useGetChatUsage,
} from "@/api/generated/lighthouse"
import { Button, Typography, Popconfirm, Flex, Spin, Empty, Progress } from "antd"
import { MessageSquare, Plus, Trash2, History, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"
import "dayjs/locale/fr"

dayjs.locale("fr")

const { Text } = Typography

interface HistorySidebarProps {
  currentConversationId?: string
  onSelectConversation: (id: string) => void
  onNewChat: () => void
}

export const HistorySidebar = ({
  currentConversationId,
  onSelectConversation,
  onNewChat,
}: HistorySidebarProps) => {
  const { data: conversationsResponse, isLoading, refetch } = useGetChatConversations()
  const deleteMutation = useDeleteChatConversationsId()
  const { data: usageResponse, isLoading: isLoadingUsage } = useGetChatUsage()

  const usage = usageResponse?.status === 200 ? usageResponse.data : undefined

  const conversations =
    conversationsResponse?.status === 200 ? conversationsResponse.data.conversations : []

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id })
    refetch()
    if (id === currentConversationId) {
      onNewChat()
    }
  }

  return (
    <Flex vertical className="h-full bg-container">
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        <Flex align="center" gap={8} className="px-3 py-4 opacity-50">
          <History size={14} />
          <Text className="text-[10px] uppercase font-bold tracking-wider">Historique</Text>
        </Flex>

        {isLoading ? (
          <Flex justify="center" align="middle" className="py-8">
            <Spin size="small" />
          </Flex>
        ) : conversations.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<Text className="opacity-30 text-xs">Aucune discussion</Text>}
            />
          </div>
        ) : (
          <Flex vertical gap={4}>
            {conversations.map((conv) => (
              <Flex
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                align="center"
                gap={12}
                className={cn(
                  "group px-3 py-3 rounded-xl cursor-pointer transition-all hover:bg-fill-secondary",
                  currentConversationId === conv.id
                    ? "bg-fill-secondary border-border shadow-sm"
                    : "border-transparent",
                )}
              >
                <Flex
                  align="center"
                  justify="center"
                  className={cn(
                    "shrink-0 w-8 h-8 rounded-lg transition-colors",
                    currentConversationId === conv.id
                      ? "bg-primary text-white"
                      : "bg-fill-secondary text-text opacity-40 group-hover:opacity-100",
                  )}
                >
                  <MessageSquare size={16} />
                </Flex>

                <Flex vertical flex={1} className="min-w-0">
                  <Text
                    strong
                    ellipsis={{ tooltip: true }}
                    className={cn(
                      "text-sm transition-colors",
                      currentConversationId === conv.id
                        ? "text-primary dark:text-info"
                        : "text-text",
                    )}
                  >
                    {conv.title || "Nouvelle discussion"}
                  </Text>
                  <Text className="text-[10px] opacity-40">
                    {dayjs(conv.updatedAt).format("D MMMM, HH:mm")}
                  </Text>
                </Flex>

                <Popconfirm
                  title="Supprimer la discussion ?"
                  description="Cette action est irréversible."
                  onConfirm={(e) => {
                    e?.stopPropagation()
                    handleDelete(conv.id)
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText="Supprimer"
                  cancelText="Annuler"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<Trash2 size={14} />}
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-40 md:opacity-0 md:group-hover:opacity-40 hover:opacity-100! hover:text-error! transition-all"
                  />
                </Popconfirm>
              </Flex>
            ))}
          </Flex>
        )}
      </div>

      {/* FOOTER - USAGE & ACTION */}
      <div className="p-4 border-t border-border shrink-0 bg-container shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        {/* Usage Quota Display */}
        {isLoadingUsage ? (
          <div className="px-1 text-center opacity-40 mb-4">
            <Spin size="small" className="mb-1" />
            <div className="text-[9px] uppercase font-bold">Mise à jour...</div>
          </div>
        ) : usage ? (
          <div className="px-1 mb-4">
            <Flex justify="space-between" align="center" className="mb-2">
              <Flex align="center" gap={6}>
                <Zap size={12} className="text-primary fill-primary" />
                <Text className="text-[10px] uppercase font-bold opacity-60">Usage quotidien</Text>
              </Flex>
              <Text className="text-[11px] font-bold">
                {usage.count} / {usage.limit}
              </Text>
            </Flex>
            <Progress
              percent={Math.min(100, (usage.count / usage.limit) * 100)}
              showInfo={false}
              size="small"
              strokeColor={usage.count >= usage.limit ? "#ff4d4f" : "#1677ff"}
              className="m-0"
            />
          </div>
        ) : (
          <div className="px-1 text-center opacity-30 italic text-[10px] mb-4">
            Quota indisponible ({usageResponse?.status || "ERR"})
          </div>
        )}

        <Button
          type="primary"
          icon={<Plus size={16} />}
          block
          onClick={onNewChat}
          className="flex items-center justify-center gap-2 h-11 rounded-xl shadow-sm"
        >
          Nouvelle discussion
        </Button>
      </div>
    </Flex>
  )
}
