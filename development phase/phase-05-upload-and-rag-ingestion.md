# Phase 5: Upload & RAG Document Ingestion

| | |
|---|---|
| **Depends on** | [Phase 2](./phase-02-authentication.md) (verified user), [Phase 4](./phase-04-resource-library.md) |
| **Blocks** | Phase 6, 7, 8 |
| **PRD modules** | [03](../project%20requirement%20document/03-resource-sharing-module.md), [04](../project%20requirement%20document/04-rag-ai-assistant-module.md) (ingestion), [08](../project%20requirement%20document/08-system-architecture.md), [11](../project%20requirement%20document/11-api-specification.md) (POST resources) |
| **Design** | [§4.5 Upload](../design.md), [§6 Motion upload states](../design.md) |

---

## 1. Phase Goal

Enable **verified users** to upload PDFs (optional DOCX/TXT), store files in Supabase Storage, save metadata, and run the **RAG ingestion pipeline** (extract → chunk → embed → FAISS). Show upload progress and post-upload success checklist.

---

## 2. Deliverables

- [ ] `/upload` page with drag-and-drop and metadata form
- [ ] `POST /resources` multipart upload
- [ ] Services: `document_parser`, `text_chunker`, `embeddings`, `faiss_store`, `rag_pipeline`
- [ ] FAISS index persisted under `FAISS_INDEX_PATH`
- [ ] Post-upload UI checklist (summary/questions may complete in Phase 7)

---

## 3. Frontend Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | `UploadZone`: default, drag-over, file selected, error states | design §4.5, Module 03 §5.1 |
| 2 | Metadata: title, subject dropdown, description | Module 03 §3 |
| 3 | Client validation: type PDF/DOCX/TXT, max 20MB | Module 03 §2.1 |
| 4 | Upload progress bar + multi-step indicator | design §4.5, Module 03 §12 |
| 5 | Success panel with checklist animation | Module 03 §12, design §6 |
| 6 | Links: View Resource, Ask AI | Module 03 §12 |
| 7 | Block page for unverified users | Module 02 §6 |

---

## 4. Backend Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | `POST /resources`: validate JWT + email verified | Module 11, Module 02 |
| 2 | Upload file to Supabase Storage path `{user_id}/{resource_id}/file` | Module 09 §7 |
| 3 | Insert row in `resources` table | Module 09 |
| 4 | `document_parser.py` — extract text from PDF/DOCX/TXT | Module 04 §3.1, Module 08 |
| 5 | Chunk text (500–1000 tokens, ~100 overlap) | Module 04 §3.1 |
| 6 | `embeddings.py` — all-MiniLM-L6-v2 | Module 04 §4 |
| 7 | `faiss_store.py` — add vectors scoped by `resource_id` | Module 04 §5 |
| 8 | Persist index to disk; load on startup | Module 09 §8, Module 12 |
| 9 | On delete resource: remove FAISS entries + storage file | Module 03 §8 |
| 10 | Return resource ID + processing status in response | Module 11 |

---

## 5. Optional in This Phase (or Phase 7)

| Task | Note |
|------|------|
| Trigger auto-summary/questions/revision after ingest | Can stub "processing" until Phase 7 |

---

## 6. Acceptance Criteria

- [ ] Verified user can upload PDF with title and subject
- [ ] File appears in Supabase Storage and DB
- [ ] FAISS index contains chunks for resource ID
- [ ] New resource appears on `/resources` after upload
- [ ] Unverified user cannot upload (403 or UI block)
- [ ] Invalid file type/size rejected with clear error
- [ ] Success screen shows checklist states

---

## 7. Testing Checklist

- [ ] Upload 5–10 page PDF; verify chunk count > 0 in logs
- [ ] Restart backend; FAISS still retrieves chunks for resource
- [ ] Upload second PDF; indexes do not overwrite first

---

*Previous: [Phase 4](./phase-04-resource-library.md) | Next: [Phase 6](./phase-06-ai-tutor-and-chat-history.md)*
