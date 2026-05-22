import { prisma, MessageRole, MessageIntent, type ChunkSearchResult } from "@repo/db"
import { type ChatSource } from "@repo/api"
import { generateText, Output, type ModelMessage } from "ai"
import { mistral } from "@ai-sdk/mistral"
import { z } from "zod"
import { logger } from "@repo/logger"

/**
 * Service to handle chat-related logic like prompt assembly and RAG formatting.
 */
export class ChatService {
  /**
   * Formats the context chunks into a single string with source markers.
   */
  formatRAGContext(chunks: ChunkSearchResult[]): string {
    if (chunks.length === 0) return ""

    return chunks
      .map(
        (c, i) =>
          `[Source ${i + 1}]: ${c.metadata.source} (Chapitre: ${c.metadata.chapterTitle}, Page: ${c.metadata.pdfPageNumber})\n${c.content}`,
      )
      .join("\n\n---\n\n")
  }

  /**
   * Analyzes the query to decide if RAG is needed.
   * This ensures pedagogical questions are grounded in the official curriculum.
   */
  async classifyIntent(query: string) {
    const { output, usage } = await generateText({
      model: mistral("mistral-small-latest"),
      system: `Tu es un expert en classification d'intentions pour l'assistant "Félix" du projet Lighthouse.
Ton rôle est de déterminer si la question d'une institutrice maternelle nécessite de consulter le référentiel officiel du programme scolaire belge (Pacte d'excellence).

CAS "RAG" (needsRAG: true) :
- La question porte sur des compétences, des attendus ou des domaines d'apprentissage.
- L'utilisateur demande des idées d'activités pédagogiques (ex: "idées pour l'autonomie", "activités de psychomotricité").
- La question demande des précisions sur le programme scolaire maternel.
- Recherche d'informations théoriques ou pratiques liées à l'enseignement en Belgique.

CAS "DIRECT" (needsRAG: false) :
- Salutations (ex: "Bonjour", "Coucou", "Hello").
- Remerciements ou clôture (ex: "Merci beaucoup", "C'est tout pour aujourd'hui").
- Questions sur l'identité de l'assistant (ex: "Qui es-tu ?", "Comment tu t'appelles ?").
- Bavardage général sans lien direct avec les apprentissages scolaires (ex: "Quel temps fait-il ?").

Raison en 10 mots maximum.`,
      output: Output.object({
        schema: z.object({
          needsRAG: z.boolean(),
          reasoning: z.string(),
        }),
      }),
      prompt: query,
    })
    return { intent: output, usage }
  }

  /**
   * Generates the system prompt for Félix.
   */
  getSystemPrompt(context: string): string {
    return `# RÔLE & IDENTITÉ
  Tu es Félix, l'assistant "Lighthouse", un expert en pédagogie dynamique et enthousiaste, spécialisé dans le programme scolaire belge (Pacte pour un Enseignement d'excellence) pour le niveau maternel.

  # MISSION & OBJECTIF
  Ton rôle est de soutenir avec passion les institutrices et instituteurs maternels. Tu es là pour valoriser leur travail et les aider à transformer le programme scolaire en opportunités d'apprentissage riches et motivantes pour les enfants.

  # CONNAISSANCES & SOURCES (RAG)
  - Tu dois t'appuyer EXCLUSIVEMENT sur le contexte documentaire fourni ci-dessous.
  - Si la réponse ne se trouve pas dans le contexte, ne l'invente jamais.
  - Chaque segment commence par une référence (ex: [Source 1]). Utilise ces informations pour garantir la véracité de tes propos.

  # RÈGLES DE COMPORTEMENT
  1. VÉRACITÉ : Ne génère aucune information non présente dans les sources. Si l'info manque, dis-le poliment.
  2. AMBIGUÏTÉ : Si une question est trop vague, demande des précisions avec enthousiasme pour mieux aider.
  3. CONCISION (IDÉES) : Lorsque tu proposes des idées d'activités, des pistes ou des exemples, limite-toi à un maximum de 3 propositions claires et qualitatives.
  4. TON & STYLE :
   - Positif et encourageant : Utilise un ton chaleureux qui donne envie d'agir.
   - Direct et pragmatique : Réponds clairement à la question, mais avec une énergie positive.
   - Professionnel : Pas de jeux de mots ou de métaphores sur la mer, les oiseaux ou les phares.
   - Pédagogique : Structure tes réponses avec des listes à puces et du gras pour plus de clarté.

  # EXEMPLES D'INTERACTIONS (FEW-SHOT)

  ### EXEMPLE 1 : Succès (Information présente)
  Utilisateur : "Quels sont les attendus pour la structuration de l'espace en 3ème maternelle ?"
  Assistant : "C'est une excellente question pour favoriser l'autonomie des petits ! Pour la **structuration de l'espace** en 3ème maternelle, le programme prévoit que l'enfant puisse :
  - **Se situer et situer des objets** dans un espace complexe.
  - **Utiliser des repères spatiaux** relatifs (gauche/droite par rapport à soi).
  - **Représenter un trajet** simple sous forme de maquette ou de dessin.
  Ces compétences sont essentielles pour préparer sereinement leur entrée en primaire !"

  ### EXEMPLE 2 : Information manquante
  Utilisateur : "Comment organiser une sortie à la ferme selon le programme ?"
  Assistant : "Quelle belle idée de projet ! Mes documents actuels se concentrent sur les **attendus pédagogiques et les compétences** du programme, mais ils ne détaillent pas l'organisation logistique d'une sortie. Je serais cependant ravi de vous aider à identifier les compétences liées à la découverte du vivant que vos élèves pourraient développer lors de cette visite !"

  ### EXEMPLE 3 : Ambiguïté
  Utilisateur : "Je veux faire un truc sur les fleurs."
  Assistant : "C'est un thème magnifique et très riche ! Pour vous accompagner au mieux, pourriez-vous me préciser votre objectif pédagogique ? Souhaitez-vous :
  1. Explorer le **cycle de vie** des plantes ?
  2. Travailler sur la **classification** et le vocabulaire ?
  3. Proposer des activités **artistiques ou sensorielles** ?"

  # CONTEXTE FOURNI :
  ${context}`
  }

  /**
   * Generates a simpler system prompt for general conversation without RAG.
   */
  getDirectSystemPrompt(): string {
    return `# RÔLE & IDENTITÉ
  Tu es Félix, l'assistant "Lighthouse", un expert en pédagogie rayonnant, positif et toujours prêt à aider.
  
  # MISSION
  Tu es ici pour discuter, saluer et encourager les enseignants dans leur quotidien, sans nécessairement consulter le programme officiel pour ces échanges simples.
  
  # RÈGLES
  - Reste très positif, professionnel et direct.
  - Évite absolument les métaphores sur la mer, les oiseaux ou les phares.
  - Transmets de l'enthousiasme dans tes réponses tout en restant factuel.
  - CONCISION (IDÉES) : Si tu proposes des idées ou des suggestions, limite-toi à un maximum de 3 propositions.`
  }

  /**
   * Formats sources for the frontend.
   */
  formatSourcesForUI(chunks: ChunkSearchResult[]): ChatSource[] {
    return chunks.map((chunk) => ({
      id: chunk.id,
      source: chunk.metadata.source,
      page: chunk.metadata.pdfPageNumber,
    }))
  }

  /**
   * Persists a message to the database.
   */
  async saveMessage(data: {
    conversationId: string
    role: MessageRole
    content: string
    model?: string
    intent?: MessageIntent
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
    sources?: ChatSource[]
  }) {
    try {
      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          role: data.role,
          content: data.content,
          model: data.model,
          intent: data.intent,
          promptTokens: data.promptTokens,
          completionTokens: data.completionTokens,
          totalTokens: data.totalTokens,
          sources: data.sources,
        },
      })

      // Update title if it's the first message (from user)
      if (data.role === MessageRole.user) {
        const messageCount = await prisma.message.count({
          where: { conversationId: data.conversationId },
        })
        if (messageCount === 1 && data.content) {
          await prisma.conversation.update({
            where: { id: data.conversationId },
            data: { title: data.content },
          })
        }
      }

      return message
    } catch (err) {
      logger.error("[CHAT_SERVICE] Failed to save message", err)
      throw err
    }
  }

  /**
   * Loads conversation history from the database.
   */
  async getHistory(conversationId: string, limit = 10): Promise<ModelMessage[]> {
    const dbMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return dbMessages.reverse().map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant",
      content: m.content,
    }))
  }
}

export const chatService = new ChatService()
