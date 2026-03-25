# Co-Synapse — Build Progress

## Status: Frontend Complete · Backend Pending

The full frontend has been built across 6 phases and is running at `http://localhost:3000`. All data is currently mocked in `frontend/lib/api.ts`. No backend server exists yet.

---

## What Exists Right Now

### Routes (10 pages)

| Route | File | Status |
|-------|------|--------|
| `/` | `app/page.tsx` | ✅ Live — 3D spider web hero, feature sections, testimonials |
| `/auth/login` | `app/auth/login/page.tsx` | ✅ Live — email/password form, Google OAuth button |
| `/auth/signup` | `app/auth/signup/page.tsx` | ✅ Live — same as login + name field |
| `/dashboard` | `app/dashboard/page.tsx` | ✅ Live — briefing, metrics, subject web previews, upload modal |
| `/web/[subject_id]` | `app/web/[subject_id]/page.tsx` | ✅ Live — interactive concept web with force-directed layout |
| `/study/[session_id]` | `app/study/[session_id]/page.tsx` | ✅ Live — full session loop inc. flash rounds |
| `/review` | `app/review/page.tsx` | ✅ Live — review queue with urgency badges |
| `/onboarding` | `app/onboarding/page.tsx` | ✅ Live — 5-step wizard |
| `/settings` | `app/settings/page.tsx` | ✅ Live — profile, dark mode, study anchor, attention tracking toggle |
| `/_not-found` | Next.js built-in | ✅ Auto |

---

### Frontend Components

#### Canvas (`components/canvas/`)
| File | Purpose |
|------|---------|
| `HeroWeb.tsx` | 3D spider web canvas engine — 6 rings × 14 spokes, scroll-zoom warp, gold palette, fog, parallax. Ported from NeuroSketch. |
| `HeroSection.tsx` | Client wrapper that `dynamic`-imports HeroWeb with `ssr: false` |
| `WebTooltip.tsx` | Newspaper-themed gold tooltip shown on hover over feature nodes in HeroWeb |

#### Layout (`components/layout/`)
| File | Purpose |
|------|---------|
| `Navbar.tsx` | Fixed top bar — logo, nav links, ThemeToggle, Settings icon, mobile hamburger, dateline |
| `MobileNav.tsx` | Shadcn Sheet-based slide-out nav at mobile breakpoints |
| `SpiderCursor.tsx` | Custom rAF cursor — spider SVG faces movement direction, idle leg twitch at 2s |
| `ThemeProvider.tsx` | Reads/writes `.dark` class on `<html>`, persists to `localStorage` |
| `ThemeToggle.tsx` | Sun/Moon icon button |

#### Dashboard (`components/dashboard/`)
| File | Purpose |
|------|---------|
| `DailyBriefing.tsx` | Time-appropriate greeting, streak, retrieval count |
| `MetricCards.tsx` | 3 cards: mastery %, active error patterns, streak |
| `SubjectWebPreview.tsx` | Mini Canvas web per subject (force-directed, animated), clickable card to `/web/[id]` |
| `UploadModal.tsx` | Drag-drop upload modal with 4-step printing-press progress animation |

#### Study (`components/study/`)
| File | Purpose |
|------|---------|
| `QuestionCard.tsx` | Renders any question type with KaTeX, progress dots, concept label, skip link |
| `AnswerInput.tsx` | Switches on question type: free-text, multiple-choice, numeric, multi-step, latex, teachback |
| `KaTeXRenderer.tsx` | Renders inline `$...$` and display `$$...$$` LaTeX via katex |
| `FeedbackCard.tsx` | Correct (green, metacognitive message) / Wrong (red, ErrorChip, collapsible hint, pattern alert) |
| `ErrorChip.tsx` | Shadcn Badge styled per error type: careless=amber, procedural=blue, conceptual=red, fatigue=gray |
| `FlashRound.tsx` | Timed question overlay — 30s countdown, 4 distractor types (noise numbers, red-dot, Stroop, countdown-only) |
| `FormatSwitcher.tsx` | AnimatePresence slide transition between format views with pill indicator |
| `TeachbackPrompt.tsx` | 100-char min textarea + mock-streamed AI feedback with approval detection |
| `ReverseCaseTest.tsx` | Vertical ladder of complexity levels — find exact break point in understanding |
| `SessionSummary.tsx` | "The Daily Synapse Recap" — animated mastery bars, error breakdown, next review date |

#### Web (`components/web/`)
| File | Purpose |
|------|---------|
| `ConceptWeb.tsx` | Full-screen Canvas 2D concept web — force-directed layout, 4 node states, hover tooltips, lock + prereq highlight, mouse pan/scroll-zoom |
| `WebProgress.tsx` | Gold progress bar showing mastered/total nodes |

#### UI (`components/ui/`)
Shadcn components: `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `progress`, `radio-group`, `separator`, `sheet`, `slider`, `textarea`, `toggle`, `tooltip`

Custom: `scroll-reveal.tsx` — Framer Motion `whileInView` entrance animation

---

### Libraries & Hooks

#### `lib/`
| File | Purpose |
|------|---------|
| `3d-utils.ts` | Pure 3D math — `Vec3`, `project3D`, `rotateX`, `rotateY`, `lerp`, `clamp` |
| `api.ts` | Typed API client — all endpoints stubbed with `MOCK_MODE=true` returning fixtures |
| `mockSubjects.ts` | Hardcoded graph data for Calculus, Organic Chemistry, Mechanics |
| `webLayout.ts` | Custom O(n²) force-directed layout — repulsion + spring attraction + center gravity |
| `spiderPhysics.ts` | Spring snap-back, lerp, dist2 helpers for cursor latch system |
| `utils.ts` | Shadcn `cn()` utility |

#### `hooks/`
| File | Purpose |
|------|---------|
| `use-web-zoom.ts` | Scroll-intercept zoom controller for HeroWeb — warp threshold, 1800ms warp animation |
| `useFlashRound.ts` | Flash round state machine — start/recordTap/finish/reset, 30s countdown interval |
| `useFormatCascade.ts` | Tracks fail count per concept, auto-advances format mode on 2nd failure |
| `useMentalState.ts` | Classifies user state (normal/confused/distracted/overwhelmed) from response times + accuracy; sends telemetry every 10s |
| `useSpiderCursor.ts` | Cursor latch — lerps to nearest web node within 60px, spring snap-back beyond 80px, silk bezier path |

#### `stores/` (Zustand)
| File | Purpose |
|------|---------|
| `userStore.ts` | User profile, stats (mastery%, error patterns, streak), subjects list |
| `webStore.ts` | Concept nodes, strands, spider position, silk trail |
| `sessionStore.ts` | Session ID, questions, current index, answers, flash round active flag, format mode |

---

### Design System

- **Font stack:** Playfair Display (serif headings) · Inter (body) · JetBrains Mono (code/numbers)
- **Gold accent:** `#D4A843` / `rgba(212, 168, 67, …)`
- **Dark mode:** `.dark` class on `<html>`, toggled by ThemeProvider, no flash on reload
- **CSS custom properties:** `--bg-primary`, `--bg-secondary`, `--text-primary/secondary/tertiary`, `--accent-primary`, `--border-default`
- **Newspaper utilities:** `.newspaper-label` (tracked uppercase), `.newspaper-rule` (1px gold rule)

---

## What Backend Work Needs to Be Done

All API calls currently return from `MOCK_MODE=true` in `lib/api.ts`. Flip `MOCK_MODE = false` and implement the following endpoints.

### 1. Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Email + password signup; returns JWT |
| `/api/auth/login` | POST | Email + password login; returns JWT |
| `/api/auth/google` | GET | OAuth redirect (Google) |
| `/api/auth/me` | GET | Returns current user from token |

**Required:** JWT middleware on all protected routes. Suggested stack: **FastAPI + python-jose** or **Next.js Route Handlers + Auth.js**.

---

### 2. Document Ingestion & Graph Building

This is the core AI pipeline. When a user uploads a PDF/notes:

| Step | Description | Suggested approach |
|------|-------------|-------------------|
| Parse | Extract raw text from PDF/DOCX/MD | `pdfplumber`, `pypandoc` |
| Chunk | Split into semantic chunks | LangChain `RecursiveCharacterTextSplitter` |
| Extract concepts | Identify key concepts + relationships | Claude API with structured output (`concept_list: [{name, definition, prerequisites: []}]`) |
| Build graph | Convert to `ConceptNode[]` + `ConceptStrand[]` | Direct mapping from extracted JSON |
| Store | Persist graph to DB | PostgreSQL with `pgvector` for embeddings |
| Return | POST `/api/subjects` → `{ subjectId, nodeCount }` | Redirects client to `/web/[subjectId]` |

**Endpoint:**
```
POST /api/subjects/upload
  body: FormData (file)
  response: { subjectId: string, nodeCount: number }
```

---

### 3. Question Generation

For each concept node, generate questions across all 6 types:

```
POST /api/questions/generate
  body: { conceptId, conceptText, type?: QuestionType }
  response: Question[]
```

Suggested approach: Claude API with a per-type system prompt. Cache generated questions in DB — don't regenerate on every session.

**Question types to generate:**
- `free-text` — open-ended retrieval
- `multiple-choice` — 4 options, one correct, 3 plausible distractors
- `numeric` — exact value with unit
- `multi-step` — sequential sub-problems
- `latex` — symbolic expression
- `teachback` — prompt to explain concept in own words

---

### 4. Session Management

```
POST /api/session/start
  body: { conceptIds: string[], questionCount: number }
  response: { sessionId: string, questions: Question[] }

POST /api/session/:id/grade
  body: { questionId: string, answer: string }
  response: GradeResult

GET  /api/session/:id/summary
  response: SessionSummaryData

POST /api/session/:id/telemetry
  body: { state, metrics, timestamp }
  response: 200 OK
```

**Grading logic:**
- Free-text / teachback: Claude API semantic similarity scoring
- Multiple-choice / numeric / latex: exact or near-exact match
- Multi-step: grade each step independently, partial credit
- `errorType` classification: build a classifier prompt that categorises wrong answers as `careless | procedural | conceptual | fatigue`
- `patternAlert`: fire when same errorType appears ≥3 times in last 10 answers for same concept

---

### 5. Teachback Streaming

The `TeachbackPrompt` component expects a `ReadableStream`. Replace the mock setTimeout loop with:

```
POST /api/session/:id/teachback
  body: { text: string, conceptId: string }
  response: text/event-stream (SSE)
```

Server-side: pipe Claude's streaming response directly to the SSE response. The component already has the streaming append logic — just swap the source.

---

### 6. Spaced Repetition Scheduler

```
GET  /api/review/queue
  response: ReviewItem[]   (sorted by retrieval optimality)

POST /api/review/complete
  body: { conceptId: string, correct: boolean, responseTimeMs: number }
  response: { nextReviewDate: string }
```

Suggested algorithm: **SM-2** (SuperMemo) or **FSRS** (Free Spaced Repetition Scheduler — more accurate). Key fields to persist per concept-user pair: `easeFactor`, `interval`, `repetitions`, `dueDate`.

---

### 7. Subject & Graph CRUD

```
GET  /api/subjects              → Subject[]
GET  /api/subjects/:id          → SubjectGraph { nodes, strands }
PUT  /api/subjects/:id/nodes/:nodeId  → update node mastery
DELETE /api/subjects/:id        → delete subject + all sessions
```

---

### 8. Mental-State Telemetry (Optional for MVP)

The `useMentalState` hook already fires `POST /api/session/:id/telemetry` every 10 seconds. The backend just needs to:
- Accept and store the payload (or discard it for now)
- Optionally return an `interventionType` in the response that the frontend reads to adapt UI

---

### Database Schema (Suggested)

```sql
users           (id, email, name, password_hash, created_at)
subjects        (id, user_id, name, node_count, created_at)
concept_nodes   (id, subject_id, label, state, mastery_pct, ease_factor, interval, due_date)
concept_strands (id, subject_id, from_id, to_id)
questions       (id, concept_id, type, prompt, choices_json, answer_hash)
sessions        (id, user_id, subject_id, started_at, completed_at)
session_answers (id, session_id, question_id, answer, correct, error_type, response_ms)
telemetry       (id, session_id, mental_state, metrics_json, recorded_at)
```

---

### Suggested Backend Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Runtime | **Python / FastAPI** | Best-in-class for AI/LLM integrations, async native |
| AI | **Claude API** (`claude-sonnet-4-5`) | Concept extraction, grading, teachback streaming |
| Database | **PostgreSQL + pgvector** | Relational + vector search for semantic similarity grading |
| Auth | **Auth.js** (Next.js) or **python-jose** | JWT + Google OAuth |
| File storage | **S3 / Cloudflare R2** | Store uploaded PDFs |
| Deployment | **Railway / Render** (backend) + **Vercel** (frontend) | Fast MVP hosting |
| Queue | **Redis + RQ** | Async document processing (don't block the upload response) |

---

### How to Activate Real Backend

1. Set `MOCK_MODE = false` in `frontend/lib/api.ts`
2. Add `NEXT_PUBLIC_API_URL=https://your-backend.com` to `frontend/.env.local`
3. Update all `fetch` calls in `lib/api.ts` to use `${process.env.NEXT_PUBLIC_API_URL}/api/...`
4. The rest of the frontend is already wired — stores, hooks, and UI components all consume from `lib/api.ts`
