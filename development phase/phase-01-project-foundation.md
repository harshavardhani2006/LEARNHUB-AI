# Phase 1: Project Foundation & Environment

| | |
|---|---|
| **Depends on** | None (start here) |
| **Blocks** | All other phases |
| **PRD modules** | [07](../project%20requirement%20document/07-technology-stack.md), [08](../project%20requirement%20document/08-system-architecture.md), [09](../project%20requirement%20document/09-database-design.md), [12](../project%20requirement%20document/12-environment-and-deployment.md), [13](../project%20requirement%20document/13-development-guidelines.md) |
| **Design** | [design.md §15](../design.md), [Appendix A Tailwind](../design.md) |

---

## 1. Phase Goal

Establish the monorepo structure, tooling, Supabase project, database schema, and runnable frontend/backend skeletons so feature phases can build on a stable foundation.

---

## 2. Deliverables

- [ ] `frontend/` — Vite + React + Tailwind + React Router scaffold
- [ ] `backend/` — FastAPI app with health check and CORS
- [ ] Supabase project with tables, RLS, storage bucket, auth settings
- [ ] Local `.env` templates (not committed) for frontend and backend
- [ ] README at repo root with local run instructions

---

## 3. Infrastructure Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | Create Supabase project | Module 12 §3 |
| 2 | Run SQL: `users`, `resources`, `conversations`, `messages` | Module 09 §3 |
| 3 | Enable RLS policies on all tables | Module 09 §5 |
| 4 | Create triggers: `handle_new_user`, email verified sync | Module 09 §6 |
| 5 | Create Storage bucket `resources` + policies | Module 09 §7 |
| 6 | Configure Auth: email confirm ON, password recovery ON, Google OAuth prep | Module 12 §3.1 |
| 7 | Document env vars in `.env.example` files | Module 12 §2 |

---

## 4. Backend Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | `main.py`: FastAPI app, CORS from `CORS_ORIGINS` | Module 08, Module 12 §6.5 |
| 2 | `GET /health` → `{ "status": "ok" }` | Module 12 §6.6 |
| 3 | Folder structure: `routers/`, `services/`, `models/`, `middleware/` | Module 13 §3.2, Module 07 §3.2 |
| 4 | `requirements.txt`: fastapi, uvicorn, pydantic, python-dotenv, httpx, supabase | Module 07 |
| 5 | `config.py`: load HF_TOKEN, SUPABASE_*, FAISS_INDEX_PATH | Module 12 |
| 6 | Stub `auth_middleware.py` (JWT verify placeholder) | Module 08 §6 |
| 7 | Run locally: `uvicorn main:app --reload --port 8000` | Module 12 §7 |

---

## 5. Frontend Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | `npm create vite@latest` — React, JavaScript or TypeScript | Module 13 §2.1 |
| 2 | Install: tailwindcss, react-router-dom, axios, lucide-react, @supabase/supabase-js | Module 07 §2.1 |
| 3 | Configure Tailwind with design tokens (colors, fonts, radii) | design.md §2, Appendix A |
| 4 | Load fonts: Poppins, Inter, JetBrains Mono | design.md §2.2 |
| 5 | `src/services/supabase.js`, `src/services/api.js` (base URL from env) | Module 13 §2.5 |
| 6 | Placeholder `App.jsx` routes and `main.jsx` | design.md §15 |
| 7 | Run locally: `npm run dev` on port 5173 | Module 12 §7 |

---

## 6. Acceptance Criteria

- [ ] Frontend loads at `http://localhost:5173` without errors
- [ ] Backend `/health` returns 200 at `http://localhost:8000`
- [ ] Supabase tables visible in dashboard; RLS enabled
- [ ] Storage bucket `resources` exists
- [ ] No secrets committed to Git (`.env` in `.gitignore`)
- [ ] Root README explains how to start both apps

---

## 7. Testing Checklist

- [ ] Hit `/health` via browser or curl
- [ ] Frontend Axios can reach backend (simple test endpoint optional)
- [ ] Supabase client initializes with anon key (console test)

---

## 8. Notes for Next Phase

Phase 2 implements full auth flows; ensure Google OAuth redirect URLs include `http://localhost:5173/auth/callback` before testing OAuth.

---

*Next: [Phase 2 – Authentication](./phase-02-authentication.md)*
