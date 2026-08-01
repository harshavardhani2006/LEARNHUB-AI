# Module 04: RAG AI Assistant Module

> **AI-powered learning assistant using Retrieval-Augmented Generation for contextual document Q&A**

---

## 1. Module Overview

The RAG AI Assistant is the **core intelligence layer** of LearnHub AI. It uses Retrieval-Augmented Generation (RAG) to answer user questions based on content from uploaded educational documents, providing accurate, contextual, and beginner-friendly responses.

### 1.1 What Is RAG?

**Retrieval-Augmented Generation (RAG)** combines:

1. **Retrieval** — Finding relevant document chunks using vector similarity search
2. **Augmentation** — Injecting retrieved chunks into the LLM prompt as context
3. **Generation** — The LLM generates a response grounded in the retrieved content

This approach ensures AI answers are **based on actual uploaded documents** rather than the LLM's general training data alone, reducing hallucination and improving relevance.

### 1.2 Module Goals

- Answer questions accurately from uploaded PDF content
- Explain complex concepts in simple, beginner-friendly language
- Provide real-world examples and analogies
- Support multi-turn follow-up conversations with context
- Generate educational flowcharts and structured diagrams
- Offer additional learning guidance beyond uploaded documents
- Stream responses progressively for a responsive user experience

---

## 2. AI Assistant Capabilities

### 2.1 Core Capabilities

| # | Capability | Description | Example |
|---|------------|-------------|---------|
| 1 | **Document Q&A** | Answer questions from uploaded PDFs using RAG retrieval | "What is normalization?" |
| 2 | **Simple explanations** | Break down complex topics into easy language | "Explain normalization in simple words" |
| 3 | **Real-world examples** | Provide practical analogies | "Give me a real-world example of a linked list" |
| 4 | **Follow-up questions** | Maintain conversational context across turns | "Can you explain 2NF now?" (after discussing 1NF) |
| 5 | **Educational flowcharts** | Generate structured Mermaid/text diagrams | "Show me the RAG pipeline as a flowchart" |
| 6 | **Conversational context** | Remember previous messages in the same conversation | Multi-turn DBMS discussion |
| 7 | **Continue discussions** | Resume previous conversations from chat history | Open old chat and ask new question |
| 8 | **Additional guidance** | Suggest related topics and learning resources | "What should I study after normalization?" |
| 9 | **Platform guidance** | Help users understand how to use LearnHub AI | "How do I upload a PDF?" |

### 2.2 Response Quality Requirements

| Requirement | Standard |
|-------------|----------|
| **Accuracy** | Answers must be grounded in retrieved document chunks |
| **Simplicity** | Use plain language suitable for beginners |
| **Structure** | Use headings, bullet points, and formatting for readability |
| **Examples** | Include at least one example or analogy when explaining concepts |
| **Honesty** | If answer is not in the document, say so clearly |
| **Formatting** | Support Markdown output (bold, lists, code blocks) |

### 2.3 Example Interaction

**User:** Explain normalization in simple words.

**AI Assistant:**

> Imagine a school library where the same book details are written on every shelf label — title, author, publisher repeated again and again. Normalization is the process of organizing information in a database so that the same data is **not repeated unnecessarily**. Instead, each piece of information is stored in exactly one place, and other tables reference it when needed.
>
> **Real-world analogy:** Think of it like separating a messy notebook into organized index cards — one card for each unique fact, and you just reference the card ID elsewhere instead of rewriting the whole fact.

---

## 3. RAG Pipeline Architecture

### 3.1 Document Ingestion Pipeline

Triggered automatically when a user uploads a document:

```text
Upload PDF
     ↓
Extract Text (PDF parser / DOCX parser)
     ↓
Clean & Preprocess Text (remove headers, footers, page numbers)
     ↓
Split into Chunks (500–1000 tokens per chunk, 100 token overlap)
     ↓
Create Embeddings (sentence-transformers / all-MiniLM-L6-v2)
     ↓
Store in FAISS Vector Store (indexed by resource_id)
     ↓
Ready for Retrieval
```

### 3.2 Query Pipeline

Triggered when a user sends a message in the AI Tutor:

```text
User Question
     ↓
Create Query Embedding (all-MiniLM-L6-v2)
     ↓
Retrieve Top-K Relevant Chunks from FAISS (K = 5 recommended)
     ↓
Build Prompt with Retrieved Context + Conversation History
     ↓
Send to Hugging Face LLM (Inference API)
     ↓
Stream AI Response to Frontend
     ↓
Save Message to Database (messages table)
```

### 3.3 Pipeline Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Document Parser** | PyPDF2 / pdfplumber / python-docx | Extract text from uploaded files |
| **Text Chunker** | Custom splitter (RecursiveCharacterTextSplitter pattern) | Split text into manageable chunks |
| **Embedding Model** | `sentence-transformers/all-MiniLM-L6-v2` | Convert text to 384-dim vectors |
| **Vector Store** | FAISS (Facebook AI Similarity Search) | Store and search embeddings |
| **LLM** | Hugging Face Inference API | Generate natural language responses |
| **Prompt Template** | Custom system + user prompt | Structure context for LLM |

---

## 4. Embedding Model

### 4.1 Model Details

| Property | Value |
|----------|-------|
| **Model** | `all-MiniLM-L6-v2` |
| **Library** | `sentence-transformers` |
| **Dimensions** | 384 |
| **Max Sequence Length** | 256 tokens |
| **Speed** | ~14,000 sentences/sec on GPU |

### 4.2 Why This Model?

- Lightweight and fast — suitable for real-time retrieval
- Good semantic similarity performance for educational text
- Runs locally on the backend (no external API needed for embeddings)
- Well-suited for short-to-medium document chunks

---

## 5. FAISS Vector Store

### 5.1 Configuration

| Setting | Value |
|---------|-------|
| **Index type** | `IndexFlatIP` (inner product) or `IndexFlatL2` (L2 distance) |
| **Scope** | One FAISS index per resource (or global index with resource_id metadata) |
| **Storage** | Persisted to disk; loaded on backend startup |
| **Top-K retrieval** | 5 chunks per query (configurable) |

### 5.2 Index Lifecycle

| Event | Action |
|-------|--------|
| **Document uploaded** | Create new index entries for all chunks |
| **Document deleted** | Remove all index entries for that resource |
| **Backend restart** | Load persisted FAISS index from disk |
| **Re-index requested** | Admin can trigger re-indexing of a resource |

---

## 6. LLM Integration

### 6.1 Hugging Face Inference API

| Property | Value |
|----------|-------|
| **Provider** | Hugging Face Inference API |
| **Authentication** | `HF_TOKEN` environment variable |
| **Response format** | Streaming text (token-by-token) |
| **Max tokens** | 1024 per response (configurable) |
| **Temperature** | 0.7 (balanced creativity and accuracy) |

### 6.2 Prompt Template

```text
System: You are LearnHub AI Tutor, a friendly educational assistant.
Answer questions based ONLY on the provided context from uploaded documents.
Explain concepts in simple language with real-world examples.
If the answer is not in the context, say "I couldn't find this in the uploaded document."
Format responses using Markdown.

Context from document:
{retrieved_chunks}

Conversation history:
{previous_messages}

User question: {user_question}
```

### 6.3 Context Window Management

| Strategy | Detail |
|----------|--------|
| **Retrieved chunks** | Top 5 most relevant chunks (~2500 tokens) |
| **Conversation history** | Last 10 messages included in prompt |
| **Overflow handling** | Truncate oldest messages if context exceeds limit |

---

## 7. Chat Interface Requirements

### 7.1 AI Tutor Page Layout

```text
┌─────────────────────────────────────────────────────────────────┐
│ Previous Chats          │  LearnHub AI Tutor ✨                │
├─────────────────────────┼──────────────────────────────────────┤
│  🔍 Search chats...     │                                      │
│                         │  User: Explain Python lists          │
│  📘 Python Lists        │                                      │
│  📗 DBMS Normalization  │  AI: A list is an ordered, mutable   │
│  📕 AI Revision Notes   │  collection used to store multiple   │
│                         │  values...                           │
│  ➕ New Chat            │                                      │
│                         │  💡 Related Questions                │
│                         │  • Difference between list & tuple   │
│                         │  • List comprehensions               │
│                         │                                      │
│                         │  [Type your question............] ➤  │
└─────────────────────────┴──────────────────────────────────────┘
```

### 7.2 Chat Features

| Feature | Description |
|---------|-------------|
| **Markdown rendering** | Headers, lists, bold, italic, blockquotes in AI responses |
| **Code syntax highlighting** | Python, JavaScript, SQL, etc. in code blocks |
| **Educational diagrams** | Mermaid.js rendered flowcharts and trees |
| **Suggested follow-up questions** | AI-generated related question chips below response |
| **Copy response** | One-click copy button on AI messages |
| **Download conversation** | Export chat as Markdown or text file |
| **Typing animation** | Three-dot indicator while AI is generating |
| **Streaming effect** | Token-by-token progressive reveal with blinking cursor |
| **Resource context** | Link chat to a specific uploaded document |
| **New chat** | Start fresh conversation (optionally scoped to a resource) |

### 7.3 Message Types

| Sender | Alignment | Style |
|--------|-----------|-------|
| **User** | Right | Blue background, white text |
| **Assistant** | Left | Light surface background, AI avatar, purple accent border |
| **System** | Center | Gray italic text (e.g., "Chat linked to Python Basics PDF") |

---

## 8. Resource-Scoped vs. General Chat

### 8.1 Resource-Scoped Chat

- User opens AI Tutor from a specific resource ("Ask AI" button on card)
- RAG retrieval limited to that resource's FAISS index
- Chat header shows linked resource name
- Conversation stored with resource reference

### 8.2 General Chat

- User opens AI Tutor from sidebar navigation
- RAG retrieval searches across all indexed documents (or platform FAQ/KB)
- Useful for platform guidance and cross-document questions
- User can optionally attach a resource context mid-conversation

---

## 9. FAQ and Knowledge Base Integration

The RAG assistant also indexes non-user-uploaded documents:

| Source | Purpose |
|--------|---------|
| **Platform FAQ** | "How do I upload a PDF?", "What file types are supported?" |
| **Admin knowledge base** | Course guidelines, platform help documents |
| **Course guidelines** | Program-specific instructions |

These are processed through the same RAG pipeline and become searchable via vector-based semantic retrieval. See [Module 06 – AI Study Tools](./06-ai-study-tools-module.md) for ingestion details.

---

## 10. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Send message and receive AI response |
| POST | `/conversations` | Create new conversation |
| GET | `/conversations/{user_id}` | List user's conversations |
| GET | `/messages/{conversation_id}` | Get messages for a conversation |

See [Module 11 – API Specification](./11-api-specification.md) for request/response formats.

---

## 11. Error Handling

| Scenario | Behavior |
|----------|----------|
| **No relevant chunks found** | AI responds: "I couldn't find relevant information in the uploaded documents for this question." |
| **LLM API timeout** | Show error toast: "AI is taking longer than expected. Please try again." |
| **LLM API failure** | Show error toast: "Unable to generate response. Please try again later." |
| **Empty user message** | Disable send button; no API call |
| **Unverified user** | Block access; show verification banner |
| **FAISS index not found** | "This document hasn't been indexed yet. Please wait or re-upload." |

---

## 12. Performance Requirements

| Metric | Target |
|--------|--------|
| **Retrieval latency** | < 200ms for FAISS search |
| **First token latency** | < 3 seconds from send to first streamed token |
| **Full response time** | < 15 seconds for typical answers |
| **Embedding generation** | < 5 seconds per document chunk batch |
| **Index build time** | < 30 seconds for a 50-page PDF |

---

*Previous: [03 – Resource Sharing Module](./03-resource-sharing-module.md) | Next: [05 – Chat History Module](./05-chat-history-module.md)*
