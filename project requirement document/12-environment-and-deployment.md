# Module 12: Environment & Deployment

> **Environment variables, Supabase configuration, deployment targets, and operational setup**

---

## 1. Overview

LearnHub AI runs across three hosted environments: **Vercel** (frontend), **Render** (backend API + RAG pipeline), and **Supabase** (database, authentication, file storage). Correct environment configuration is required for local development and production deployments to work securely and reliably.

### 1.1 Deployment Topology

| Layer | Platform | Responsibility |
|-------|----------|----------------|
| **Frontend** | Vercel | React SPA, static assets, client-side routing |
| **Backend** | Render | FastAPI, FAISS indexes, document processing, LLM proxy |
| **Data & Auth** | Supabase | PostgreSQL, Auth, Storage buckets |
| **LLM** | Hugging Face Inference API | Text generation (external API) |

```text
Browser → Vercel (Frontend)
              ↓ VITE_API_URL
         Render (Backend)
              ├── SUPABASE_URL / SUPABASE_KEY
              ├── HF_TOKEN
              ├── FAISS indexes (persistent disk)
              └── File fetch from Supabase Storage
```

---

## 2. Environment Variables

### 2.1 Backend (`.env`)

Used by the FastAPI application on Render and locally.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `HF_TOKEN` | Yes | Hugging Face API token for Inference API | `hf_xxxxxxxxxxxx` |
| `SUPABASE_URL` | Yes | Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_KEY` | Yes | Supabase anon or service role key (see security note) | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Recommended | Service role for admin/storage ops (server only) | `eyJhbG...` |
| `CORS_ORIGINS` | Recommended | Comma-separated allowed frontend origins | `http://localhost:5173,https://your-app.vercel.app` |
| `FAISS_INDEX_PATH` | Optional | Path to persist FAISS indexes | `./faiss_indexes` |
| `ENVIRONMENT` | Optional | `development` or `production` | `production` |

**Example `.env` file (backend):**

```env
HF_TOKEN=your_huggingface_token
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CORS_ORIGINS=http://localhost:5173,https://your-app.vercel.app
FAISS_INDEX_PATH=./faiss_indexes
ENVIRONMENT=development
```

#### Security Notes (Backend)

| Rule | Detail |
|------|--------|
| **Never commit `.env`** | Add `.env` to `.gitignore` |
| **HF_TOKEN** | Server-side only; never expose to frontend |
| **Service role key** | Use only on backend; bypasses RLS — protect strictly |
| **Anon key on backend** | Acceptable for JWT-validated user-scoped operations if aligned with RLS |

---

### 2.2 Frontend (`.env`)

Used by Vite at build time. Variables must be prefixed with `VITE_`.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Base URL of FastAPI backend | `https://your-backend.onrender.com` |
| `VITE_SUPABASE_URL` | Yes* | Supabase project URL (if auth via client) | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes* | Supabase anon key (public, RLS-protected) | `eyJhbG...` |

\* Required when using Supabase Auth directly from the React app (recommended per PRD).

**Example `.env` file (frontend):**

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Local development:**

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Security Notes (Frontend)

| Rule | Detail |
|------|--------|
| **Anon key is public** | Expected in client; rely on RLS and Auth policies |
| **No HF_TOKEN in frontend** | All LLM calls go through backend |
| **Vercel env vars** | Set in Vercel project settings for Production/Preview |

---

## 3. Supabase Configuration

### 3.1 Authentication Settings

Configure in Supabase Dashboard → Authentication → Providers / Settings:

| Setting | Value | Purpose |
|---------|-------|---------|
| **Enable Email Confirmation** | ON | Mandatory email verification per PRD |
| **Enable Password Recovery** | ON | Forgot / reset password flow |
| **Enable Google OAuth** | ON | "Continue with Google" sign-in |

### 3.2 Google OAuth Setup

1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/)
2. Add authorized redirect URIs in Google Console and Supabase Google provider settings
3. Configure Client ID and Client Secret in Supabase

**Redirect URLs (must match exactly):**

```text
http://localhost:5173/auth/callback
https://your-app.vercel.app/auth/callback
```

**Frontend route:** Implement `/auth/callback` to exchange OAuth session and redirect to dashboard.

### 3.3 Email Templates (Optional Customization)

| Template | Use |
|----------|-----|
| Confirm signup | Email verification link |
| Reset password | Password recovery link |
| Magic link | If enabled (optional) |

Ensure confirmation links redirect to your production or local frontend as configured in Supabase URL settings.

### 3.4 Storage Bucket

| Setting | Value |
|---------|-------|
| Bucket name | `resources` |
| Public access | Disabled (authenticated access) |
| Max file size | 20 MB (align with app validation) |
| Allowed types | PDF, DOCX, TXT MIME types |

See [Module 09 – Database Design](./09-database-design.md) for storage path structure and RLS policies.

### 3.5 Database

- Run SQL from Module 09 to create tables, indexes, RLS policies, and triggers
- Enable Row Level Security on all application tables
- Link `users.id` to `auth.users.id`

---

## 4. Hugging Face Configuration

### 4.1 Account & Token

1. Create account at [huggingface.co](https://huggingface.co)
2. Generate **Access Token** with read permissions (or inference scope as required)
3. Store as `HF_TOKEN` on Render (and local backend `.env`)

### 4.2 Model Selection

| Use | Component | Notes |
|-----|-----------|-------|
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` | Runs on backend (local), not HF Inference API |
| LLM | Hugging Face Inference API model ID | e.g. instruction-tuned model; verify availability on free tier |

### 4.3 Rate Limits & Cold Start

| Consideration | Mitigation |
|---------------|------------|
| API rate limits | Retry with backoff; show user-friendly errors |
| Model cold start | First request may be slow; show loading state in UI |
| Timeouts | Configure httpx/requests timeout (e.g. 60–120s for generation) |

---

## 5. Frontend Deployment (Vercel)

### 5.1 Prerequisites

- GitHub repository connected to Vercel
- Frontend root directory set (if monorepo, specify `frontend/` path)
- Build command: `npm run build`
- Output directory: `dist` (Vite default)

### 5.2 Vercel Environment Variables

Set for **Production** and optionally **Preview**:

| Name | Value |
|------|-------|
| `VITE_API_URL` | Production Render backend URL |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

### 5.3 SPA Routing

Configure Vercel rewrites so client-side routes work:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

(`vercel.json` in frontend root if needed.)

### 5.4 Post-Deploy Checklist

- [ ] Landing page loads over HTTPS
- [ ] `/auth/callback` works with Google OAuth production URL
- [ ] API calls reach Render backend (check CORS)
- [ ] Supabase auth session persists after refresh

---

## 6. Backend Deployment (Render)

### 6.1 Service Type

- **Web Service** (Python)
- Region: closest to users / Supabase region
- Instance: Free or paid tier (free may sleep — cold starts)

### 6.2 Build & Start Commands

| Step | Command |
|------|---------|
| Build | `pip install -r requirements.txt` |
| Start | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

Ensure `requirements.txt` includes: `fastapi`, `uvicorn`, `sentence-transformers`, `faiss-cpu`, `supabase`, `httpx`, PDF parsers, etc.

### 6.3 Render Environment Variables

Add all backend `.env` variables in Render Dashboard → Environment:

- `HF_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGINS` (include Vercel production URL)
- `FAISS_INDEX_PATH` (use persistent disk path if attached)

### 6.4 Persistent Disk (Recommended for FAISS)

| Without disk | With persistent disk |
|--------------|----------------------|
| FAISS indexes lost on redeploy | Indexes survive restarts |
| Must re-index all documents after deploy | Faster recovery |

Mount disk (e.g. `/data/faiss_indexes`) and set `FAISS_INDEX_PATH=/data/faiss_indexes`.

### 6.5 CORS Configuration

FastAPI must allow frontend origin:

```python
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6.6 Health Check

Expose `GET /health` returning `{ "status": "ok" }` for Render health monitoring.

---

## 7. Local Development Setup

### 7.1 Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| Python | 3.10+ |
| Git | Latest |
| Supabase project | Cloud or local Supabase CLI (optional) |

### 7.2 Startup Order

```text
1. Configure Supabase (Auth, Storage, DB schema)
2. Start backend: uvicorn main:app --reload --port 8000
3. Start frontend: npm run dev (port 5173)
4. Verify .env files for both apps
```

### 7.3 Local vs Production URLs

| Service | Local | Production |
|---------|-------|------------|
| Frontend | `http://localhost:5173` | `https://your-app.vercel.app` |
| Backend | `http://localhost:8000` | `https://your-backend.onrender.com` |
| OAuth callback | `http://localhost:5173/auth/callback` | `https://your-app.vercel.app/auth/callback` |

---

## 8. Deployment Checklist

### 8.1 Pre-Launch

- [ ] All environment variables set on Vercel and Render
- [ ] Supabase email confirmation and Google OAuth tested
- [ ] CORS includes production frontend URL
- [ ] Storage bucket policies allow authenticated upload/read
- [ ] Database migrations / SQL applied
- [ ] HF_TOKEN valid and model endpoint reachable
- [ ] FAISS persistence strategy defined (disk on Render)

### 8.2 Post-Launch Smoke Tests

- [ ] Sign up → verify email → upload PDF → AI chat
- [ ] Google OAuth login on production domain
- [ ] Resource browse, search, filter
- [ ] Summarize / questions / revision tools on a resource
- [ ] Chat history persists after logout/login

### 8.3 Monitoring (Recommended)

| Area | Action |
|------|--------|
| Render logs | Monitor API errors and RAG failures |
| Vercel analytics | Page performance (optional) |
| Supabase dashboard | Auth errors, storage usage, DB size |
| Hugging Face | Inference errors and quota |

---

## 9. Troubleshooting

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| CORS error in browser | Backend `CORS_ORIGINS` missing Vercel URL | Add origin and redeploy Render |
| 401 on all API calls | Invalid/expired JWT | Check Supabase session refresh on frontend |
| 403 on upload/chat | Email not verified | Complete verification flow |
| OAuth redirect mismatch | URL not in Supabase/Google config | Add exact callback URL |
| FAISS empty after deploy | No persistent disk | Attach disk or re-run indexing job |
| LLM timeout | Cold start or long prompt | Increase timeout; reduce context size |
| Upload fails | Storage policy or size limit | Check bucket RLS and file size |

---

## 10. Related Modules

| Topic | Module |
|-------|--------|
| API endpoints | [11 – API Specification](./11-api-specification.md) |
| Database & storage schema | [09 – Database Design](./09-database-design.md) |
| Architecture | [08 – System Architecture](./08-system-architecture.md) |
| Tech stack | [07 – Technology Stack](./07-technology-stack.md) |
| Implementation order | [13 – Development Guidelines](./13-development-guidelines.md) |

---

*Previous: [11 – API Specification](./11-api-specification.md) | Next: [13 – Development Guidelines](./13-development-guidelines.md)*
