# LearnHub AI

An AI-powered collaborative learning platform built with React, FastAPI, and Supabase. Upload study materials, get AI-generated summaries, mock exams, revision notes, and chat with a RAG-powered AI tutor.

---

## Features

- **Resource Library** — Upload and browse PDF, DOCX, and TXT study materials
- **AI Study Tools** — Auto-generated summaries, mock exam questions, revision notes, and concept diagrams
- **RAG AI Tutor** — Chat with an AI tutor that answers questions grounded in your uploaded documents
- **Ask Doubts** — Document-scoped chat panel inside each resource workspace
- **PDF Viewer** — Built-in streamed PDF viewer with zoom and fullscreen
- **Auth** — Email/password signup + Google OAuth via Supabase
- **Notifications** — Live bell notification feed from real activity
- **Profile & Settings** — Name editing, password change, uploaded documents view
- **My Chats** — Full chat history with rename, delete, and search
- **Responsive** — Mobile bottom nav, desktop sidebar, resizable split panels

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | FastAPI, Python 3.11, Uvicorn |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Auth | Supabase Auth (Email + Google OAuth) |
| AI / LLM | Hugging Face Inference API (Qwen2.5-7B) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Vector Store | FAISS (local disk) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Project Structure

```
project3_threeatoms/
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── pages/             # Route-level pages
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # AuthContext
│   │   ├── hooks/             # useAuth hook
│   │   └── services/          # api.js, supabase.js
│   ├── .env.example           # Frontend env template
│   └── vercel.json            # Vercel SPA routing config
│
├── backend/                   # FastAPI app
│   ├── routers/               # auth, resources, chats, study_tools, users
│   ├── services/              # LLM, embeddings, FAISS, document parser, chunker
│   ├── middleware/            # JWT auth middleware
│   ├── main.py                # App entry point
│   ├── config.py              # Settings from env vars
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Backend env template
│   ├── Procfile               # Render start command
│   └── render.yaml            # Render deployment config
│
└── README.md
```

---

## Getting Started (Local)

### Prerequisites

- Node.js 18+
- Python 3.11+
- A [Supabase](https://supabase.com) project
- A [Hugging Face](https://huggingface.co) account with an API token

### 1. Clone the repo

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt

cp .env.example .env
# Fill in your real values in .env
```

Run the backend:

```bash
python main.py
# API running at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### 3. Frontend setup

```bash
cd frontend
npm install

cp .env.example .env
# Fill in your real values in .env
```

Run the frontend:

```bash
npm run dev
# App running at http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `HF_TOKEN` | Hugging Face API token |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase dashboard |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `FAISS_INDEX_PATH` | Path to store FAISS indexes |
| `ENVIRONMENT` | `development` or `production` |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

---

## Deployment

### Frontend → Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Set **Root Directory** to `frontend`
4. Add environment variables in Vercel dashboard (from `frontend/.env.example`)
5. Deploy

### Backend → Render

1. Go to [render.com](https://render.com) → New Web Service → Connect repo
2. Set **Root Directory** to `backend`
3. **Build command**: `pip install -r requirements.txt`
4. **Start command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard (from `backend/.env.example`)
6. Deploy

### After deploying both:
- Copy your Render backend URL (e.g. `https://learnhub-ai-backend.onrender.com`)
- Set `VITE_API_URL` in Vercel to that URL
- Set `CORS_ORIGINS` in Render to your Vercel frontend URL

---

## Seeding Resources

After deploying, seed the database with sample study materials:

```bash
cd backend
python reseed.py
```

This generates real multi-page PDFs and uploads them to Supabase Storage.

---

## API Docs

Once running, visit `http://localhost:8000/docs` for the full interactive Swagger UI.

---

## License

MIT
