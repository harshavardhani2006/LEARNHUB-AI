# Phase 7: AI Study Tools

| | |
|---|---|
| **Depends on** | [Phase 5](./phase-05-upload-and-rag-ingestion.md), [Phase 6](./phase-06-ai-tutor-and-chat-history.md) (optional for same LLM service) |
| **Blocks** | Phase 8 |
| **PRD modules** | [06](../project%20requirement%20document/06-ai-study-tools-module.md), [11](../project%20requirement%20document/11-api-specification.md) (AI tools) |
| **Design** | [§4.7 AI tools](../design.md), [§5 AIToolCard](../design.md) |

---

## 1. Phase Goal

Implement **Summarize**, **Important Questions**, **Revision Notes**, and **Explain with Diagram** (Mermaid) — auto-run after upload where specified, and on-demand via API.

---

## 2. Deliverables

- [ ] `POST /summarize`, `/generate-questions`, `/generate-revision-notes`, `/generate-diagram`
- [ ] Backend prompts per Module 06 §10
- [ ] Cache/store generated outputs per `resource_id` (DB JSON column or file cache)
- [ ] Post-upload checklist items populated after processing
- [ ] Reusable `AIToolCard` + output panel component (used fully in Phase 8)

---

## 3. Frontend Tasks (Initial / Standalone Test Page OK)

| # | Task | Reference |
|---|------|-----------|
| 1 | `AIToolCard` buttons with loading state | design §5.1 |
| 2 | Output panel: structured summary, question list, revision markdown | Module 06 §2–4 |
| 3 | Mermaid render for diagram responses | Module 06 §5, design §5.1 |
| 4 | Copy and download `.md` actions | design §4.7 |
| 5 | Wire upload success checklist to real job status | Module 06 §8 |

*Full split-panel integration in Phase 8.*

---

## 4. Backend Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | `routers/summaries.py` — 5-line summary, topics, difficulty, reading time | Module 06 §2 |
| 2 | `routers/questions.py` — 8–15 exam/interview questions | Module 06 §3 |
| 3 | `routers/revision.py` — definitions, concepts, formulas, bullets | Module 06 §4 |
| 4 | `routers/diagrams.py` — Mermaid syntax + explanation | Module 06 §5 |
| 5 | Use full doc text or RAG chunks as LLM input | Module 06 §2.4 |
| 6 | Trigger summary + questions + revision after upload (async/background) | Module 06 §8 |
| 7 | Return cached result if already generated | Module 06 §7.2 |
| 8 | FAQ/KB ingestion endpoint or admin script (optional) | Module 06 §6 |

---

## 5. Acceptance Criteria

- [ ] After upload, summary/questions/revision available within reasonable time
- [ ] On-demand API calls return consistent structured JSON
- [ ] Diagram endpoint returns valid Mermaid parseable by frontend
- [ ] All endpoints require verified auth
- [ ] Invalid `resource_id` returns 404

---

## 6. Testing Checklist

- [ ] Summarize DBMS sample PDF — mentions key topics
- [ ] Questions include mix of definition and explanation types
- [ ] Revision notes include bullet sections
- [ ] Diagram renders in Mermaid preview

---

*Previous: [Phase 6](./phase-06-ai-tutor-and-chat-history.md) | Next: [Phase 8](./phase-08-resource-preview-ai-workspace.md)*
