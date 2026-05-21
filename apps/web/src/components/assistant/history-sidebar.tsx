"use client"

import { useGetChatConversations, useDeleteChatConversationsId } from "@/api/generated/lighthouse"
import { Button, Typography, Popconfirm, Flex, Spin, Empty } from "antd"
import { MessageSquare, Plus, Trash2, History } from "lucide-react"
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
    <Flex vertical className="h-full w-72 border-r border-border bg-container">
      <div className="p-4 border-b border-border">
        <Button
          type="primary"
          icon={<Plus size={16} />}
          block
          onClick={onNewChat}
          className="flex items-center justify-center gap-2 h-10 rounded-xl"
        >
          Nouvelle discussion
        </Button>
      </div>

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
                    className={cn(
                      "truncate text-sm transition-colors",
                      currentConversationId === conv.id ? "text-primary" : "text-text",
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
                    className="opacity-0 group-hover:opacity-40 hover:opacity-100! hover:text-error! transition-all"
                  />
                </Popconfirm>
              </Flex>
            ))}
          </Flex>
        )}
      </div>
    </Flex>
  )
}
