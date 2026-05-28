import { PrismaClient, Prisma } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { omit } from "lodash"
import { BadRequest } from "http-errors"
import { env } from "./env"
import {
  ParsedContentSchema,
  ChunkMetadataSchema,
  type ParsedContent,
  type ChunkMetadata,
} from "./types"
import { PAGINATION_LIMITS } from "@repo/api"

export * from "@prisma/client"
export * from "./types"

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.NODE_ENV === "production" ? 20 : 10,
})

pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err)
})

const adapter = new PrismaPg(pool)

export interface ChunkSearchResult {
  id: string
  content: string
  documentId: string
  similarity: number
  metadata: ChunkMetadata
}

export type PaginationMeta = {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type PaginatedResult<T> = {
  data: T[]
  meta: PaginationMeta
}

/**
 * Extension Prisma pour gérer pgvector, le typage fort des colonnes JSON
 * et la pagination générique optimisée.
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
    $allModels: {
      /**
       * Méthode générique pour la pagination.
       */
      async paginate<T, A>(
        this: T,
        args: Prisma.Exact<A, Prisma.Args<T, "findMany">> & {
          page?: number
          pageSize?: number
        },
      ): Promise<PaginatedResult<Prisma.Result<T, A, "findMany">>> {
        const {
          page = PAGINATION_LIMITS.MIN_PAGE,
          pageSize = PAGINATION_LIMITS.DEFAULT_PAGE_SIZE,
        } = args

        if (
          page < PAGINATION_LIMITS.MIN_PAGE ||
          pageSize < PAGINATION_LIMITS.MIN_PAGE_SIZE ||
          pageSize > PAGINATION_LIMITS.MAX_PAGE_SIZE
        ) {
          throw BadRequest(
            `Paramètres de pagination invalides. pageSize doit être entre ${PAGINATION_LIMITS.MIN_PAGE_SIZE}-${PAGINATION_LIMITS.MAX_PAGE_SIZE} et page doit être >= ${PAGINATION_LIMITS.MIN_PAGE}.`,
          )
        }

        const [data, total] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any).findMany({
            ...omit(args, ["page", "pageSize"]),
            skip: pageSize * (page - 1),
            take: pageSize,
          }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any).count({ where: (args as any).where }),
        ])

        return {
          data,
          meta: {
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
          },
        }
      },
    },
    chunk: {
      /**
       * Insertion massive de chunks avec embeddings.
       */
      async createManyWithVectors(
        chunks: {
          content: string | null
          embedding: number[] | null
          documentId: string
          metadata?: ChunkMetadata
        }[],
      ) {
        if (chunks.length === 0) return

        // On crée un tableau de valeurs SQL pour une seule requête bulk insert très performante
        const values = chunks.map((chunk) => {
          const vectorStr = chunk.embedding ? `[${chunk.embedding.join(",")}]` : null
          const metadataJson = chunk.metadata ? JSON.stringify(chunk.metadata) : null

          if (vectorStr) {
            return Prisma.sql`(uuidv7(), ${chunk.content}, ${vectorStr}::vector, ${chunk.documentId}::uuid, ${metadataJson}::jsonb, NOW(), NOW())`
          }

          return Prisma.sql`(uuidv7(), ${chunk.content}, NULL, ${chunk.documentId}::uuid, ${metadataJson}::jsonb, NOW(), NOW())`
        })

        return extendedPrisma.$executeRaw`
          INSERT INTO chunk (id, content, embedding, "documentId", metadata, "createdAt", "updatedAt")
          VALUES ${Prisma.join(values)}
        `
      },

      /**
       * Recherche par similarité cosinus.
       */
      async search(embedding: number[], limit = 5): Promise<ChunkSearchResult[]> {
        const vectorStr = `[${embedding.join(",")}]`
        return extendedPrisma.$queryRaw<ChunkSearchResult[]>`
          SELECT id, content, "documentId", metadata, 1 - (embedding <=> ${vectorStr}::vector) as similarity
          FROM chunk
          ORDER BY embedding <=> ${vectorStr}::vector
          LIMIT ${limit}
        `
      },
    },
  },
})

const globalForPrisma = globalThis as unknown as {
  prisma: typeof extendedPrisma | undefined
}

const prisma = globalForPrisma.prisma ?? extendedPrisma

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export { prisma }
