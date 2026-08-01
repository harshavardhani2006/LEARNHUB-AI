# Module 13: Development Guidelines

> **Frontend and backend implementation instructions, coding standards, and build priority for AI-assisted development**

---

## 1. Overview

This module translates the PRD into **actionable development guidance** for building LearnHub AI. It is intended for developers and **AI code generators** (Cursor, Copilot, etc.) to produce consistent, modular, and PRD-compliant code.

### 1.1 Repository Structure (Recommended)

```text
project-root/
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/                  # FastAPI + RAG
│   ├── routers/
│   ├── services/
│   ├── main.py
│   └── requirements.txt
├── project requirement document/   # Modular PRD (this folder)
├── design.md                 # UI/UX design spec
└── prd                       # Original PRD source
```

Monorepo or separate repos are acceptable; keep clear boundaries between frontend and backend.

---

## 2. Frontend Requirements

### 2.1 Core Stack (Mandatory)

| Technology | Purpose |
|------------|---------|
| **React + Vite** | UI framework and build tool |
| **Tailwind CSS** | Styling and responsive layout |
| **React Router DOM** | Routing and protected routes |
| **Axios** | HTTP client for FastAPI backend |
| **Lucide React** | Icons |

### 2.2 Required Reusable Components

Create dedicated, reusable components (names may vary; responsibilities must match):

| Component | Responsibility |
|-----------|----------------|
| **Sidebar** | Dashboard navigation (260px); active route highlight |
| **Navbar / TopNav** | Logo, search, user avatar, notifications |
| **ResourceCard** | Title, subject badge, stats, Read / Ask AI actions |
| **ChatMessage** | User vs assistant bubbles; Markdown; code highlight |
| **UploadZone** | Drag-and-drop, file validation, upload progress |
| **PDFViewer** | In-browser PDF with page navigation and zoom |

Additional recommended components: `BottomNav`, `ChatInput`, `Button`, `Badge`, `Modal`, `Toast`, `Skeleton`, `EmptyState` (see [Module 10](./10-ui-ux-requirements.md)).

### 2.3 Routing Requirements

| Requirement | Implementation |
|-------------|----------------|
| Public routes | `/`, `/login`, `/signup`, `/forgot-password`, `/auth/callback` |
| Protected routes | Wrap dashboard and app pages; redirect to `/login` if unauthenticated |
| Email verification gate | Block `/upload`, `/ai-tutor`, `/my-chats` if `email_verified === false` |
| 404 page | Friendly not-found for unknown routes |

### 2.4 Styling Rules

- Follow color palette and typography from [Module 10 – UI/UX Requirements](./10-ui-ux-requirements.md)
- **24px** page padding, **16px** card radius, **12px** button radius
- Sticky top navigation and sticky chat input on AI Tutor page
- Responsive layouts: desktop sidebar, mobile bottom navigation

### 2.5 State & Data Fetching

| Concern | Guideline |
|---------|-----------|
| Auth state | Supabase client session + context/hook (`useAuth`) |
| API calls | Central Axios instance with base URL from `VITE_API_URL` |
| JWT attachment | Interceptor adds `Authorization: Bearer <token>` |
| 401 handling | Redirect to login or refresh session |
| Chat streaming | Consume SSE or chunked response from `/chat` if implemented |

### 2.6 Frontend Environment

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

See [Module 12 – Environment & Deployment](./12-environment-and-deployment.md).

---

## 3. Backend Requirements

### 3.1 Core Stack (Mandatory)

| Technology | Purpose |
|------------|---------|
| **FastAPI** | REST API |
| **Uvicorn** | ASGI server |
| **Python 3.10+** | Runtime |

### 3.2 Modular Routing

Create **separate router modules** for each domain:

| Module | Router file | Endpoints |
|--------|-------------|-----------|
| **auth** | `routers/auth.py` | signup, login, logout, google, forgot-password |
| **resources** | `routers/resources.py` | CRUD, list with search/filter/sort |
| **chat** | `routers/chat.py` | POST `/chat` |
| **conversations / messages** | `routers/chat.py` or split | conversations, messages |
| **summaries** | `routers/summaries.py` | POST `/summarize` |
| **revision notes** | `routers/revision.py` | POST `/generate-revision-notes` |
| **questions** | `routers/questions.py` | POST `/generate-questions` |
| **diagrams** | `routers/diagrams.py` | POST `/generate-diagram` |

Register all routers in `main.py` with appropriate prefixes and tags for OpenAPI docs.

### 3.3 Supabase Integration

| Responsibility | Implementation |
|----------------|----------------|
| Authentication | Validate Supabase JWT on protected routes |
| PostgreSQL | Store users (extended profile), resources, conversations, messages |
| Storage | Upload PDFs to `resources` bucket; store `file_url` in DB |

Use server-side Supabase client with appropriate key (service role for trusted server operations where RLS bypass is needed — minimize scope).

### 3.4 RAG Pipeline (Mandatory Behavior)

On resource upload (or post-upload job):

1. Download or read file from Supabase Storage
2. **Parse document** (PDF/DOCX/TXT)
3. **Chunk text** (500–1000 tokens, overlap ~100)
4. **Generate embeddings** with `sentence-transformers/all-MiniLM-L6-v2`
5. **Store vectors in FAISS** (scoped by `resource_id`)
6. Trigger or queue **summary, questions, revision notes** generation (Module 06)

On chat request:

1. Embed user query
2. Retrieve top-K chunks from FAISS
3. Build prompt with context + conversation history
4. Call **Hugging Face Inference API** for response
5. Persist user and assistant messages

See [Module 04 – RAG AI Assistant](./04-rag-ai-assistant-module.md) and [Module 08 – System Architecture](./08-system-architecture.md).

### 3.5 Validation & Errors

- Use **Pydantic** models for all request/response bodies
- Return consistent HTTP status codes (see Module 11)
- Log server errors; return safe generic message to client on 500
- Validate file type and size on upload

### 3.6 Backend Environment

```env
HF_TOKEN=...
SUPABASE_URL=...
SUPABASE_KEY=...
CORS_ORIGINS=...
FAISS_INDEX_PATH=...
```

---

## 4. UI Implementation Priority

Implement pages in this order (per PRD §16):

| Phase | Deliverable | Key acceptance criteria |
|-------|-------------|-------------------------|
| **1** | Authentication | Login, Signup, Email Verification, Google OAuth, protected routes |
| **2** | Dashboard | App shell: Sidebar, TopNav, dashboard home, routing |
| **3** | Resources Page | Grid, ResourceCard, search, filter by subject, sort |
| **4** | Upload Page | UploadZone, metadata form, progress, post-upload success |
| **5** | AI Tutor + Chat History | Chat UI, streaming, previous chats sidebar, persist messages |
| **6** | Resource Preview + AI Workspace | PDF viewer + AI study tools panel side-by-side |
| **7** | Polish | My Chats page, Profile, mobile bottom nav, empty/loading states |

Do not skip Phase 1 verification gating — it is a **hard PRD requirement**.

---

## 5. Cross-Cutting Implementation Rules

### 5.1 Authentication & Authorization

| Rule | Detail |
|------|--------|
| Unverified users | Cannot upload, use AI tutor, or chat history |
| JWT on API | All protected backend routes verify token |
| Owner checks | Delete resource: owner or admin only |
| Conversation privacy | Users only access their own `user_id` conversations |

### 5.2 File Upload Flow

```text
Frontend UploadZone → POST /resources (multipart)
Backend → Supabase Storage + DB row → RAG ingest → AI tools cache
Frontend → Success checklist UI
```

### 5.3 Chat Flow

```text
Frontend ChatInput → POST /chat { conversation_id, message, resource_id? }
Backend → FAISS retrieve → HF LLM → stream/return → save messages
Frontend → Render ChatMessage + suggested follow-ups
```

### 5.4 API Contract

Implement endpoints exactly as documented in [Module 11 – API Specification](./11-api-specification.md). Keep OpenAPI (`/docs`) enabled in development for testing.

---

## 6. Coding Conventions

### 6.1 Frontend

| Area | Convention |
|------|------------|
| Components | Functional components + hooks |
| Files | PascalCase for components, camelCase for hooks/utils |
| Styling | Tailwind utility classes; extract repeated patterns to components |
| Icons | Lucide React only for consistency |
| API layer | Single `api.js` / `services/api.ts` module |

### 6.2 Backend

| Area | Convention |
|------|------------|
| Structure | Routers thin; business logic in `services/` |
| Async | Use `async def` for I/O-bound route handlers where beneficial |
| Types | Pydantic schemas for I/O; type hints on functions |
| Secrets | Load from environment only; never hardcode tokens |
| FAISS | Abstract behind `faiss_store.py` service |

---

## 7. Testing Recommendations

| Layer | Focus |
|-------|-------|
| Manual E2E | Auth → upload → summarize → chat |
| API | Postman/Thunder Client collections for all Module 11 endpoints |
| RAG | Upload sample PDF; verify retrieval answers contain document facts |
| UI | Responsive check at mobile/tablet/desktop breakpoints |

Automated tests are optional for capstone unless required by academy; prioritize working E2E flows.

---

## 8. Definition of Done (Per Phase)

### Phase 1 – Authentication

- [ ] Sign up sends verification email
- [ ] Unverified user blocked from upload and AI routes
- [ ] Google OAuth redirects to dashboard
- [ ] Logout clears session

### Phase 2 – Dashboard

- [ ] Sidebar navigation works for all main routes
- [ ] Layout responsive (sidebar collapses / bottom nav on mobile)

### Phase 3 – Resources

- [ ] List, search, filter, sort functional
- [ ] ResourceCard displays metadata and stats

### Phase 4 – Upload

- [ ] PDF upload to Supabase Storage
- [ ] Metadata saved; indexing triggered
- [ ] Success feedback shows AI tools ready

### Phase 5 – AI Tutor

- [ ] Messages persist in DB
- [ ] Previous chats loadable
- [ ] Markdown/code in assistant responses

### Phase 6 – Resource + AI Workspace

- [ ] PDF viewer and AI tools on same page
- [ ] Summarize, questions, revision, diagram endpoints wired

---

## 9. References

| Document | Use |
|----------|-----|
| [10 – UI/UX Requirements](./10-ui-ux-requirements.md) | Visual and layout specs |
| [11 – API Specification](./11-api-specification.md) | Endpoint contracts |
| [09 – Database Design](./09-database-design.md) | Schema and RLS |
| [12 – Environment & Deployment](./12-environment-and-deployment.md) | Env vars and deploy |
| [../design.md](../design.md) | Extended design system and interactions |

---

*Previous: [12 – Environment & Deployment](./12-environment-and-deployment.md) | Next: [14 – Capstone Alignment & Conclusion](./14-capstone-alignment-and-conclusion.md)*
