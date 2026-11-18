# PROJECT_CONTEXT.md

> Working title: **Menu Profit Copilot** (rename freely)
> Development tool: **Google Antigravity only**
> Status: plan approved. **UI/UX design and 3D design are NOT decided yet** (see Section 10).

---

## 1. One-line pitch

A 3D web app that shows restaurant owners which dishes make or lose money, how ingredient inflation is eroding each dish's margin, and what to change, with an AI assistant that explains decisions using verified calculations.

## 2. Problem

- Restaurant owners see total sales but not per-dish profit.
- Ingredient prices keep rising, which silently shrinks each dish's margin.
- Small restaurants rarely have analytics tools, clean CSV data or time for spreadsheets.

## 3. Innovation (what makes this different)

1. **Recipe Replay:** shows how ingredient-price inflation changes a dish's profitability over time (signature feature).
2. **AI that cannot invent numbers:** Gemini calls tested engine functions and only explains the results.
3. **Photo to data:** Gemini reads a photo of a handwritten recipe or supplier bill and returns validated rows.
4. **3D visualization of the menu:** profit, popularity and margin explored in 3D (concept and design TBD, see Section 10).
5. **AI linked to the visualization:** when the assistant discusses a dish, the view focuses on that dish (depends on the 3D design).
6. **Honest by design:** elasticity and forecasts are labeled as assumptions with confidence indicators.

## 4. Features (12, in tiers)

Rule: all of Tier 1 and Tier 2 must work before any Tier 3 work starts.

### Tier 1: Core (must work)

| # | Feature | What it does | Why it exists |
|---|---|---|---|
| 1 | Smart Import | CSV upload (sales, recipes, ingredient prices) via PapaParse; Zod validation for missing values, invalid records, inconsistent units; Gemini photo extraction | Bad data means wrong profit; photo input removes the CSV barrier |
| 2 | Profit Engine | Revenue, ingredient cost, gross profit, contribution margin per dish, in plain TypeScript, tested with Vitest | Foundation for every other feature; tested code = trust |
| 3 | Menu Matrix | Classifies dishes as Stars, Plowhorses, Puzzles, Dogs | Turns numbers into an action per dish |
| 4 | Demo Mode | Built-in sample restaurant with a clear story, precomputed insights, cached AI replies | Demo survives network or API failure |

### Tier 2: Differentiators

| # | Feature | What it does | Why it exists |
|---|---|---|---|
| 5 | Recipe Replay | Per-dish margin over time against ingredient prices | Exposes the hidden inflation problem |
| 6 | Menu Surgery Simulator | Change price, ingredient cost, sales volume and see financial outcomes; price elasticity as an optional, assumption-labeled layer | Test decisions before making them |
| 7 | AI Decision Assistant | Gemini function calling over the engine; explains findings, suggests actions, writes marketing copy for top dishes and combos | Plain-language decisions without AI math errors |
| 8 | 3D Visualization | Interactive 3D view of dish popularity, margins, profit contribution, inflation over time and margin breakdown (**design TBD**) | The app is a 3D web app; shows the whole menu at once |

### Tier 3: Polish

| # | Feature | What it does | Why it exists |
|---|---|---|---|
| 9 | Profit Forecast | Estimates future sales, costs, margins with a visible confidence band | Planning ahead, honest uncertainty |
| 10 | Combo Optimizer | `javascript-lp-solver` finds profitable food combinations | Optimization instead of guesswork |
| 11 | Report Export | Printable PDF of key insights and recommendations | Shareable output |
| 12 | Guided Tour | Short automatic walkthrough of the 3D view (**depends on 3D design**) | Smooth, self-explanatory demo |

## 5. Approved technology stack

No technology may be added without a clear reason and approval.

| Technology | Role |
|---|---|
| Google Antigravity | Only development tool: generate, edit, run, test, debug, verify |
| Next.js + React | Whole web app, pages and API routes |
| TypeScript | All logic and financial calculations |
| Tailwind CSS | Styling and responsive layout |
| shadcn/ui | Buttons, cards, dialogs, sliders, tables |
| React Three Fiber | 3D visualization |
| Drei | 3D camera controls, lighting, labels, helpers |
| Recharts | 2D charts (Recipe Replay, forecast, waterfall-style charts) |
| Zustand | Shared application state |
| PapaParse | CSV reading |
| Zod | Validation and data structures |
| Dexie (IndexedDB) | Local storage of datasets and app data |
| javascript-lp-solver | Combo optimization |
| Vitest | Tests for financial calculations and logic |
| Gemini API (`@google/genai`) | Photo extraction, function calling, explanations, marketing copy |
| Next.js API Routes | Secure server-side connection to Gemini |

**Boundaries:** no Python backend, no separate database server, no separate frontend/backend projects.
**Antigravity** is the tool we build with. **Gemini** is the AI inside the finished app.

## 6. Architecture rules

- `/engine`: pure TypeScript, **no UI imports**, fully unit-tested with Vitest. All money math lives here and nowhere else.
- `/ai/tools`: wraps engine functions for Gemini function calling (for example `getDishMargin`, `simulatePriceChange`, `forecastMargin`, `bestCombos`).
- `/three`: only 3D scene components. They read from the Zustand store and **never compute finance**.
- Gemini API key only in server API routes, never in client code.
- 3D components load client-side only (`dynamic(..., { ssr: false })`).
- One Zustand store is the single source of truth for 2D charts, 3D view and AI.
- AI may not state computed numbers on its own; it must call an engine tool.
- Exact numbers always appear in 2D panels, never only inside 3D.
- If WebGL fails, the 2D views must still show all information.

### Suggested folder structure

```
/app            Next.js pages and API routes
/components     shadcn/ui and shared UI components
/engine         pure TypeScript finance logic (+ tests)
/ai             Gemini client, tool definitions, prompts
/three          3D scene components (design TBD)
/store          Zustand store
/db             Dexie setup
/data           sample CSVs and story dataset
/schemas        Zod schemas
```

## 7. Data (initial draft, refine in Stage 1)

- **Sales:** date, dish, quantity, selling price
- **Recipes:** dish, ingredient, quantity, unit
- **Ingredient prices:** date, ingredient, price, unit

Validation must catch: missing values, invalid records, inconsistent units.

**Story dataset (Demo Mode):** must make the insight obvious: about 3 dishes visibly hurt by inflation over time, at least 2 Stars and 1 Dog.

## 8. AI design (Gemini)

1. **Multimodal extraction:** photo of recipe or bill becomes rows that pass Zod validation.
2. **Function calling:** assistant calls engine tools, then explains the result.
3. **Grounded answers:** every number traces back to the calculation that produced it.
4. **Marketing copy:** promotional text for top-margin dishes and combos, as one assistant tool.
5. **Visualization link:** assistant focuses the view on the dish it discusses (once 3D design exists).
6. **Fallback:** cached responses in Demo Mode.

## 9. Build stages (13 stages: Stage 0 plus 12)

Stages 2, 3 and 4 can run in parallel. Commit after every working stage.

| Stage | What gets built | Done when |
|---|---|---|
| 0 | Project rules, this file, scaffold, approved dependencies | App boots; lint and tests run |
| 1 | Data schemas and story dataset | Dataset shows 3 inflation-hurt dishes, 2 Stars, 1 Dog |
| 2 | Financial engine + Vitest tests | KPI, matrix and replay tests pass |
| 3 | UI shell, dashboard, matrix, Recipe Replay (**uses placeholder UI until UI/UX is decided**) | Works with sample data |
| 4 | 3D prototype (**blocked until the 3D design is decided; build only a basic placeholder scene**) | Placeholder renders from store data |
| 5 | Integration: store, engine, 2D and 3D | One data source drives everything |
| 6 | Import, validation, Gemini photo extraction | Messy CSV is caught; photo becomes rows |
| 7 | Simulator with live 3D updates | Sliders update numbers and the 3D view |
| 8 | 3D time and breakdown views (**depends on 3D design**) | Time and cost breakdown visible in 3D |
| 9 | AI assistant with function calling and view focus | Question, engine call, explanation |
| 10 | Forecast, combo optimizer, report export | Tier 3 features work |
| 11 | Demo Mode, guided tour, polish, fallbacks | App works offline |
| 12 | Full test pass and rehearsal | Demo runs cleanly end to end |

**Implementation order:** data, financial engine, 2D dashboard, simulator, AI, 3D, testing.

**Cut order if time runs short:** Guided Tour, Forecast, Combo Optimizer, Report Export.
**Never cut:** Recipe Replay, Simulator, AI assistant.

## 10. Decisions still open (do later or add after)

These are intentionally **not decided**. The agent must not invent final designs for them.

### 10.1 UI/UX design: TBD

- Visual style, color palette, typography, layout, navigation, page structure: **not decided**
- Until decided: use clean default shadcn/ui components with neutral styling and keep UI logic separate from styling so it can be restyled later.

### 10.2 3D design: TBD

- What the 3D scene looks like, camera behavior, modes, color mapping, animations, labels, effects: **not decided**
- The app is still a 3D web app built with React Three Fiber + Drei. Only the specific design is open.
- Candidate idea (a proposal, not final): one shared 3D scene with several modes (popularity and margin field, time view, margin breakdown). Alternatives are welcome.
- Until decided: build only a minimal placeholder scene driven by store data so the pipeline works, and keep scene code isolated in `/three` so it can be replaced.

### 10.3 Other open items

- Final project name
- Branding and logo
- Real-world data sources, if any, beyond the story dataset

## 11. Rules for the Antigravity agent

- Read this file at the start of every task.
- One stage per task; show a plan and a task list before building.
- Do not add dependencies outside the approved stack without asking.
- Run Vitest before finishing any stage that touches `/engine`.
- Verify screens in the browser and capture screenshots before marking a stage done.
- Do not finalize UI/UX or 3D visual design (Section 10); ask first.
- Keep the app runnable at the end of every stage.
