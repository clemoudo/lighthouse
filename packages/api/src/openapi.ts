import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"
import { AuthSessionSchema, UserSchema } from "./schemas/auth"
import { DocumentSchema, CreateDocumentResponseSchema, CreateDocumentRequestSchema, ListDocumentsResponseSchema, IngestDocumentResponseSchema } from "./schemas/document"
import { ChatRequestSchema, ChatResponseSchema } from "./schemas/chat"
import { OpenAPIObject } from "openapi3-ts/oas30"

const registry = new OpenAPIRegistry()

// Register components
registry.register("User", UserSchema)
registry.register("AuthSession", AuthSessionSchema)
registry.register("Document", DocumentSchema)

// --- Auth Routes ---
registry.registerPath({
  method: "get",
  path: "/auth/check",
  summary: "Check authentication status",
  responses: {
    200: {
      description: "Returns authentication status and current user/session",
      content: {
        "application/json": {
          schema: z.object({
            authenticated: z.boolean(),
            user: AuthSessionSchema,
          }),
        },
      },
    },
  },
})

registry.registerPath({
  method: "get",
  path: "/auth/profile",
  summary: "Get current user profile",
  responses: {
    200: {
      description: "Returns current user and session",
      content: {
        "application/json": {
          schema: z.object({
            user: AuthSessionSchema,
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
  },
})

// --- Document Routes ---
registry.registerPath({
  method: "get",
  path: "/documents",
  summary: "List all documents",
  responses: {
    200: {
      description: "Returns a list of documents",
      content: {
        "application/json": {
          schema: ListDocumentsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
    },
  },
})

registry.registerPath({
  method: "post",
  path: "/documents/upload",
  summary: "Upload a new document (Admin only)",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: CreateDocumentRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Document uploaded successfully",
      content: {
        "application/json": {
          schema: CreateDocumentResponseSchema,
        },
      },
    },
    400: {
      description: "Bad Request",
    },
    401: {
      description: "Unauthorized",
    },
    403: {
      description: "Forbidden",
    },
  },
})

registry.registerPath({
  method: "post",
  path: "/documents/{id}/ingest",
  summary: "Trigger AI ingestion for a document (Admin only)",
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string", format: "uuid" },
    },
  ],
  responses: {
    200: {
      description: "Ingestion completed successfully",
      content: {
        "application/json": {
          schema: IngestDocumentResponseSchema,
        },
      },
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Document not found" },
  },
})

// --- Chat Route ---
registry.registerPath({
  method: "post",
  path: "/chat",
  summary: "RAG Chat endpoint (Streaming)",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ChatRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Streaming text response",
      content: {
        "text/plain": {
          schema: ChatResponseSchema,
        },
      },
    },
    401: { description: "Unauthorized" },
  },
})

registry.registerPath({
  method: "get",
  path: "/status",
  summary: "Health check",
  responses: {
    200: {
      description: "Returns API and Database status",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            uptime: z.number(),
            database: z.string(),
            timestamp: z.string(),
          }),
        },
      },
    },
    503: {
      description: "Service Unavailable",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            database: z.string(),
          }),
        },
      },
    },
  },
})

/**
 * Generates the OpenAPI documentation object.
 */
export function generateOpenAPI(): OpenAPIObject {
  const generator = new OpenApiGeneratorV3(registry.definitions)
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Lighthouse API",
      description: "API for the Lighthouse project",
    },
    servers: [{ url: "http://localhost:3001" }],
  })
}
