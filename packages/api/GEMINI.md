# API Definitions (@repo/api)

## Purpose

Centralized OpenAPI specification and schema definitions shared between the API Gateway and the Web Application.

## Tech Stack

- **Zod:** Used for schema definitions.
- **zod-to-openapi:** Generates OpenAPI 3.0 specification from Zod schemas.

## Architecture

- **src/schemas/:** Contains Zod schemas for all API entities and request/response bodies.
- **src/openapi.ts:** Combines schemas into a complete OpenAPI specification.
- **openapi.json:** The generated OpenAPI file (used by Orval in the web app).

## Development Rules

- **Schema Changes:** Always update schemas in this package before implementing them in the API or using them in the Web app.
- **Generation:** Run `pnpm generate-openapi` in this package to update `openapi.json` after making changes to the Zod definitions.
