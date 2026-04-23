"use client"

import { useState, useRef, useEffect } from "react"
import { Send, User, Sparkles, FileText } from "lucide-react"
import { Input, Button, Card, Tag, Avatar, Typography } from "antd"
import { cn } from "@/lib/utils"

const { Text } = Typography

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: { id: string; title: string; page: number }[]
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Bonjour ! Je suis votre assistant pédagogique Lighthouse. Je peux vous aider à explorer le programme scolaire maternel et à planifier vos activités. Que souhaitez-vous savoir aujourd'hui ?",
  },
  {
    id: "2",
    role: "user",
    content:
      "Quelles sont les compétences liées à l'observation de la nature et du vivant en cycle 1 ?",
  },
  {
    id: "3",
    role: "assistant",
    content:
      "Pour le cycle 1 (maternelle), les compétences liées à la nature et au vivant se trouvent principalement dans le domaine 'Explorer le monde'. Voici les points clés identifiés dans le référentiel :",
    sources: [
      {
        id: "vivant-1",
        title: "Reconnaître et classer les animaux selon leurs caractéristiques",
        page: 85,
      },
      {
        id: "vivant-2",
        title: "Connaître les besoins essentiels de quelques animaux et végétaux",
        page: 86,
      },
    ],
  },
  {
    id: "4",
    role: "assistant",
    content:
      "Vous pouvez par exemple organiser des activités d'observation dans le jardin de l'école ou créer un petit potager pour travailler la compétence sur les besoins des végétaux.",
  },
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Mock user data
  const user = {
    name: "Utilisateur",
    avatar: null,
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, newMessage])
    setInput("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "C'est une excellente question. Je recherche dans le référentiel... En lien avec votre demande, le programme souligne l'importance de manipuler et d'expérimenter pour construire ces premières notions.",
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen">
      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="mx-auto max-w-3xl space-y-6 pb-20">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 lg:gap-4",
                message.role === "user" ? "flex-row-reverse" : "flex-row",
              )}
            >
              <Avatar
                className={cn(
                  "shrink-0",
                  message.role === "assistant" ? "bg-transparent" : "bg-primary-soft",
                )}
                size={40}
                icon={message.role === "assistant" ? null : <User size={20} />}
                src={message.role === "assistant" ? "/albatross.png" : user.avatar}
              />

              <div
                className={cn(
                  "flex flex-col gap-2 max-w-[85%] sm:max-w-[75%]",
                  message.role === "user" ? "items-end" : "items-start",
                )}
              >
                <Card
                  variant="borderless"
                  className={cn(
                    "shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-white rounded-tr-none"
                      : "bg-background text-foreground rounded-tl-none border border-border",
                  )}
                  styles={{ body: { padding: "12px 16px" } }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap m-0">
                    {message.content}
                  </p>
                </Card>

                {message.sources && message.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {message.sources.map((source) => (
                      <Tag
                        key={source.id}
                        icon={<FileText size={12} className="mr-1" />}
                        className="flex items-center bg-primary-soft text-primary-dark border-primary-soft px-2 py-1 rounded-full m-0"
                      >
                        <span className="text-[10px] font-bold uppercase mr-1">{source.title}</span>
                        <span className="text-[10px] opacity-60">p.{source.page}</span>
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-md p-4 lg:p-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2">
            <Input
              size="large"
              placeholder="Posez votre question sur le programme..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={handleSend}
              suffix={<Sparkles size={16} className="text-primary opacity-40" />}
              className="flex-1"
            />
            <Button
              type="primary"
              size="large"
              icon={<Send size={18} />}
              onClick={handleSend}
              className="shrink-0 flex items-center justify-center"
            />
          </div>
          <Text type="secondary" className="mt-2 text-[10px] text-center block w-full">
            Lighthouse peut faire des erreurs. Vérifiez toujours les informations importantes dans
            le référentiel officiel.
          </Text>
        </div>
      </div>
    </div>
  )
}
