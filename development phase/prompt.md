# LearnHub AI – Agent Prompts for Development Phases

> **How to use:** Copy the **Global Agent Rules** section once at the start of your project. Then copy the prompt for the phase you want to build and paste it into your AI coding agent (Cursor, etc.). Replace placeholders in `{curly braces}` with your actual values before sending.

---

## Table of Contents

1. [Global Agent Rules (Apply to Every Phase)](#global-agent-rules-apply-to-every-phase)
2. [How Phases Are Linked](#how-phases-are-linked)
3. [Required Information From You (Before Starting)](#required-information-from-you-before-starting)
4. [Phase Prompts](#phase-prompts)
   - [Phase 1 – Project Foundation](#phase-1--project-foundation)
   - [Phase 2 – Authentication](#phase-2--authentication)
   - [Phase 3 – App Shell & Landing](#phase-3--app-shell--landing)
   - [Phase 4 – Resource Library](#phase-4--resource-library)
   - [Phase 5 – Upload & RAG Ingestion](#phase-5--upload--rag-ingestion)
   - [Phase 6 – AI Tutor & Chat History](#phase-6--ai-tutor--chat-history)
   - [Phase 7 – AI Study Tools](#phase-7--ai-study-tools)
   - [Phase 8 – Resource Preview + AI Workspace](#phase-8--resource-preview--ai-workspace)
   - [Phase 9 – Profile, My Chats & Admin](#phase-9--profile-my-chats--admin)
   - [Phase 10 – Mobile, Polish & Accessibility](#phase-10--mobile-polish--accessibility)
   - [Phase 11 – Deployment & Capstone QA](#phase-11--deployment--capstone-qa)
5. [Post-Phase Report Template (Agent Must Fill)](#post-phase-report-template-agent-must-fill)

---

## Global Agent Rules (Apply to Every Phase)

**Include these instructions in every phase prompt, or tell the agent once at project start:**

```text
You are building LearnHub AI — a full-stack EdTech platform with RAG-powered AI tutoring.

MANDATORY RULES:
1. Read the phase file in `development phase/phase-XX-*.md` AND the linked PRD modules in `project requirement document/` AND relevant sections of `design.md` before writing code.
2. Do NOT skip ahead to later phases. Only implement what belongs to the current phase.
3. Reuse and extend code from previous phases — do not rewrite or break working features.
4. Match existing code conventions (naming, folder structure, Tailwind tokens from design.md).
5. Never commit secrets (.env files, API keys). Use .env.example with placeholders only.
6. After completing the phase, you MUST output a "Phase Completion Report" using the template at the bottom of `development phase/prompt.md`.

PHASE COMPLETION REPORT REQUIREMENTS:
At the end of every phase, explicitly tell the user:

A) MISSING DETAILS — List anything you could not implement because the user did not provide:
   - Supabase URL / keys
   - Hugging Face token
   - Google OAuth credentials
   - Production URLs
   - Any other config or decision

B) ENV FILE UPDATES — List every env variable that was ADDED or CHANGED:
   - frontend/.env (VITE_* variables)
   - backend/.env (HF_TOKEN, SUPABASE_*, etc.)
   - Show exact variable names and example values (never real secrets)

C) MANUAL STEPS — List anything the user must do outside the codebase:
   - Run SQL in Supabase dashboard
   - Enable auth providers
   - Add OAuth redirect URLs
   - Install system dependencies
   - npm/pip install new packages

D) WHAT WAS BUILT — Short summary of files/features added

E) ACCEPTANCE CRITERIA STATUS — Checkbox list from the phase file (done / blocked / partial)

F) LINK TO NEXT PHASE — What the next phase will build on from this phase

G) HOW TO TEST — Exact commands and steps to verify this phase works locally
```

---

## How Phases Are Linked

Each phase **builds on** previous work. The agent must understand these links before coding.

| Current Phase | Builds On (Previous Phases) | What Current Phase Adds | What Next Phase Needs From This |
|---------------|----------------------------|-------------------------|--------------------------------|
| **1 – Foundation** | Nothing | Repo structure, DB schema, env templates, health check | Supabase project, runnable frontend/backend |
| **2 – Auth** | Phase 1: Supabase client, API skeleton, users table | Login, signup, OAuth, protected routes, verification gate | Auth context, JWT on API calls, verified user flag |
| **3 – Shell & Landing** | Phase 2: auth routes, session, protected layout | Design system, Sidebar, TopNav, landing, dashboard stubs | Layout wrapper all pages use, UI primitives |
| **4 – Resource Library** | Phase 3: shell, routing; Phase 2: auth | GET /resources, ResourceCard grid, search/filter | Resource list API, cards linking to /resources/:id |
| **5 – Upload & RAG** | Phase 4: resource model; Phase 2: verified upload gate | POST /resources, Storage, FAISS ingest pipeline | Indexed documents in FAISS per resource_id |
| **6 – AI Tutor** | Phase 5: FAISS indexes; Phase 2: verified gate | POST /chat, conversations, messages, streaming UI | Working RAG Q&A, persisted chat history |
| **7 – AI Study Tools** | Phase 5: document text/index; Phase 6: LLM service | summarize, questions, revision, diagram APIs | Cached AI outputs per resource |
| **8 – Preview + Workspace** | Phase 4–7: resources, PDF, chat, tools | Split PDF viewer + AI tools panel on detail page | Full learning workspace on /resources/:id |
| **9 – Profile & Admin** | Phase 4–6: resources, chats, users | Profile, My Chats page, admin delete, dashboard data | User stats, conversation management |
| **10 – Polish** | Phases 3–9: all features | Mobile nav, animations, a11y, empty/error states | Production-quality responsive UI |
| **11 – Deploy & QA** | All phases 1–10 | Vercel + Render deploy, capstone checklist | Live URLs, production env vars |

### Dependency Chain (Visual)

```text
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──┐
                                              ├──→ Phase 5 ──→ Phase 6 ──→ Phase 7 ──→ Phase 8
                                              │                                              │
                                              └──────────────────────────────────────────────┘
                                                                                              ↓
                    Phase 9 ──→ Phase 10 ──→ Phase 11
```

### Cross-Phase Files the Agent Must Not Break

| Area | Key files/folders (accumulated over phases) |
|------|---------------------------------------------|
| Auth | `useAuth`, `ProtectedRoute`, `supabase.js`, auth middleware |
| Layout | `DashboardLayout`, `Sidebar`, `TopNav`, `App.jsx` routes |
| API | `api.js` Axios instance with JWT interceptor |
| Backend | `main.py`, routers, `faiss_store.py`, `rag_pipeline.py` |
| Env | `frontend/.env`, `backend/.env`, `.env.example` files |

---

## Required Information From You (Before Starting)

Fill this in and paste into Phase 1 prompt (and update as you go):

| Item | Have it? | Used From Phase |
|------|----------|-----------------|
| Supabase project URL | ☐ | 1+ |
| Supabase anon key | ☐ | 1+ |
| Supabase service role key (backend) | ☐ | 1+ |
| Hugging Face token (`HF_TOKEN`) | ☐ | 5+ |
| Google OAuth Client ID & Secret | ☐ | 2+ |
| Production frontend URL (Vercel) | ☐ | 11 |
| Production backend URL (Render) | ☐ | 11 |

**If any item is missing, the agent must still scaffold code but must flag it in the Phase Completion Report under MISSING DETAILS.**

---

## Phase Prompts

---

### Phase 1 – Project Foundation

**Link:** Builds nothing (start here) → Enables Phase 2 (Auth)

```text
Implement LearnHub AI — PHASE 1: Project Foundation & Environment

Read these files first:
- development phase/phase-01-project-foundation.md
- project requirement document/07-technology-stack.md
- project requirement document/08-system-architecture.md
- project requirement document/09-database-design.md
- project requirement document/12-environment-and-deployment.md
- project requirement document/13-development-guidelines.md
- design.md (§15 File structure, Appendix A Tailwind)

MY CONFIG (fill what you have, leave blank if not ready):
- Supabase URL: {SUPABASE_URL or "NOT PROVIDED"}
- Supabase anon key: {SUPABASE_ANON_KEY or "NOT PROVIDED"}
- Supabase service role key: {SUPABASE_SERVICE_ROLE_KEY or "NOT PROVIDED"}

TASKS:
1. Create frontend/ with Vite + React + Tailwind + React Router + Axios + Lucide + @supabase/supabase-js
2. Create backend/ with FastAPI + Uvicorn + health check + CORS
3. Provide SQL migration file for users, resources, conversations, messages + RLS + triggers + storage policies
4. Create frontend/.env.example and backend/.env.example
5. Create root README with local run instructions
6. Configure Tailwind theme tokens from design.md

Apply all Global Agent Rules from development phase/prompt.md.
Do NOT implement auth UI or feature pages yet — skeleton only.

After completion, output the Phase Completion Report (sections A–G).
```

---

### Phase 2 – Authentication

**Link:** Builds on Phase 1 (Supabase, users table, API skeleton) → Enables Phase 3+ (protected app)

```text
Implement LearnHub AI — PHASE 2: Authentication & Access Control

Read these files first:
- development phase/phase-02-authentication.md
- project requirement document/02-authentication-module.md
- project requirement document/11-api-specification.md (auth section)
- design.md (§4.2 Auth pages, §3.3 Unverified UX)

PREVIOUS PHASE LINK:
- Phase 1 must be complete: frontend/backend run, Supabase schema exists, .env templates exist
- Extend existing frontend/src/services/supabase.js and api.js — do not recreate from scratch
- Extend backend auth middleware started in Phase 1

MY CONFIG:
- Supabase URL: {SUPABASE_URL}
- Supabase anon key: {SUPABASE_ANON_KEY}
- Google OAuth configured in Supabase: {YES/NO}
- Google redirect URL: http://localhost:5173/auth/callback

TASKS:
1. Sign Up, Sign In, Verify Email, Forgot/Reset Password pages
2. Google OAuth + /auth/callback route
3. useAuth hook + ProtectedRoute + VerifiedRoute (block upload, ai-tutor, my-chats if unverified)
4. EmailVerificationBanner for unverified users
5. Backend auth routes or document Supabase-direct flow; JWT validation on protected API routes
6. Return 403 for verified-only endpoints when email not verified

Apply all Global Agent Rules from development phase/prompt.md.
Do NOT build dashboard content or resource pages yet.

After completion, output the Phase Completion Report. Flag if Google OAuth credentials or Supabase auth settings were not provided.
```

---

### Phase 3 – App Shell & Landing

**Link:** Builds on Phase 2 (auth, protected routes) → Enables Phase 4–11 (all authenticated pages)

```text
Implement LearnHub AI — PHASE 3: Design System, App Shell & Landing

Read these files first:
- development phase/phase-03-app-shell-and-landing.md
- project requirement document/10-ui-ux-requirements.md
- design.md (§2 Design System, §3 Layout, §4.1 Landing, §4.3 Dashboard, §5 Components)

PREVIOUS PHASE LINK:
- Phase 2: useAuth, ProtectedRoute, login/signup flows must still work
- Wrap authenticated pages in DashboardLayout from this phase
- Keep EmailVerificationBanner from Phase 2 visible where required

TASKS:
1. Tailwind design tokens: colors, fonts (Poppins, Inter, JetBrains Mono), radii, shadows
2. UI primitives: Button, Badge, Modal, Toast, Skeleton, EmptyState
3. Sidebar (260px), TopNav, DashboardLayout, route outlet
4. Public landing page / with hero, CTAs, footer (dynamic sections can use stubs)
5. /dashboard with greeting, quick actions, placeholder sections
6. Wire all main nav routes (pages can be empty stubs except landing/dashboard)

Apply all Global Agent Rules from development phase/prompt.md.
Do NOT implement resource grid, upload, or chat yet.

After completion, output the Phase Completion Report.
```

---

### Phase 4 – Resource Library

**Link:** Builds on Phase 3 (shell, UI components) + Phase 2 (auth) → Enables Phase 5, 8

```text
Implement LearnHub AI — PHASE 4: Resource Library (Browse)

Read these files first:
- development phase/phase-04-resource-library.md
- project requirement document/03-resource-sharing-module.md
- project requirement document/11-api-specification.md (GET /resources)
- design.md (§4.4 Resources, §5 ResourceCard)

PREVIOUS PHASE LINK:
- Phase 3: use DashboardLayout, ResourceCard uses Button/Badge/Skeleton from Phase 3
- Phase 2: GET /resources requires auth; unverified users can browse read-only
- Phase 1: resources table in Supabase

TASKS:
1. /resources page: search (debounced), subject filter pills, sort dropdown
2. ResourceCard, ResourceGrid, SubjectFilter, SearchBar components
3. Backend GET /resources with search, subject, sort, pagination
4. Backend GET /resources/{id} + increment views
5. Skeleton loading and empty states
6. /resources/:id minimal detail page (full workspace comes in Phase 8)
7. Ask AI button links to /ai-tutor with resource context param

Apply all Global Agent Rules from development phase/prompt.md.
Do NOT implement upload or RAG yet.

After completion, output the Phase Completion Report. Mention if seed data is needed for testing.
```

---

### Phase 5 – Upload & RAG Ingestion

**Link:** Builds on Phase 4 (resource API/model) + Phase 2 (verified gate) → Enables Phase 6, 7, 8

```text
Implement LearnHub AI — PHASE 5: Upload & RAG Document Ingestion

Read these files first:
- development phase/phase-05-upload-and-rag-ingestion.md
- project requirement document/03-resource-sharing-module.md
- project requirement document/04-rag-ai-assistant-module.md (ingestion pipeline)
- project requirement document/08-system-architecture.md
- design.md (§4.5 Upload, §6 Motion)

PREVIOUS PHASE LINK:
- Phase 4: POST /resources adds to same resources table; new uploads appear in GET /resources
- Phase 2: only verified users can upload
- Phase 1: Supabase Storage bucket "resources", backend folder structure

MY CONFIG:
- HF_TOKEN: {HF_TOKEN or "NOT PROVIDED — ingestion can run but LLM deferred to Phase 6"}
- FAISS_INDEX_PATH: ./faiss_indexes

TASKS:
1. /upload page: UploadZone, metadata form, progress UI, success checklist
2. POST /resources multipart: Supabase Storage + DB insert
3. Backend services: document_parser, text_chunker, embeddings (all-MiniLM-L6-v2), faiss_store, rag_pipeline
4. Persist FAISS index to disk; load on startup
5. Client validation: PDF/DOCX/TXT, max 20MB
6. Block unverified users on upload page and API (403)

Apply all Global Agent Rules from development phase/prompt.md.
Auto-summary/questions can stub "processing" — full AI tools in Phase 7.

After completion, output the Phase Completion Report. CRITICAL: list if HF_TOKEN is missing and whether pip packages (sentence-transformers, faiss-cpu) were installed.
```

---

### Phase 6 – AI Tutor & Chat History

**Link:** Builds on Phase 5 (FAISS indexes) + Phase 2 (verified gate) → Enables Phase 8, 9

```text
Implement LearnHub AI — PHASE 6: AI Tutor & Chat History

Read these files first:
- development phase/phase-06-ai-tutor-and-chat-history.md
- project requirement document/04-rag-ai-assistant-module.md
- project requirement document/05-chat-history-module.md
- project requirement document/11-api-specification.md (chat endpoints)
- design.md (§4.6 AI Tutor, §5 Chat components, §6 Streaming)

PREVIOUS PHASE LINK:
- Phase 5: RAG retrieval uses FAISS indexes created at upload time (resource_id scoped)
- Phase 3: chat UI lives inside DashboardLayout; reuse Toast, Skeleton
- Phase 1: conversations + messages tables

MY CONFIG:
- HF_TOKEN: {HF_TOKEN — REQUIRED for this phase}
- Hugging Face model ID (optional): {MODEL_ID or "use default from PRD"}

TASKS:
1. /ai-tutor and /ai-tutor/:conversationId pages
2. ChatMessage, ChatInput, ConversationList, TypingIndicator, SuggestedQuestions
3. POST /chat, POST /conversations, GET /conversations/{user_id}, GET /messages/{conversation_id}
4. RAG flow: embed query → FAISS top-K → prompt with history → HF LLM response
5. Persist messages; auto-generate conversation title from first message
6. Markdown + code highlighting in assistant messages
7. Streaming or progressive response UI
8. Resource-scoped chat via query param from Phase 4 Ask AI button

Apply all Global Agent Rules from development phase/prompt.md.

After completion, output the Phase Completion Report. MUST flag if HF_TOKEN missing or FAISS has no indexed documents for testing.
```

---

### Phase 7 – AI Study Tools

**Link:** Builds on Phase 5 (document text/FAISS) + Phase 6 (LLM service) → Enables Phase 8

```text
Implement LearnHub AI — PHASE 7: AI Study Tools

Read these files first:
- development phase/phase-07-ai-study-tools.md
- project requirement document/06-ai-study-tools-module.md
- project requirement document/11-api-specification.md (AI tools endpoints)
- design.md (§4.7 AI tools panel, §5 AIToolCard)

PREVIOUS PHASE LINK:
- Phase 5: tools operate on resource_id from uploaded/indexed documents
- Phase 6: reuse llm_service.py for generation calls
- Phase 5 upload success checklist should now show real completion states

TASKS:
1. POST /summarize — 5-line summary, key topics, difficulty, reading time
2. POST /generate-questions — exam/interview questions list
3. POST /generate-revision-notes — definitions, concepts, formulas, bullets
4. POST /generate-diagram — Mermaid syntax + explanation
5. Cache results per resource_id after first generation
6. Trigger summary/questions/revision automatically after upload (background/async)
7. AIToolCard + output panel components (test page OK; full integration in Phase 8)

Apply all Global Agent Rules from development phase/prompt.md.

After completion, output the Phase Completion Report. List any new backend env vars or pip packages.
```

---

### Phase 8 – Resource Preview + AI Workspace

**Link:** Builds on Phases 4–7 → Full /resources/:id experience

```text
Implement LearnHub AI — PHASE 8: Resource Preview + AI Workspace

Read these files first:
- development phase/phase-08-resource-preview-ai-workspace.md
- project requirement document/03-resource-sharing-module.md (§7 detail page)
- project requirement document/06-ai-study-tools-module.md
- design.md (§4.7 Split workspace, §5 PDFViewer)

PREVIOUS PHASE LINK:
- Phase 4: /resources/:id route and GET /resources/{id}
- Phase 5: PDF file in Supabase Storage (file_url)
- Phase 6: Ask Doubts uses same RAG chat scoped to this resource
- Phase 7: all four AI tool endpoints + AIToolCard components

TASKS:
1. Split layout: PDF viewer (60%) + AI Study Tools panel (40%)
2. PDFViewer: page nav, zoom, download, fullscreen; signed URL from backend
3. Wire Summarize, Questions, Revision, Diagram, Ask Doubts to resource_id
4. Resizable divider on desktop; tabbed PDF/Tools on mobile
5. Like button with optimistic UI
6. Mermaid diagram rendering for diagram tool output

Apply all Global Agent Rules from development phase/prompt.md.

After completion, output the Phase Completion Report. End-to-end test: upload → open detail → summarize → ask doubt.
```

---

### Phase 9 – Profile, My Chats & Admin

**Link:** Builds on Phases 4–6 → User management and dashboard polish

```text
Implement LearnHub AI — PHASE 9: Profile, My Chats & Admin

Read these files first:
- development phase/phase-09-profile-my-chats-admin.md
- project requirement document/01-project-overview.md (admin role)
- project requirement document/05-chat-history-module.md
- design.md (§4.8 My Chats, §4.9 Profile)

PREVIOUS PHASE LINK:
- Phase 6: My Chats extends conversation APIs and chat sidebar patterns
- Phase 4: profile "My Uploads" filters resources by uploaded_by
- Phase 2: users.role field for admin checks

TASKS:
1. /profile — stats, verified badge, user's uploads grid, edit name, change password, logout
2. /my-chats — full page list, search, sort, delete with confirmation
3. DELETE /conversations/{id}, PATCH title (optional rename)
4. DELETE /resources/{id} — owner OR admin role only
5. Wire dashboard "Continue Learning" and landing popular resources to real API data
6. Admin delete button on ResourceCard when users.role === 'admin'

Apply all Global Agent Rules from development phase/prompt.md.

After completion, output the Phase Completion Report. Note how to set admin role in Supabase for testing.
```

---

### Phase 10 – Mobile, Polish & Accessibility

**Link:** Builds on Phases 3–9 (all features) → Production-quality UI

```text
Implement LearnHub AI — PHASE 10: Mobile, Polish & Accessibility

Read these files first:
- development phase/phase-10-mobile-polish-accessibility.md
- project requirement document/10-ui-ux-requirements.md (§13 mobile)
- design.md (§6 Motion, §7 Responsive, §13 Accessibility)

PREVIOUS PHASE LINK:
- All feature pages from Phases 3–9 must remain functional
- Add BottomNav without breaking Sidebar on desktop
- Enhance existing components — do not rewrite features from scratch

TASKS:
1. BottomNav on mobile: Home, Resources, Upload, AI Tutor, Profile
2. Chat history drawer on mobile; FAB for Ask AI
3. Page transitions, card hover, like animation, upload drop pulse
4. Skeleton + empty + error states on every async page
5. Toast notifications, delete confirmation modals, error boundary
6. prefers-reduced-motion support
7. ARIA labels, focus rings, keyboard navigation on auth and chat

Apply all Global Agent Rules from development phase/prompt.md.
Do NOT deploy to production yet — that is Phase 11.

After completion, output the Phase Completion Report. Include device breakpoints tested.
```

---

### Phase 11 – Deployment & Capstone QA

**Link:** Builds on ALL phases 1–10 → Live production app

```text
Implement LearnHub AI — PHASE 11: Deployment & Capstone QA

Read these files first:
- development phase/phase-11-deployment-and-capstone-qa.md
- project requirement document/12-environment-and-deployment.md
- project requirement document/14-capstone-alignment-and-conclusion.md
- design.md (§14 Implementation Priority — validate all items done)

PREVIOUS PHASE LINK:
- Phases 1–10 must be feature-complete locally before deploying
- Production env vars extend local .env — document every difference

MY CONFIG:
- Vercel frontend URL: {VERCEL_URL or "NOT PROVIDED"}
- Render backend URL: {RENDER_URL or "NOT PROVIDED"}
- Production Supabase redirect: https://{VERCEL_DOMAIN}/auth/callback
- Google OAuth production credentials: {YES/NO}

TASKS:
1. Deploy frontend to Vercel with VITE_* env vars
2. Deploy backend to Render with HF_TOKEN, SUPABASE_*, CORS_ORIGINS
3. Configure persistent disk for FAISS on Render (or document re-index procedure)
4. Update Supabase OAuth redirect URLs for production
5. vercel.json SPA rewrites if needed
6. Run full QA checklist from phase-11 file
7. Verify all 10 capstone requirements in Module 14
8. Update root README with live URLs, architecture, setup instructions

Apply all Global Agent Rules from development phase/prompt.md.

After completion, output the Phase Completion Report with:
- Live URLs
- Complete env var matrix (local vs production)
- Capstone checklist (all 10 items ✅/❌)
- Known limitations
- 5-minute demo script
```

---

## Post-Phase Report Template (Agent Must Fill)

After **every phase**, the agent must output this report to the user:

```markdown
---
# Phase {N} Completion Report — {Phase Title}

## A) Missing Details (Action Required From You)
| Item | Status | Why It Matters |
|------|--------|----------------|
| {e.g. HF_TOKEN} | ❌ Not provided | Cannot test AI chat until set in backend/.env |
| {e.g. Google OAuth} | ⚠️ Partial | OAuth button exists but redirect not configured |

## B) Environment File Updates

### frontend/.env
| Variable | Added/Changed | Example Value |
|----------|---------------|---------------|
| VITE_API_URL | unchanged | http://localhost:8000 |

### backend/.env
| Variable | Added/Changed | Example Value |
|----------|---------------|---------------|
| HF_TOKEN | ADDED | hf_xxxxxxxx (set yours) |

> ⚠️ Update your local .env files with the values above. Do NOT commit real secrets.

## C) Manual Steps You Must Do
1. {e.g. Run supabase/migrations/001_schema.sql in Supabase SQL Editor}
2. {e.g. Enable Google provider in Supabase Dashboard → Authentication}
3. {e.g. pip install -r backend/requirements.txt}

## D) What Was Built
- {bullet list of features and key files}

## E) Acceptance Criteria
- [x] {criterion from phase file}
- [ ] {blocked criterion — reason}

## F) Link to Next Phase
Phase {N+1} will use: {list concrete artifacts — e.g. "FAISS indexes from upload", "useAuth hook", "GET /resources API"}

## G) How to Test Locally
```bash
# Terminal 1
cd backend && uvicorn main:app --reload

# Terminal 2
cd frontend && npm run dev
```
1. {step-by-step verification for this phase}
2. {expected result}

---
Ready for Phase {N+1}? Confirm before proceeding.
```

---

## Quick Reference: Which Env Vars Per Phase

| Variable | Phase First Needed | File |
|----------|-------------------|------|
| `VITE_SUPABASE_URL` | 1 | frontend/.env |
| `VITE_SUPABASE_ANON_KEY` | 1 | frontend/.env |
| `VITE_API_URL` | 1 | frontend/.env |
| `SUPABASE_URL` | 1 | backend/.env |
| `SUPABASE_KEY` | 1 | backend/.env |
| `SUPABASE_SERVICE_ROLE_KEY` | 1 (recommended) | backend/.env |
| `CORS_ORIGINS` | 1 | backend/.env |
| `FAISS_INDEX_PATH` | 5 | backend/.env |
| `HF_TOKEN` | 5 (ingest optional) / **6 required** | backend/.env |
| Google OAuth credentials | 2 | Supabase Dashboard (not .env on frontend) |
| Production URLs | 11 | Vercel + Render dashboards |

---

## Tips for You (Project Owner)

1. **Run phases in order** — skipping Phase 5 breaks Phase 6 RAG chat.
2. **Paste the Global Agent Rules** the first time, then reference them in later prompts.
3. **Keep a personal `.env` checklist** — update it whenever the agent reports section B.
4. **Do not start Phase N+1** until section E shows all critical criteria checked.
5. **If the agent reports MISSING DETAILS**, provide those values before the next phase.
6. **Attach `@development phase/phase-XX-*.md`** in Cursor when prompting for best results.

---

*LearnHub AI – Development Phase Prompts v1.0*
