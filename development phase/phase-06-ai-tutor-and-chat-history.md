# Phase 6: AI Tutor & Chat History

| | |
|---|---|
| **Depends on** | [Phase 5](./phase-05-upload-and-rag-ingestion.md) (indexed documents), [Phase 2](./phase-02-authentication.md) |
| **Blocks** | Phase 8, 9 |
| **PRD modules** | [04](../project%20requirement%20document/04-rag-ai-assistant-module.md), [05](../project%20requirement%20document/05-chat-history-module.md), [11](../project%20requirement%20document/11-api-specification.md) (chat) |
| **Design** | [§4.6 AI Tutor](../design.md), [§5 Chat components](../design.md), [§6 Streaming](../design.md) |

---

## 1. Phase Goal

Build the **AI Tutor** experience: RAG-grounded Q&A, streaming responses, Markdown/code rendering, conversation sidebar, and **persistent chat history** in PostgreSQL.

---

## 2. Deliverables

- [ ] `/ai-tutor` and `/ai-tutor/:conversationId`
- [ ] `ChatMessage`, `ChatInput`, `ConversationList`, `TypingIndicator`, `SuggestedQuestions`
- [ ] `POST /chat`, `POST /conversations`, `GET /conversations/{user_id}`, `GET /messages/{conversation_id}`
- [ ] RAG query path: embed question → FAISS top-K → HF LLM prompt
- [ ] Auto-generated conversation titles from first message

---

## 3. Frontend Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | Two-column layout: previous chats + main chat | design §4.6 |
| 2 | Empty state with starter prompt chips | design §4.6 |
| 3 | User/assistant bubbles with styles | design §4.6, Module 04 §7.2 |
| 4 | `react-markdown` + syntax highlighter for code | Module 04 §7.2 |
| 5 | Sticky `ChatInput`: send on Enter, auto-resize | design §4.6 |
| 6 | Streaming UI: token reveal + typing indicator | design §6.2, Module 04 §7.2 |
| 7 | Suggested follow-up question chips | Module 04 §7.2 |
| 8 | Copy response on assistant messages | Module 04 §7.2 |
| 9 | New Chat, search chats in sidebar | Module 05 §4.1 |
| 10 | Resource-scoped chat via query param / attach | Module 04 §8 |
| 11 | Download conversation (optional) | Module 05 §8.3 |

---

## 4. Backend Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | `POST /conversations` — create with `user_id` | Module 11, Module 05 |
| 2 | `GET /conversations/{user_id}` — list with message counts | Module 05, Module 09 |
| 3 | `GET /messages/{conversation_id}` — ordered ASC | Module 05 §5.2 |
| 4 | `POST /chat`: save user message, retrieve chunks, call HF API | Module 04 §3.2 |
| 5 | Prompt template with context + last N messages | Module 04 §6.2 |
| 6 | Save assistant message; update conversation title if first message | Module 05 §3.1 |
| 7 | Stream response (SSE or chunked) if supported | Module 04 §12 |
| 8 | Verify user owns conversation on all message APIs | Module 05 §9 |
| 9 | 403 if email not verified | Module 02 |
| 10 | Handle no chunks: honest fallback message | Module 04 §11 |

---

## 5. Hugging Face Integration

| # | Task |
|---|------|
| 1 | `llm_service.py` with `HF_TOKEN` |
| 2 | Timeout and error handling |
| 3 | Optional: generate 3 follow-up questions after answer |

---

## 6. Acceptance Criteria

- [ ] User asks question about uploaded PDF; answer reflects document content
- [ ] Messages persist after page refresh
- [ ] Previous chats listed and reload full history
- [ ] New conversation gets auto-title from first message
- [ ] Unverified user cannot access AI Tutor
- [ ] Markdown and code blocks render correctly
- [ ] Follow-up question maintains conversational context

---

## 7. Testing Checklist

- [ ] RAG test: ask fact only present in specific PDF
- [ ] Multi-turn: second question references first answer topic
- [ ] Delete conversation (if implemented) removes from list

---

*Previous: [Phase 5](./phase-05-upload-and-rag-ingestion.md) | Next: [Phase 7](./phase-07-ai-study-tools.md)*
