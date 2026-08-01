# Module 08: System Architecture

> **High-level system design, component interactions, data flows, and RAG pipeline architecture**

---

## 1. Architecture Overview

LearnHub AI follows a **three-tier architecture** with a React frontend, FastAPI backend, and Supabase cloud services, integrated with a local RAG pipeline for AI-powered document understanding.

### 1.1 High-Level Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                       │
│                     Hosted on Vercel                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Pages   │ │Components│ │  Router  │ │  Axios API Layer │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS (REST API)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (Python)                      │
│                   Hosted on Render                              │
│  ┌──────┐ ┌───────────┐ ┌──────┐ ┌───────────┐ ┌───────────┐  │
│  │ auth │ │ resources │ │ chat │ │ summaries │ │ diagrams  │  │
│  └──────┘ └───────────┘ └──────┘ └───────────┘ └───────────┘  │
│                             │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   RAG Pipeline Service                      │   │
│  │  Document Parser → Chunker → Embeddings → FAISS → LLM   │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────┬──────────────┬──────────────────┬───────────────────────┘
       │              │                  │
       ▼              ▼                  ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐
│  Supabase   │ │  Supabase   │ │  Hugging Face       │
│  Auth       │ │  PostgreSQL │ │  Inference API      │
│             │ │  + Storage  │ │  (LLM)              │
└─────────────┘ └─────────────┘ └─────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Frontend Components

```text
React App
├── Layout
│   ├── Sidebar (260px navigation)
│   ├── TopNav (search, notifications, avatar)
│   ├── BottomNav (mobile only)
│   └── DashboardLayout (shell wrapper)
├── Pages
│   ├── Home / Landing
│   ├── Login / Signup / VerifyEmail
│   ├── Dashboard
│   ├── Resources (grid + search + filter)
│   ├── ResourceDetail (PDF viewer + AI tools)
│   ├── Upload (drag-drop + metadata form)
│   ├── AITutor (chat + history sidebar)
│   ├── MyChats (conversation management)
│   └── Profile
├── Shared Components
│   ├── ResourceCard
│   ├── ChatMessage
│   ├── ChatInput
│   ├── UploadZone
│   ├── PDFViewer
│   └── UI primitives (Button, Badge, Modal, Toast)
└── Services
    ├── api.js (Axios instance)
    ├── auth.js (Supabase auth helpers)
    └── supabase.js (Supabase client)
```

### 2.2 Backend Modules

```text
FastAPI App
├── Routers (API Endpoints)
│   ├── /auth/*          → Authentication
│   ├── /resources/*     → Resource CRUD
│   ├── /chat            → AI chat messaging
│   ├── /conversations/* → Conversation management
│   ├── /summarize       → Auto-summary generation
│   ├── /generate-*      → AI study tools
│   └── /messages/*      → Message retrieval
├── Services (Business Logic)
│   ├── document_parser   → PDF/DOCX text extraction
│   ├── text_chunker      → Split text into chunks
│   ├── embeddings        → Generate vector embeddings
│   ├── faiss_store       → FAISS index management
│   ├── rag_pipeline      → Orchestrate retrieval + generation
│   └── llm_service       → Hugging Face API calls
├── Middleware
│   └── auth_middleware     → JWT validation
└── Models
    └── schemas             → Pydantic request/response models
```

---

## 3. Data Flow Diagrams

### 3.1 User Authentication Flow

```text
Frontend                    Supabase Auth              Backend
   │                             │                        │
   ├── Sign Up ─────────────────→│                        │
   │                             ├── Create user          │
   │                             ├── Send verify email    │
   │←── Redirect to verify ──────│                        │
   │                             │                        │
   ├── Sign In ─────────────────→│                        │
   │                             ├── Validate credentials │
   │←── JWT token ───────────────│                        │
   │                             │                        │
   ├── API Request + JWT ────────────────────────────────→│
   │                                                        ├── Verify JWT
   │←── Response ──────────────────────────────────────────│
```

### 3.2 Document Upload & Indexing Flow

```text
Frontend          Backend              Supabase           RAG Pipeline
   │                 │                     │                    │
   ├── Upload PDF ──→│                     │                    │
   │                 ├── Store file ──────→│ Storage            │
   │                 ├── Save metadata ───→│ PostgreSQL         │
   │                 │                     │                    │
   │                 ├── Extract text ─────────────────────────→│
   │                 │                     │              Chunk text
   │                 │                     │              Generate embeddings
   │                 │                     │              Store in FAISS
   │                 │                     │                    │
   │                 ├── Generate summary ──────────────────────→│
   │                 ├── Generate questions ────────────────────→│
   │                 ├── Generate revision ─────────────────────→│
   │                 │                     │                    │
   │←── Success ─────│                     │                    │
```

### 3.3 AI Chat (RAG Query) Flow

```text
Frontend          Backend              FAISS           Hugging Face
   │                 │                   │                  │
   ├── Send message →│                   │                  │
   │                 ├── Embed query ───→│                  │
   │                 │←── Top-5 chunks ──│                  │
   │                 │                   │                  │
   │                 ├── Build prompt (context + history)     │
   │                 ├── Send to LLM ────────────────────────→│
   │                 │←── Stream tokens ────────────────────│
   │←── Stream resp ─│                   │                  │
   │                 ├── Save messages ──→ PostgreSQL         │
```

---

## 4. RAG Pipeline Architecture (Detailed)

### 4.1 Ingestion Pipeline

```text
┌─────────────┐
│ Upload PDF  │
└──────┬──────┘
       ▼
┌─────────────────┐
│ Extract Text    │  PyPDF2 / pdfplumber / python-docx
│ (Document Parser)│
└──────┬──────────┘
       ▼
┌─────────────────┐
│ Clean Text      │  Remove headers, footers, page numbers
│ (Preprocessing) │  Normalize whitespace
└──────┬──────────┘
       ▼
┌─────────────────┐
│ Split into      │  Chunk size: 500-1000 tokens
│ Chunks          │  Overlap: 100 tokens
│ (Text Chunker)  │  Preserve paragraph boundaries
└──────┬──────────┘
       ▼
┌─────────────────┐
│ Create          │  Model: all-MiniLM-L6-v2
│ Embeddings      │  Output: 384-dim vectors
│ (Encoder)       │  Batch processing
└──────┬──────────┘
       ▼
┌─────────────────┐
│ Store in FAISS  │  Index type: IndexFlatIP
│ Vector Store    │  Metadata: resource_id, chunk_index
└─────────────────┘
```

### 4.2 Retrieval Pipeline

```text
┌─────────────┐
│ User        │
│ Question    │
└──────┬──────┘
       ▼
┌─────────────────┐
│ Create Query    │  Same model: all-MiniLM-L6-v2
│ Embedding       │  Output: 384-dim vector
└──────┬──────────┘
       ▼
┌─────────────────┐
│ FAISS Search    │  Top-K = 5 most similar chunks
│ (Similarity)    │  Filter by resource_id (if scoped)
└──────┬──────────┘
       ▼
┌─────────────────┐
│ Build Prompt    │  System prompt + retrieved chunks
│                 │  + conversation history + user question
└──────┬──────────┘
       ▼
┌─────────────────┐
│ LLM Generation  │  Hugging Face Inference API
│                 │  Streaming response
└──────┬──────────┘
       ▼
┌─────────────────┐
│ AI Response     │  Markdown formatted
│ (Streamed)      │  Saved to messages table
└─────────────────┘
```

---

## 5. Database Architecture

```text
┌──────────┐       ┌──────────────┐       ┌──────────────┐
│  users   │       │  resources   │       │ conversations│
├──────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)  │──┐    │ id (PK)      │       │ id (PK)      │
│ name     │  │    │ title        │    ┌──│ user_id (FK) │──┐
│ email    │  ├───→│ uploaded_by  │    │  │ title        │  │
│ role     │  │    │ subject      │    │  │ created_at   │  │
│ verified │  │    │ file_url     │    │  └──────────────┘  │
│ created  │  │    │ views/likes  │    │                     │
└──────────┘  │    └──────────────┘    │  ┌──────────────┐  │
              │                        └──│ messages     │  │
              │                           ├──────────────┤  │
              └──────────────────────────→│ conv_id (FK) │  │
                                          │ sender       │  │
                                          │ message      │  │
                                          │ created_at   │  │
                                          └──────────────┘  │
                                                            │
              Supabase Storage                              │
              ┌──────────────┐                              │
              │ resources/   │←── file_url in resources     │
              │  {user_id}/  │                              │
              │  {file}.pdf  │                              │
              └──────────────┘                              │
```

See [Module 09 – Database Design](./09-database-design.md) for full schema details.

---

## 6. Security Architecture

### 6.1 Authentication Flow

```text
Client ──→ Supabase Auth ──→ JWT Token ──→ Backend Middleware ──→ Protected Route
```

| Layer | Security Measure |
|-------|-----------------|
| **Transport** | HTTPS enforced on all endpoints |
| **Authentication** | Supabase JWT tokens |
| **Authorization** | Role-based access (student, admin) |
| **Email verification** | Gates upload and AI features |
| **API validation** | Pydantic schemas on all inputs |
| **File validation** | MIME type and size checks on upload |
| **Storage access** | Supabase RLS policies |

### 6.2 Protected vs. Public Endpoints

| Endpoint Category | Auth Required | Verification Required |
|-------------------|---------------|----------------------|
| Auth (signup, login) | No | — |
| Resources (browse) | Yes | No |
| Resources (upload) | Yes | Yes |
| Chat / AI Tools | Yes | Yes |
| Conversations | Yes | Yes |

---

## 7. Scalability Considerations

| Component | Current (Capstone) | Future Scaling |
|-----------|-------------------|----------------|
| **FAISS index** | Local disk on Render | Pinecone / Weaviate cloud vector DB |
| **LLM** | Hugging Face Inference API | Dedicated GPU instance or OpenAI API |
| **File storage** | Supabase Storage | AWS S3 with CDN |
| **Backend** | Single Render instance | Horizontal scaling with load balancer |
| **Database** | Supabase free tier | Supabase Pro or dedicated PostgreSQL |
| **Caching** | None | Redis for summary/question cache |

---

## 8. Error Handling Architecture

```text
Frontend Error Boundary
        ↓
Axios Interceptor (401 → redirect to login)
        ↓
Backend Exception Handler
        ↓
┌───────────────────────────────────┐
│ 400 Bad Request  → Validation err │
│ 401 Unauthorized → Invalid JWT    │
│ 403 Forbidden    → Unverified   │
│ 404 Not Found    → Missing res  │
│ 500 Server Error → Log + generic│
└───────────────────────────────────┘
        ↓
Frontend Toast Notification
```

---

## 9. Deployment Architecture

```text
GitHub Repository
     │
     ├── Push to main ──→ Vercel (auto-deploy frontend)
     │
     └── Push to main ──→ Render (auto-deploy backend)
                              │
                              ├── Environment variables from Render dashboard
                              ├── FAISS index persisted on disk volume
                              └── Connects to Supabase cloud services
```

| Service | Auto-Deploy | Build Command | Start Command |
|---------|-------------|---------------|---------------|
| **Vercel** | Yes (on push) | `npm run build` | Static serve |
| **Render** | Yes (on push) | `pip install -r requirements.txt` | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

---

*Previous: [07 – Technology Stack](./07-technology-stack.md) | Next: [09 – Database Design](./09-database-design.md)*
