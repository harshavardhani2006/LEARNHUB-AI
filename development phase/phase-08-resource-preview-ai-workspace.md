# Phase 8: Resource Preview + AI Workspace

| | |
|---|---|
| **Depends on** | [Phase 4](./phase-04-resource-library.md), [Phase 5](./phase-05-upload-and-rag-ingestion.md), [Phase 6](./phase-06-ai-tutor-and-chat-history.md), [Phase 7](./phase-07-ai-study-tools.md) |
| **Blocks** | Phase 9–11 (complete UX) |
| **PRD modules** | [03](../project%20requirement%20document/03-resource-sharing-module.md) §7, [06](../project%20requirement%20document/06-ai-study-tools-module.md), [10](../project%20requirement%20document/10-ui-ux-requirements.md) §12.6 |
| **Design** | [§4.7 Resource Preview](../design.md), [§5 PDFViewer](../design.md), [§5 AIToolCard](../design.md) |

---

## 1. Phase Goal

Deliver the **side-by-side learning workspace** at `/resources/:id`: PDF viewer (60%) + AI Study Tools panel (40%) with Summarize, Questions, Revision, Diagram, and inline Ask Doubts.

---

## 2. Deliverables

- [ ] `PDFViewer` with page nav, zoom, download, fullscreen
- [ ] Resizable split panel (desktop); tabbed PDF/Tools on tablet/mobile
- [ ] All Phase 7 tools wired to resource context
- [ ] Inline mini-chat or link to AI Tutor scoped to resource
- [ ] Like button functional with optimistic UI

---

## 3. Frontend Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | Split layout 60/40 with draggable divider | design §4.7 |
| 2 | `PDFViewer`: react-pdf or equivalent, signed URL from backend | Module 03 §7, design §4.7 |
| 3 | Tool stack: Summarize, Questions, Revision, Diagram, Ask Doubts | Module 10 §12.6 |
| 4 | Output panel slide-in + skeleton loading | design §4.7, §6 |
| 5 | Ask Doubts opens scoped chat or embeds ChatInput | Module 04 §8.1 |
| 6 | Mobile: tabs "Document" / "AI Tools" + FAB Ask AI | design §7.2 |
| 7 | Resource header: title, subject badge, uploader | Module 03 §6 |
| 8 | Like heart animation | design §6.2 |

---

## 4. Backend Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | Signed URL endpoint or proxy for PDF from Storage | Module 09 §7 |
| 2 | All AI tool endpoints accept `resource_id` from URL context | Module 11 |
| 3 | Optional: `POST /resources/{id}/like` toggle | Module 03 §5.7 |
| 4 | Increment views on detail load | Module 03 §5.8 |

---

## 5. Acceptance Criteria

- [ ] User opens resource and reads PDF in-app
- [ ] Each study tool returns output in right panel
- [ ] Diagram renders as Mermaid flowchart
- [ ] Ask Doubts uses RAG scoped to current resource
- [ ] Split panel usable on desktop; usable fallback on mobile
- [ ] Download PDF works

---

## 6. Testing Checklist

- [ ] End-to-end: Upload → Open detail → Summarize → Ask Doubts
- [ ] Large PDF (50+ pages) pagination performance acceptable
- [ ] Tools show cached results on second click

---

*Previous: [Phase 7](./phase-07-ai-study-tools.md) | Next: [Phase 9](./phase-09-profile-my-chats-admin.md)*
