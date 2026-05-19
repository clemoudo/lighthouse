import { PrismaClient, Prisma } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { env } from "./env"
import { 
  ParsedContentSchema, 
  ChapterMetadataSchema, 
  ChunkMetadataSchema,
  type ParsedContent,
  type ChapterMetadata,
  type ChunkMetadata
} from "./types"

export * from "@prisma/client"
export * from "./types"

const pool = new Pool({ connectionString: env.DATABASE_URL })
const adapter = new PrismaPg(pool)

export interface ChunkSearchResult {
  id: string
  content: string
  chapterId: string
  similarity: number
  metadata: ChunkMetadata
}

/**
 * Extension Prisma pour gérer pgvector et le typage fort des colonnes JSON.
 */
const extendedPrisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
}).$extends({
  result: {
    document: {
      parsedContent: {
        needs: { parsedContent: true },
        compute(doc) {
          if (!doc.parsedContent) return null
          return ParsedContentSchema.parse(doc.parsedContent) as ParsedContent
        },
      },
    },
    chapter: {
      metadata: {
        needs: { metadata: true },
        compute(chapter) {
          if (!chapter.metadata) return null
          return ChapterMetadataSchema.parse(chapter.metadata) as ChapterMetadata
        },
      },
    },
    chunk: {
      metadata: {
        needs: { metadata: true },
        compute(chunk) {
          if (!chunk.metadata) return null
          return ChunkMetadataSchema.parse(chunk.metadata) as ChunkMetadata
        },
      },
    },
  },
  model: {
    chunk: {
      /**
       * Insertion massive de chunks avec embeddings.
       */
      async createManyWithVectors(
        chunks: {
          content: string | null
          embedding: number[] | null
          chapterId: string
          metadata?: ChunkMetadata
        }[],
      ) {
        if (chunks.length === 0) return

        // On crée un tableau de valeurs SQL pour une seule requête bulk insert très performante
        const values = chunks.map((chunk) => {
          const vectorStr = chunk.embedding ? `[${chunk.embedding.join(",")}]` : null
          const metadataJson = chunk.metadata ? JSON.stringify(chunk.metadata) : null

          if (vectorStr) {
            return Prisma.sql`(uuidv7(), ${chunk.content}, ${vectorStr}::vector, ${chunk.chapterId}::uuid, ${metadataJson}::jsonb, NOW(), NOW())`
          }

          return Prisma.sql`(uuidv7(), ${chunk.content}, NULL, ${chunk.chapterId}::uuid, ${metadataJson}::jsonb, NOW(), NOW())`
        })

        // On utilise extendedPrisma.$executeRaw avec Prisma.join pour garantir la sécurité
        return extendedPrisma.$executeRaw`
          INSERT INTO chunk (id, content, embedding, "chapterId", metadata, "createdAt", "updatedAt")
          VALUES ${Prisma.join(values)}
        `
      },

      /**
       * Recherche par similarité cosinus.
       */
      async search(embedding: number[], limit = 5): Promise<ChunkSearchResult[]> {
        const vectorStr = `[${embedding.join(",")}]`
        return extendedPrisma.$queryRaw<ChunkSearchResult[]>`
          SELECT id, content, "chapterId", metadata, 1 - (embedding <=> ${vectorStr}::vector) as similarity
          FROM chunk
          ORDER BY embedding <=> ${vectorStr}::vector
          LIMIT ${limit}
        `
      }
    },
  },
})

const globalForPrisma = globalThis as unknown as {
  prisma: typeof extendedPrisma | undefined
}

const prisma = globalForPrisma.prisma ?? extendedPrisma

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export { prisma }
