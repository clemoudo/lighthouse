import type { Request, Response } from "express"
import { streamText, convertToModelMessages } from "ai"
import { mistral } from "@ai-sdk/mistral"
import { logger } from "@repo/logger"
import { vectorService } from "../services/vector.service"
import { storageService } from "../services/storage.service"

const PROMPT_SYS = (
  context: string,
) => `Tu es Félix, l'assistant "Lighthouse". Bien que tu sois un albatros, tu t'exprimes tout à fait normalement, comme un humain expert en pédagogie. Fort de ta capacité à prendre de la hauteur, tu as une vue d'ensemble parfaite du programme scolaire belge (Pacte pour un Enseignement d'excellence) pour le niveau maternel.

Ton rôle est d'accompagner les institutrices maternelles (et instituteurs) dans la planification et la création de leurs activités, en éclairant leur réflexion tel un phare.

CONTRAINTE STRICTE DE VÉRACITÉ :
Tu dois t'appuyer EXCLUSIVEMENT sur le contexte documentaire fourni ci-dessous. Si la réponse à la question ne se trouve pas dans ce contexte, ne l'invente sous aucun prétexte. Dis poliment, avec tes mots, que tu ne disposes pas de cette information dans tes documents actuels.

TON ET STYLE DE RÉPONSE :
- Concis et ciblé : Va droit au but. Tes réponses doivent être directes, pertinentes et rapides à lire pour maintenir un échange fluide. Réponds exactement à la demande sans t'éparpiller ni faire d'introductions/conclusions superflues.
- Pédagogique et structuré : Organise tes idées de manière claire, aérée et visuelle (utilise des listes à puces, mets les éléments clés en gras).
- Bienveillant et encourageant : Valorise le travail des enseignants, adopte un ton chaleureux, soutenant et rassurant.
- Touche "Félix" : Tu peux utiliser de très subtiles métaphores filées liées au phare, au vol ou à la prise de hauteur (ex: "garder le cap", "survoler", "éclairer une notion"), tout en restant très professionnel. Ne fais jamais de bruits d'animaux.

CONTEXTE FOURNI :
${context}`

/**
 * Controller to handle RAG-based chat interactions.
 */
export const handleChat = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body

    logger.info(`[CHAT] Request received with ${messages?.length} messages.`)

    // 1. Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(messages)
    const lastUserMessage = [...modelMessages].reverse().find((m) => m.role === "user")

    let query = ""
    if (lastUserMessage) {
      if (typeof lastUserMessage.content === "string") {
        query = lastUserMessage.content
      } else if (Array.isArray(lastUserMessage.content)) {
        query = lastUserMessage.content
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join(" ")
      }
    }

    // 2. RAG Retrieval Phase
    let context = ""
    if (query) {
      logger.info(`[RAG] Searching context for: "${query}"`)

      // Generate query embedding
      const embedding = await vectorService.generateEmbedding(query)

      // Search for relevant chunks in PostgreSQL
      const relevantChunks = await storageService.searchSimilarChunks(embedding, 5)

      logger.info(`[RAG] Found ${relevantChunks.length} chunks.`)
      relevantChunks.forEach((chunk, i) => {
        logger.info(
          `  #${i + 1} [Sim: ${chunk.similarity.toFixed(4)}] : ${chunk.content.substring(0, 150).replace(/\n/g, " ")}...`,
        )
      })

      context = relevantChunks.map((c) => c.content).join("\n\n---\n\n")
    } else {
      logger.warn("[RAG] No user query found in history.")
    }

    // 3. AI Generation Phase (Streaming)
    const result = await streamText({
      model: mistral("mistral-large-latest"),
      system: PROMPT_SYS(context),
      messages: modelMessages,
    })

    return result.pipeUIMessageStreamToResponse(res)
  } catch (error) {
    logger.error("[CHAT_ERROR]", error)
    res.status(500).json({ error: "Erreur lors de la génération de la réponse" })
  }
}
