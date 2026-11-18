# Antigravity Project Constitution & Workspace Rules

This file is automatically loaded and enforced by Google Antigravity across this workspace.

## Authoritative Reference
- Read `PROJECT_CONTEXT.md` at the root before starting any work or stage.
- Follow the 13 build stages in order. Commit to Git after every working stage.

## Approved Technology Stack & Boundaries
- Only use dependencies approved in `PROJECT_CONTEXT.md` Section 5.
- Do NOT install or introduce any new dependencies without explicit prior approval and clear rationale.
- Boundaries: No Python backend, no separate database server, no separate frontend/backend repositories.

## Strict Architectural Invariants
1. **/engine**:
   - Pure TypeScript only.
   - Absolutely NO UI imports (no React, HTML, CSS, or UI component imports).
   - 100% unit-tested with Vitest.
   - All financial math and KPI calculations live here and nowhere else.
2. **/ai/tools**:
   - Wraps engine functions for Gemini function calling.
   - Gemini cannot invent numbers; all figures must originate from verified engine function calls.
3. **/three**:
   - Only 3D scene components (React Three Fiber / Drei).
   - Reads data from the Zustand store.
   - NEVER computes financial logic.
   - Must load client-side only (`dynamic(..., { ssr: false })`).
   - If WebGL fails, 2D views must remain fully functional.
4. **API Security**:
   - Gemini API keys must reside exclusively in server-side Next.js API routes (`app/api/...`), never exposed to client-side code.
5. **State Management**:
   - A single Zustand store (`store/`) serves as the single source of truth for 2D charts, 3D scenes, and the AI assistant.
6. **2D Authoritative Presentation**:
   - Exact numbers must always be visible in 2D panels, never exclusively inside 3D.

## Decisions Kept Open (Section 10)
- **UI/UX Design**: Visual style, color palette, typography, layout, and branding are NOT decided yet. Use clean, neutral shadcn/ui defaults with neutral styling and keep logic decoupled from styling.
- **3D Design**: Scene visual design, models, camera behavior, and shaders are NOT decided yet. Use a minimal placeholder scene driven by store data.
- Do not invent final designs or branding without user consultation and approval.
