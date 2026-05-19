# Web Application (Next.js)

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript.
- **Infrastructure:** Docker.
- **Styling:** Tailwind CSS v4 (CSS-first mode).
- **UI Library:** Ant Design 6.
- **API Client:** Orval (Auto-generated with TanStack Query).
- **State/Forms/Tables:** TanStack Query, TanStack Form (+ Zod).
- **Theming:** `next-themes` + Ant Design ConfigProvider.

## Critical Rules

- **Access:** Reached via `http://lighthouse.local`.
- **API Routing:** All backend requests go through Traefik which STRIPS the `/api` prefix. For example, a request to `http://lighthouse.local/api/auth` reaches the backend as `/auth`.
- **Hydration:** Always include `suppressHydrationWarning` on the `<html>` tag in `layout.tsx` to prevent mismatches from theme scripts or extensions.
- **Ant Design Registry:** Ensure `AntdRegistry` from `@ant-design/nextjs-registry` wraps the application in `layout.tsx`.
- **API Generation:** Use `pnpm generate-api` to update the API client from the backend's OpenAPI spec. Generated code is located in `@repo/api` but used via React Query hooks.
- **Tailwind v4:** Variables and theme configuration are located in `src/app/globals.css`. Use `@theme inline` for custom tokens.
- **Icons:** Use `lucide-react`.

## UI & Layout Conventions

- **Ant Design First:** Favor `Flex`, `Space`, `Typography`, and `Card` from Ant Design for layout and text over raw HTML/Tailwind where possible to maintain theme consistency.
- **Page Headers:** Use the `PageHeader` component for consistent titles and descriptions across pages.
- **Navigation:** New features are marked as `disabled` with a "Prochainement disponible" `Tooltip` in the `AppShell` until fully implemented.
- **Chatbot Interface:** The AI Assistant (`/assistant`) uses a modern, immersive layout:
  - No `PageHeader` or containing `Card`.
  - Centered message stream (max-width 4xl).
  - Sticky bottom input with backdrop blur.
  - Assistant messages: White background with border.
  - User messages: Primary color background.

## Theme

- The application uses `oklch()` color tokens defined in `globals.css`.
- Ant Design tokens should be synchronized with Tailwind variables when possible via `ConfigProvider` in `Providers`.
