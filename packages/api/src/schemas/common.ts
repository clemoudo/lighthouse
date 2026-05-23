import { z } from "zod"
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"

extendZodWithOpenApi(z)

export const PAGINATION_LIMITS = {
  MIN_PAGE: 1,
  MIN_PAGE_SIZE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const

export const PaginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(PAGINATION_LIMITS.MIN_PAGE)
    .default(PAGINATION_LIMITS.MIN_PAGE)
    .openapi({ example: 1, description: "Numéro de la page" }),
  pageSize: z.coerce
    .number()
    .int()
    .min(PAGINATION_LIMITS.MIN_PAGE_SIZE)
    .max(PAGINATION_LIMITS.MAX_PAGE_SIZE)
    .default(PAGINATION_LIMITS.DEFAULT_PAGE_SIZE)
    .openapi({ example: 10, description: "Nombre d'éléments par page" }),
})

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>

export const PaginationMetaSchema = z
  .object({
    total: z.number().openapi({ example: 100 }),
    page: z.number().openapi({ example: 1 }),
    pageSize: z.number().openapi({ example: 10 }),
    totalPages: z.number().openapi({ example: 10 }),
  })
  .openapi("PaginationMeta")

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>
