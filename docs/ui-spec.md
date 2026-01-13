# JC AI Agent Frontend — UI Spec

## Visual Language
- **Brand color:** `#2fbd6a` (primary). Use darker hover `#259357` and pressed `#1d7245`.
- **Accent:** `#3f8cff` for secondary CTAs and links when needed.
- **Semantic:** success `#2fbd6a`, warning `#f5a524`, error `#f44747`, info `#3f8cff`.
- **Neutrals:** `#0f172a` text strong, `#1f2937` headings, `#4b5563` secondary, `#6b7280` disabled, `#e5e7eb` dividers/borders, `#f8fafc` backgrounds, `#ffffff` surface.
- **Elevation:** subtle shadow `0 8px 30px rgba(15,23,42,0.08)` for cards, `0 2px 10px rgba(15,23,42,0.06)` for menus/popovers.
- **Gradients (hero/empty states):** `linear-gradient(120deg, #2fbd6a 0%, #37d47c 35%, #3f8cff 100%)` with 10% opacity overlays on cards.

## Typography & Sizing
- **Primary font:** "Sora", "Segoe UI", sans-serif; **Monospace:** "JetBrains Mono", monospace for code snippets.
- **Type scale (px):** Display 28/36 bold, H1 24/32 semi-bold, H2 20/28 semi-bold, H3 18/26 medium, Body 16/24 regular, Small 14/20 regular, Caption 12/18 medium.
- **Spacing:** base unit 8px; small 4px, medium 12px, large 16px, x-large 24px.
- **Radius:** cards/modals 12px, buttons/inputs 10px, tags/pills 6px.
- **Icon sizing:** 16/20/24px via Iconify. Keep stroke icons for utility, filled for primary CTAs.

## Layout Patterns
- **Shell:** top bar with product name + status, left rail for navigation (Upload, Conversations, Datasets, Settings), right content pane with max width 1440px.
- **Content grid:** 12-column, 24px gutters. Cards use 16px padding, sections 24px.
- **Panels:** dual-pane on chat page (left: data/context & recent uploads, right: conversation). Collapse left rail on < 1024px; stack sections on mobile.
- **Feedback surfaces:** inline alerts for API errors, toasts for transient success, skeleton loaders for file list and chat history.

## Core Components
- **Primary Button:** solid `#2fbd6a` bg, white text; hover darken; focus ring `0 0 0 3px rgba(47,189,106,0.25)`. Destructive red, Ghost gray for secondary actions.
- **Input/TextArea:** rounded 10px, 12px padding, focus border `#2fbd6a` with subtle glow; suffix icons for upload/status.
- **Upload Card:** drag-and-drop area, accepts click to browse, shows file constraints; progress bar + status tag (Uploading/Processing/Ready/Failed).
- **Status Tag:** pill with icons: Ready (iconify: `mdi:check-circle`), Processing (`mdi:progress-clock`), Error (`mdi:alert-circle`), Waiting (`mdi:cloud-upload`).
- **Chat Message:** avatar + bubble (user white border, agent light green tint). Include source chips linking to documents.
- **Chat Input:** multi-line textarea with send button; includes attachment and "Regenerate" secondary button; shows token/char counter.
- **Context Drawer:** slide-over showing active dataset, retriever settings, top-k slider, temperature slider.
- **Timeline/Steps:** visualizing ingestion pipeline: Uploaded → Parsing → Embedding → Indexed → Ready.

## Page Templates
- **Upload & Dataset Overview:** hero card with CTA, file list table (Name, Size, Status, Updated, Actions), filters by status, search. Right aside shows recent activity and quota usage.
- **Conversation:** two-column as above; header shows agent state (online/processing). Messages with streaming cursor. Source list per answer.
- **History:** list of previous conversations with tags (dataset used, date), quick-open button. Empty state with illustration gradient.
- **Settings:** API endpoints (swagger URL), theme toggle (light/dim), model parameters (temperature, top-k), shortcuts list.

## Motion & States
- **Hover/Active:** buttons lift 2px with shadow; cards slightly scale (1.01) on hover.
- **Loading:** skeletons for tables/messages; shimmer on upload card while processing; typing indicator (3-dot pulse).
- **Empty:** gradient badge + concise copy + primary CTA.
- **Error:** inline danger message with retry; keep action buttons enabled unless destructive.

## Accessibility
- Color contrast AA for text on primary/backgrounds.
- Focus-visible styles on all interactive elements with brand outline.
- Keyboard navigation for uploads (enter/space), chat send (Ctrl/Cmd + Enter), quick actions (keyboard hints).
- Provide aria labels for upload dropzone and send button; announce status changes where possible.
