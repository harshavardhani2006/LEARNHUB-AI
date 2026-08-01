# Module 07: Technology Stack

> **Complete technology selection for frontend, backend, AI/RAG, database, and deployment**

---

## 1. Overview

LearnHub AI is built using a modern, production-ready technology stack divided into five layers: Frontend, Backend, AI/RAG, Database & Authentication, and Deployment. Each technology is selected for performance, developer experience, and alignment with the project's AI-first educational goals.

---

## 2. Frontend Stack

| Technology | Version | Purpose | Why Selected |
|------------|---------|---------|--------------|
| **React.js** | 18.x | Frontend UI framework | Component-based architecture, large ecosystem, ideal for interactive UIs |
| **Vite** | 5.x | Build tool and dev server | Fast HMR, optimized production builds, modern ES modules |
| **Tailwind CSS** | 3.x | Utility-first CSS framework | Rapid responsive styling, consistent design system |
| **React Router DOM** | 6.x | Client-side routing | Protected routes, nested layouts, URL-based navigation |
| **Axios** | 1.x | HTTP client for API calls | Interceptors for auth tokens, request/response handling |
| **Lucide React** | Latest | Icon library | Modern, consistent icon set with tree-shaking support |

### 2.1 Additional Frontend Libraries (Recommended)

| Library | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Supabase client for auth and storage |
| `react-markdown` | Render AI responses as Markdown |
| `react-syntax-highlighter` | Code syntax highlighting in chat |
| `mermaid` | Render educational flowcharts |
| `react-pdf` or `@react-pdf-viewer/core` | In-browser PDF viewing |

### 2.2 Frontend Responsibilities

- Render all UI pages and components
- Handle user authentication state (Supabase client)
- Make API calls to FastAPI backend
- Implement responsive layouts (desktop, tablet, mobile)
- Stream AI chat responses in real-time
- Manage client-side routing and protected routes

---

## 3. Backend Stack

| Technology | Version | Purpose | Why Selected |
|------------|---------|---------|--------------|
| **FastAPI** | 0.100+ | REST API framework | Async support, automatic OpenAPI docs, Python-native |
| **Python** | 3.10+ | Backend programming language | Rich AI/ML ecosystem, RAG library support |
| **Uvicorn** | Latest | ASGI server | High-performance async server for FastAPI |

### 3.1 Additional Backend Libraries (Recommended)

| Library | Purpose |
|---------|---------|
| `supabase-py` | Supabase Python client |
| `python-jose` | JWT token validation |
| `python-multipart` | File upload handling |
| `PyPDF2` / `pdfplumber` | PDF text extraction |
| `python-docx` | DOCX text extraction |
| `sentence-transformers` | Embedding generation |
| `faiss-cpu` | Vector similarity search |
| `httpx` | Async HTTP client for Hugging Face API |
| `pydantic` | Request/response validation |

### 3.2 Backend Module Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── routers/
│   ├── auth.py             # Authentication endpoints
│   ├── resources.py        # Resource CRUD endpoints
│   ├── chat.py             # AI chat endpoints
│   ├── summaries.py        # Auto-summary endpoints
│   ├── questions.py        # Question generator endpoints
│   ├── revision.py         # Revision notes endpoints
│   └── diagrams.py         # Diagram generator endpoints
├── services/
│   ├── rag_pipeline.py     # RAG ingestion and retrieval
│   ├── embeddings.py       # Embedding generation
│   ├── faiss_store.py      # FAISS index management
│   ├── llm_service.py      # Hugging Face LLM calls
│   └── document_parser.py  # PDF/DOCX text extraction
├── models/
│   └── schemas.py          # Pydantic request/response models
├── middleware/
│   └── auth_middleware.py   # JWT verification
├── config.py               # Environment configuration
└── requirements.txt        # Python dependencies
```

### 3.3 Backend Responsibilities

- Expose REST API endpoints for all platform features
- Validate JWT tokens from Supabase Auth
- Handle file uploads and store in Supabase Storage
- Run RAG pipeline (extract, chunk, embed, index)
- Query FAISS for relevant document chunks
- Call Hugging Face LLM for response generation
- Manage conversation and message persistence

---

## 4. AI / RAG Stack

| Technology | Purpose | Details |
|------------|---------|---------|
| **sentence-transformers** | Embedding generation library | Python library for computing dense vector representations |
| **all-MiniLM-L6-v2** | Embedding model | Lightweight 384-dim model, fast inference, good semantic quality |
| **FAISS** | Vector similarity search | Facebook AI Similarity Search — efficient nearest-neighbor retrieval |
| **Hugging Face Inference API** | LLM response generation | Cloud-hosted LLM for generating natural language answers |

### 4.1 RAG Pipeline Technologies

```text
Document Upload
     ↓
PyPDF2 / pdfplumber        → Text Extraction
     ↓
Custom Text Splitter        → Chunking (500-1000 tokens)
     ↓
sentence-transformers       → Embedding Generation
all-MiniLM-L6-v2
     ↓
FAISS                       → Vector Storage & Retrieval
     ↓
Hugging Face Inference API  → LLM Response Generation
```

### 4.2 AI Stack Configuration

| Parameter | Value |
|-----------|-------|
| Embedding dimensions | 384 |
| Chunk size | 500–1000 tokens |
| Chunk overlap | 100 tokens |
| Top-K retrieval | 5 chunks |
| LLM temperature | 0.7 |
| Max response tokens | 1024 |
| FAISS index type | IndexFlatIP (inner product) |

### 4.3 Hugging Face Setup

| Setting | Value |
|---------|-------|
| Authentication | `HF_TOKEN` environment variable |
| API endpoint | `https://api-inference.huggingface.co/models/{model_id}` |
| Recommended model | `mistralai/Mistral-7B-Instruct-v0.2` or similar |
| Response mode | Streaming (Server-Sent Events) |

---

## 5. Database & Authentication Stack

| Technology | Purpose | Details |
|------------|---------|---------|
| **Supabase PostgreSQL** | Primary relational database | Stores users, resources, conversations, messages |
| **Supabase Auth** | Authentication service | Email/password, Google OAuth, email verification |
| **Supabase Storage** | File storage | Stores uploaded PDFs and documents |

### 5.1 Supabase Services Used

| Service | Usage |
|---------|-------|
| **Auth** | User registration, login, OAuth, email verification, JWT tokens |
| **Database** | PostgreSQL tables: users, resources, conversations, messages |
| **Storage** | Bucket: `resources/` for uploaded files |
| **Row Level Security** | Users can only access their own conversations |

### 5.2 Supabase Authentication Settings

```text
Enable Email Confirmation:  ON
Enable Password Recovery:   ON
Enable Google OAuth:          ON
```

### 5.3 Google OAuth Redirect URLs

```text
http://localhost:5173/auth/callback        (development)
https://your-app.vercel.app/auth/callback   (production)
```

### 5.4 Supabase Storage Configuration

| Setting | Value |
|---------|-------|
| Bucket name | `resources` |
| Public access | No (authenticated access only) |
| Max file size | 20 MB |
| Allowed MIME types | `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain` |

---

## 6. Deployment Stack

| Component | Platform | Purpose |
|-----------|----------|---------|
| **Frontend** | Vercel | Static site hosting, CDN, automatic deployments from Git |
| **Backend** | Render | Python web service hosting, auto-deploy from Git |
| **Database** | Supabase (Cloud) | Managed PostgreSQL, Auth, Storage |
| **FAISS Index** | Render (disk) | Persisted on backend server filesystem |
| **LLM** | Hugging Face (Cloud) | Inference API — no self-hosting needed |

### 6.1 Deployment Architecture

```text
User Browser
     ↓
Vercel (React Frontend) ──── HTTPS ────→ Render (FastAPI Backend)
                                              │
                                              ├──→ Supabase Auth
                                              ├──→ Supabase PostgreSQL
                                              ├──→ Supabase Storage
                                              ├──→ FAISS (local disk)
                                              └──→ Hugging Face API
```

### 6.2 Environment-Specific URLs

| Environment | Frontend | Backend |
|-------------|----------|---------|
| **Development** | `http://localhost:5173` | `http://localhost:8000` |
| **Production** | `https://your-app.vercel.app` | `https://your-backend.onrender.com` |

---

## 7. Technology Decision Summary

| Decision | Choice | Alternative Considered | Reason |
|----------|--------|----------------------|--------|
| Frontend framework | React + Vite | Next.js | SPA suitable for dashboard app; Vite faster dev experience |
| CSS | Tailwind CSS | CSS Modules, Styled Components | Rapid prototyping, consistent design tokens |
| Backend | FastAPI | Flask, Django | Async support, auto-docs, ideal for AI API endpoints |
| Vector store | FAISS | Pinecone, ChromaDB | Free, local, no external dependency for capstone |
| Embedding model | all-MiniLM-L6-v2 | OpenAI embeddings | Free, local, no API cost |
| LLM | Hugging Face API | OpenAI API | Free tier available, aligns with HF ecosystem |
| Database | Supabase PostgreSQL | Firebase, MongoDB | Full SQL, built-in auth, storage, free tier |
| Auth | Supabase Auth | Auth0, Firebase Auth | Integrated with database, Google OAuth support |
| File storage | Supabase Storage | AWS S3 | Integrated with Supabase, simpler setup |
| Frontend hosting | Vercel | Netlify | Optimized for React/Vite, free tier |
| Backend hosting | Render | Railway, Heroku | Free tier for Python apps, easy deploy |

---

## 8. Development Tools

| Tool | Purpose |
|------|---------|
| **Git + GitHub** | Version control and collaboration |
| **VS Code / Cursor** | IDE with AI-assisted development |
| **Postman / Thunder Client** | API testing |
| **Supabase Dashboard** | Database management, auth config, storage |
| **Render Dashboard** | Backend deployment monitoring |
| **Vercel Dashboard** | Frontend deployment monitoring |

---

*Previous: [06 – AI Study Tools Module](./06-ai-study-tools-module.md) | Next: [08 – System Architecture](./08-system-architecture.md)*
