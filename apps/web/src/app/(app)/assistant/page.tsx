"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles, FileText } from "lucide-react"
import { Input, Button, Card, Chip, Avatar, ScrollShadow } from "@heroui/react"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"

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
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen bg-default-50">
      <PageHeader
        title="Assistant IA"
        subtitle="Aide à la planification"
        description="Posez vos questions sur le programme et obtenez des réponses basées sur le référentiel officiel."
        icon={Bot}
      />

      {/* Chat Area */}
      <ScrollShadow ref={scrollRef} className="flex-1 p-4 lg:p-8 space-y-6">
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
                  "shrink-0 shadow-sm",
                  message.role === "assistant" ? "bg-primary text-primary-fg" : "bg-default-200",
                )}
                size="sm"
              >
                {message.role === "assistant" ? (
                  <Bot className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Avatar>

              <div
                className={cn(
                  "flex flex-col gap-2 max-w-[85%] sm:max-w-[75%]",
                  message.role === "user" ? "items-end" : "items-start",
                )}
              >
                <Card
                  className={cn(
                    "p-4 border-none shadow-sm rounded-2xl",
                    message.role === "user"
                      ? "bg-accent/20 text-accent-950 rounded-tr-none border border-accent/20"
                      : "bg-background text-foreground rounded-tl-none border border-default-200",
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </Card>

                {message.sources && message.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {message.sources.map((source) => (
                      <Chip
                        key={source.id}
                        size="sm"
                        variant="soft"
                        className="bg-primary/10 text-primary-700 border border-primary/20 h-auto py-1 px-2"
                      >
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3 w-3" />
                          <span className="text-[10px] font-bold uppercase truncate max-w-[120px]">
                            {source.title}
                          </span>
                          <span className="text-[10px] opacity-60">p.{source.page}</span>
                        </div>
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollShadow>

      {/* Input Area */}
      <div className="sticky bottom-0 border-t border-default-200 bg-background/80 backdrop-blur-md p-4 lg:p-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2">
            <Input
              placeholder="Posez votre question sur le programme..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
              fullWidth
              render={(props) => (
                <div className="relative w-full">
                  <input {...props} className={cn(props.className, "pr-12")} />
                  <Sparkles className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40 pointer-events-none" />
                </div>
              )}
            />
            <Button
              variant="primary"
              isIconOnly
              onPress={handleSend}
              className="shrink-0 shadow-sm"
              aria-label="Envoyer"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-center text-default-400">
            Lighthouse peut faire des erreurs. Vérifiez toujours les informations importantes dans
            le référentiel officiel.
          </p>
        </div>
      </div>
    </div>
  )
}
