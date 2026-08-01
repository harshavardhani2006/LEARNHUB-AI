# Phase 11: Deployment & Capstone QA

| | |
|---|---|
| **Depends on** | [Phases 1–10](./README.md) |
| **Blocks** | Project submission |
| **PRD modules** | [12](../project%20requirement%20document/12-environment-and-deployment.md), [14](../project%20requirement%20document/14-capstone-alignment-and-conclusion.md), [11](../project%20requirement%20document/11-api-specification.md) |
| **Design** | [§14 Implementation Priority](../design.md) (validation) |

---

## 1. Phase Goal

Deploy **frontend (Vercel)**, **backend (Render)**, configure production Supabase URLs, run **end-to-end QA**, and verify **all capstone requirements** from Module 14.

---

## 2. Deliverables

- [ ] Production URLs live and documented in README
- [ ] Environment variables set on Vercel + Render
- [ ] Google OAuth production callback working
- [ ] FAISS persistence strategy validated on Render (disk or re-index procedure)
- [ ] Capstone evidence checklist completed
- [ ] Demo script / test plan document

---

## 3. Deployment Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | Connect GitHub repo to Vercel | Module 12 §5 |
| 2 | Set `VITE_API_URL`, `VITE_SUPABASE_*` on Vercel | Module 12 §2.2 |
| 3 | `vercel.json` SPA rewrites if needed | Module 12 §5.3 |
| 4 | Create Render web service for FastAPI | Module 12 §6 |
| 5 | Set backend env: HF_TOKEN, SUPABASE_*, CORS_ORIGINS | Module 12 §6.3 |
| 6 | Attach persistent disk for `FAISS_INDEX_PATH` (recommended) | Module 12 §6.4 |
| 7 | Add production OAuth redirect in Supabase + Google | Module 12 §3.2 |
| 8 | Smoke test production deploy checklist | Module 12 §8 |

---

## 4. QA / Test Plan

### 4.1 Authentication

- [ ] Sign up → verify email → access upload
- [ ] Google login on production domain
- [ ] Unverified user blocked from AI features
- [ ] Password reset flow

### 4.2 Resources & Upload

- [ ] Browse, search, filter, sort on production
- [ ] Upload PDF → appears in library
- [ ] View PDF on detail page

### 4.3 RAG & AI

- [ ] Chat answer grounded in uploaded document
- [ ] Chat history persists after re-login
- [ ] Summarize, questions, revision, diagram on resource
- [ ] Follow-up questions in conversation

### 4.4 Capstone Matrix (Module 14)

| Requirement | Verified |
|-------------|----------|
| Educational website | [ ] |
| Website-integrated chatbot | [ ] |
| Document ingestion | [ ] |
| Vector-based semantic search | [ ] |
| Conversational memory | [ ] |
| Context-aware response generation | [ ] |
| Admin/document upload | [ ] |
| Full-stack backend integration | [ ] |
| LLM + RAG architecture | [ ] |
| Real-world applicability | [ ] |

---

## 5. Documentation Tasks

| # | Task |
|---|------|
| 1 | Root README: architecture diagram, stack, local setup, live URLs |
| 2 | Link to `project requirement document/` and `design.md` |
| 3 | List known limitations (from Module 14 §5) |
| 4 | Optional: Postman collection for Module 11 endpoints |

---

## 6. Acceptance Criteria (Project Complete)

- [ ] Public demo URL shared and stable
- [ ] All Phase 1–10 acceptance criteria still pass in production
- [ ] All 10 capstone rows checked in Module 14 table
- [ ] No secrets in repository
- [ ] HF_TOKEN and service keys only on Render

---

## 7. Post-Launch Monitoring

| Area | Action |
|------|--------|
| Render logs | Watch 5xx and RAG errors |
| Supabase | Monitor auth failures, storage quota |
| Hugging Face | Monitor inference failures/timeouts |
| User feedback | Track issues for v2 backlog |

---

## 8. Suggested Demo Flow (5–7 minutes)

1. Show landing page and sign up / Google login  
2. Upload a short PDF with subject metadata  
3. Open resource workspace — run Summarize and Questions  
4. Ask AI Tutor a document-specific question  
5. Show chat history and continue conversation  
6. Briefly show architecture (Module 08 diagram) and stack (Module 07)

---

*Previous: [Phase 10](./phase-10-mobile-polish-accessibility.md) | Index: [README](./README.md)*
