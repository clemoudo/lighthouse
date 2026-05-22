import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"
import { AuthSessionSchema, UserSchema } from "./schemas/auth"
import {
  DocumentSchema,
  CreateDocumentResponseSchema,
  CreateDocumentRequestSchema,
  ListDocumentsResponseSchema,
  IngestDocumentResponseSchema,
} from "./schemas/document"
import {
  ChatRequestSchema,
  ChatResponseSchema,
  ConversationSchema,
  MessageSchema,
  ListConversationsResponseSchema,
  ChatUsageSchema,
} from "./schemas/chat"
import { TokenUsageResponseSchema, UserUsageSummarySchema } from "./schemas/admin"
import { OpenAPIObject } from "openapi3-ts/oas30"

const registry = new OpenAPIRegistry()

// Register components
registry.register("User", UserSchema)
registry.register("AuthSession", AuthSessionSchema)
registry.register("Document", DocumentSchema)
registry.register("Conversation", ConversationSchema)
registry.register("Message", MessageSchema)

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

registry.registerPath({
  method: "delete",
  path: "/documents/{id}",
  summary: "Delete a document (Admin only)",
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
      description: "Document deleted successfully",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Document not found" },
  },
})

// --- Chat Routes ---
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
  path: "/chat/conversations",
  summary: "List all conversations for the user",
  responses: {
    200: {
      description: "Returns a list of conversations",
      content: {
        "application/json": {
          schema: ListConversationsResponseSchema,
        },
      },
    },
    401: { description: "Unauthorized" },
  },
})

registry.registerPath({
  method: "get",
  path: "/chat/conversations/{id}",
  summary: "Get a specific conversation with messages",
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
      description: "Returns the conversation object",
      content: {
        "application/json": {
          schema: ConversationSchema,
        },
      },
    },
    401: { description: "Unauthorized" },
    404: { description: "Conversation not found" },
  },
})

registry.registerPath({
  method: "delete",
  path: "/chat/conversations/{id}",
  summary: "Delete a conversation",
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string", format: "uuid" },
    },
  ],
  responses: {
    204: {
      description: "Conversation deleted",
    },
    401: { description: "Unauthorized" },
    404: { description: "Conversation not found" },
  },
})

registry.registerPath({
  method: "get",
  path: "/chat/usage",
  summary: "Get daily message usage statistics",
  responses: {
    200: {
      description: "Returns usage statistics",
      content: {
        "application/json": {
          schema: ChatUsageSchema,
        },
      },
    },
    401: { description: "Unauthorized" },
  },
})

// --- Admin Routes ---
registry.registerPath({
  method: "get",
  path: "/admin/stats/usage",
  summary: "Get token usage statistics (Admin only)",
  parameters: [
    {
      name: "from",
      in: "query",
      required: false,
      schema: { type: "string", format: "date-time" },
    },
    {
      name: "to",
      in: "query",
      required: false,
      schema: { type: "string", format: "date-time" },
    },
    {
      name: "userId",
      in: "query",
      required: false,
      schema: { type: "string", format: "uuid" },
    },
    {
      name: "model",
      in: "query",
      required: false,
      schema: { type: "string" },
    },
  ],
  responses: {
    200: {
      description: "Returns usage statistics",
      content: {
        "application/json": {
          schema: TokenUsageResponseSchema,
        },
      },
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
  },
})

registry.registerPath({
  method: "get",
  path: "/admin/stats/users",
  summary: "Get usage summary for all users (Admin only)",
  responses: {
    200: {
      description: "Returns a list of usage summaries per user",
      content: {
        "application/json": {
          schema: z.array(UserUsageSummarySchema),
        },
      },
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
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
