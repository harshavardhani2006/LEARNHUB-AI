# Module 03: Resource Sharing Module

> **Upload, browse, search, filter, and manage educational study materials**

---

## 1. Module Overview

The Resource Sharing Module is the core content management system of LearnHub AI. It enables users to upload educational documents, browse community-shared resources, and interact with materials through search, filtering, and engagement features.

### 1.1 Module Goals

- Allow verified users to upload educational PDFs and documents
- Provide a searchable, filterable library of shared resources
- Track engagement metrics (views, likes, AI interactions)
- Enable download and in-browser PDF viewing
- Categorize resources by academic subject
- Feed uploaded documents into the RAG pipeline for AI features

### 1.2 Dependencies

| Module | Relationship |
|--------|-------------|
| Module 02 – Authentication | Upload requires verified user |
| Module 04 – RAG AI Assistant | Uploaded docs are indexed for AI Q&A |
| Module 06 – AI Study Tools | Auto-summary, questions, revision generated on upload |
| Module 09 – Database Design | `resources` table stores metadata |

---

## 2. Supported File Types

| Format | Extension | Priority | Notes |
|--------|-----------|----------|-------|
| **PDF** | `.pdf` | Required | Primary format; full RAG support |
| **DOCX** | `.docx` | Optional | Word documents; text extraction required |
| **TXT** | `.txt` | Optional | Plain text files; direct text ingestion |

### 2.1 File Constraints

| Constraint | Value |
|------------|-------|
| Maximum file size | 20 MB (recommended) |
| Minimum file size | 1 KB |
| Maximum pages (PDF) | 500 pages (recommended) |
| File name | Sanitized on upload; special characters removed |

### 2.2 Unsupported Formats

The following formats are **not supported** in the initial release:

- Images (PNG, JPG) — no OCR in v1
- Videos (MP4, AVI)
- Presentations (PPT, PPTX)
- Spreadsheets (XLS, XLSX)
- Compressed archives (ZIP, RAR)

---

## 3. Upload Metadata

Every uploaded resource requires the following metadata:

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **Title** | Text | Yes | Descriptive name for the resource | "Python Basics – Variables & Loops" |
| **Subject** | Dropdown | Yes | One of 9 predefined categories | "Programming" |
| **Description** | Textarea | No | Brief summary of content (max 500 chars) | "Beginner-friendly notes covering variables, loops, and functions." |
| **Uploaded by** | UUID | Auto | User ID of uploader (from auth session) | Auto-populated |
| **Upload date** | Timestamp | Auto | Date and time of upload | Auto-populated |

### 3.1 Title Validation

- Minimum length: 3 characters
- Maximum length: 200 characters
- No special characters except hyphens, parentheses, and ampersands

### 3.2 Description Validation

- Maximum length: 500 characters
- Optional but recommended for better discoverability

---

## 4. Resource Categories

Resources must be assigned to exactly **one** of the following categories:

| # | Category | Example Content |
|---|----------|-----------------|
| 1 | **Programming** | Python, Java, C++ tutorials and notes |
| 2 | **Database Management Systems** | SQL, normalization, ER diagrams |
| 3 | **Artificial Intelligence** | ML, NLP, neural networks |
| 4 | **Web Development** | HTML, CSS, React, Node.js |
| 5 | **Data Structures** | Arrays, trees, graphs, algorithms |
| 6 | **Mathematics** | Calculus, linear algebra, statistics |
| 7 | **Science** | Physics, chemistry, biology |
| 8 | **Interview Preparation** | Coding interviews, HR questions |
| 9 | **Exam Notes** | University exam notes, quick revision |

### 4.1 Category Usage

- Used for filtering on the Resources page
- Displayed as colored badge on resource cards
- Used by AI to provide subject-contextual responses
- Used for analytics and platform statistics

---

## 5. Resource Features

### 5.1 Upload

| Requirement | Detail |
|-------------|--------|
| **Who can upload** | Verified authenticated users only |
| **Upload method** | Drag-and-drop zone + file picker button |
| **Storage** | Supabase Storage bucket |
| **Post-upload** | Automatic RAG indexing + AI study tool generation |
| **Feedback** | Progress indicator + success checklist |

**Upload flow:**

```text
User selects/drops file
        ↓
Frontend validates file type and size
        ↓
User fills metadata (title, subject, description)
        ↓
User clicks "Upload & Analyze"
        ↓
File uploaded to Supabase Storage
        ↓
Metadata saved to resources table
        ↓
Backend triggers RAG pipeline (extract → chunk → embed → FAISS)
        ↓
AI Study Tools auto-generated (summary, questions, revision notes)
        ↓
Success screen displayed to user
```

### 5.2 Browse Resources

| Requirement | Detail |
|-------------|--------|
| **Access** | All authenticated users (verified and unverified) |
| **Layout** | Grid of resource cards (3-col desktop, 2-col tablet, 1-col mobile) |
| **Pagination** | 20 resources per page (or infinite scroll) |
| **Empty state** | Friendly message with upload CTA |

### 5.3 Search

| Requirement | Detail |
|-------------|--------|
| **Search fields** | Title, description, subject, uploader name |
| **Search type** | Keyword-based (PostgreSQL full-text or ILIKE) |
| **Debounce** | 300ms delay before API call |
| **Results** | Real-time filter of resource grid |
| **No results** | "No resources found" with suggestion to upload |

### 5.4 Filter by Subject

| Requirement | Detail |
|-------------|--------|
| **UI** | Horizontal scrollable pill buttons |
| **Default** | "All" selected |
| **Behavior** | Single-select; clicking a subject filters the grid |
| **Combination** | Works together with search and sort |

### 5.5 Sort

| Sort Option | Description |
|-------------|-------------|
| **Popularity** (default) | Most likes + views combined |
| **Newest** | Most recently uploaded |
| **Oldest** | Earliest uploaded |
| **Most Viewed** | Highest view count |
| **Most Liked** | Highest like count |

### 5.6 Download / Open PDFs

| Action | Behavior |
|--------|----------|
| **Read** | Opens resource detail page with in-browser PDF viewer |
| **Download** | Downloads original file from Supabase Storage |
| **View count** | Incremented when user opens resource detail page |

### 5.7 Like Resources

| Requirement | Detail |
|-------------|--------|
| **Who can like** | Verified users only |
| **Behavior** | Toggle like/unlike (optimistic UI update) |
| **Display** | Heart icon with count on resource card |
| **Storage** | Increment/decrement `likes` column in `resources` table |

### 5.8 Track Views and AI Interactions

| Metric | When Incremented | Stored In |
|--------|------------------|-----------|
| **Views** | User opens resource detail page | `resources.views` |
| **Likes** | User clicks like button | `resources.likes` |
| **AI Interactions** | User asks AI a question about this resource | Tracked per resource (future: dedicated column or analytics table) |

---

## 6. Resource Card Specification

Each resource in the library is displayed as a card:

```text
┌──────────────────────────────┐
│  [PDF Icon/Thumbnail]        │
│  [ Programming ] ← badge     │
│                              │
│  Python Basics               │
│  by Harsha • 2 days ago      │
│                              │
│  Beginner-friendly notes     │
│  covering variables, loops.  │
│                              │
│  👁 120   ❤ 24   💬 18      │
│                              │
│  [ Read ]    [ Ask AI ✨ ]   │
└──────────────────────────────┘
```

### 6.1 Card Elements

| Element | Description |
|---------|-------------|
| **Subject badge** | Colored pill showing category |
| **PDF thumbnail/icon** | Document preview or placeholder icon |
| **Title** | Resource title (truncate at 2 lines) |
| **Contributor** | Uploader name + relative time ("2 days ago") |
| **Description** | Short description (truncate at 2 lines) |
| **Stats row** | Views, likes, AI question count |
| **Read button** | Opens resource detail / PDF viewer |
| **Ask AI button** | Opens AI Tutor scoped to this resource |

---

## 7. Resource Detail Page

The resource detail page provides a **split-panel learning workspace**:

```text
┌───────────────────────────────┬──────────────────────────────┐
│         PDF VIEWER            │        AI Study Tools        │
│         (60% width)           │                              │
│                               │  📑 Summarize               │
│   Page content displayed      │  📌 Important Questions      │
│   with navigation controls    │  ⚡ Revision Notes           │
│                               │  🧭 Explain with Diagram     │
│   [ ◀ ] Page 1/24 [ ▶ ]      │  🤖 Ask Doubts               │
│   [ − ] 100% [ + ]           │                              │
└───────────────────────────────┴──────────────────────────────┘
```

See [Module 06 – AI Study Tools](./06-ai-study-tools-module.md) for tool panel details.

---

## 8. Admin / Moderation

| Action | Who | Description |
|--------|-----|-------------|
| **Delete resource** | Admin or resource owner | Remove resource and associated FAISS index |
| **Remove duplicates** | Admin | Identify and delete duplicate uploads |
| **Monitor uploads** | Admin | View recent upload activity |

---

## 9. API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/resources` | List all resources (search, filter, sort) | Yes |
| POST | `/resources` | Upload new resource | Yes (verified) |
| GET | `/resources/{id}` | Get single resource details | Yes |
| DELETE | `/resources/{id}` | Delete resource | Yes (owner/admin) |

### 9.1 GET /resources — Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Keyword search |
| `subject` | string | Filter by category |
| `sort` | string | `popularity`, `newest`, `oldest`, `views`, `likes` |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20) |

See [Module 11 – API Specification](./11-api-specification.md) for full details.

---

## 10. Database Schema

**Table: `resources`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `title` | TEXT | NOT NULL | Resource title |
| `subject` | TEXT | NOT NULL | Category enum |
| `description` | TEXT | NULLABLE | Short description |
| `file_url` | TEXT | NOT NULL | Supabase Storage URL |
| `uploaded_by` | UUID | FK → users.id | Uploader reference |
| `views` | INTEGER | DEFAULT 0 | View count |
| `likes` | INTEGER | DEFAULT 0 | Like count |
| `created_at` | TIMESTAMP | DEFAULT now() | Upload timestamp |

See [Module 09 – Database Design](./09-database-design.md) for relationships and indexes.

---

## 11. Storage Structure

**Supabase Storage Bucket:** `resources`

```text
resources/
 └── {user_id}/
      └── {resource_id}/
           └── {filename}.pdf
```

| Rule | Detail |
|------|--------|
| Access | Authenticated users can read; only owner can write |
| Public URL | Signed URLs for download (expiry: 1 hour) |
| Max size | 20 MB per file |

---

## 12. Post-Upload Processing

After a successful upload, the backend automatically:

1. **Stores file** in Supabase Storage
2. **Saves metadata** to `resources` table
3. **Extracts text** from PDF/document
4. **Chunks text** into segments for embedding
5. **Generates embeddings** using `all-MiniLM-L6-v2`
6. **Stores vectors** in FAISS index (scoped to resource ID)
7. **Generates auto-summary** (Module 06)
8. **Generates important questions** (Module 06)
9. **Generates revision notes** (Module 06)

**User-facing feedback after upload:**

```text
✅ Document uploaded successfully
📑 Summary generated
📌 Important questions created
⚡ Revision notes ready
🧭 Learning diagrams available
```

---

*Previous: [02 – Authentication Module](./02-authentication-module.md) | Next: [04 – RAG AI Assistant Module](./04-rag-ai-assistant-module.md)*
