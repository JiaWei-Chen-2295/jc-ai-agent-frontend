# JC AI Agent Frontend — Project Plan

## Tech Stack
- React 18 + TypeScript with Vite.
- Ant Design (ConfigProvider for theming), Iconify for icons, Axios for HTTP, @tanstack/react-query for data fetching/cache, react-router for routing.
- Swagger/OpenAPI client generation via `openapi-typescript-codegen` (outputs typed SDK using Axios adapter).
- State for UI only via React/Context; server state via React Query. Lightweight store (Zustand) can be added if needed.

## Project Structure
```
/src
  /api                  # Generated Swagger client (do not edit manually)
  /components           # Reusable UI elements (UploadCard, ChatMessage, StatusTag, etc.)
  /features
    /upload             # Upload page + hooks
    /chat               # Conversation page
    /datasets           # Dataset list/history
    /settings           # Configuration page
  /layouts              # App shell, navigation
  /routes               # Route definitions and loaders
  /services             # Axios instance, interceptors, error mapper
  /providers            # Theme, query client providers
  /types                # Shared types not from Swagger
  /utils                # Helpers (formatters, download, file validation)
  /styles               # Global styles, tokens
```

## Data Flow
- **HTTP client:** single Axios instance (`services/http.ts`) with baseURL from env, injects auth token if provided, response interceptor normalizes errors.
- **API SDK:** `npm run api:generate -- --input http://<swagger-url>/swagger.json --output src/api` generates typed client using Axios. Keep `openapi.json` fallback in repo if available.
- **Requests:** feature hooks (`features/*/hooks`) call generated SDK, wrapped in React Query for caching, retries, and request status.
- **Uploads:** use Axios `onUploadProgress`; show progress in UploadCard; trigger poll for processing status until Ready/Error.
- **Chat:** streaming preferred via server-sent events/websocket; fallback to poll. API layer exposes `sendMessage` + `getHistory`, adapter handles SSE piping to UI.

## Theming & Tokens
- Define brand tokens in `styles/theme.ts`: primary `#2fbd6a`, success same, warning `#f5a524`, error `#f44747`. Configure Ant Design `ConfigProvider` with custom seed and rounded controls.
- Global CSS for fonts (Sora, JetBrains Mono) and layout shell (rail + top bar). Use CSS variables for spacing/radius.

## Pages & Features
- **Upload & Overview:** drag-drop upload, table list with filters, status tags, action menu (view, reprocess, delete).
- **Conversation:** dual-pane layout, message list with sources, context drawer for retrieval settings, chat input with multiline + shortcuts, streaming indicator.
- **History/Datasets:** searchable list of conversations and ingested files with status timeline.
- **Settings:** configure endpoints/swagger URL, API key/token, model parameters (temperature, top-k), theme (light/dim), enable/disable telemetry.

## Tooling & Scripts
- `npm run dev|build|preview` from Vite.
- `npm run lint` (eslint + prettier + @typescript-eslint).
- `npm run api:generate` using `openapi-typescript-codegen` (configure in `package.json` scripts).
- Optional: `npm run typecheck` with `tsc --noEmit`.

## Risks / Open Questions
- Need swagger endpoint URL; for now keep `.env` for `VITE_API_BASE_URL` and `VITE_SWAGGER_URL`.
- Streaming protocol for chat not defined; plan supports SSE/websocket; confirm backend capability.
- Auth mechanism (bearer token vs cookie) not specified; will default to bearer token stored in memory.
