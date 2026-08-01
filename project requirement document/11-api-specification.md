# Module 11: API Specification

> **Complete REST API endpoint documentation with request/response formats**

---

## 1. Overview

LearnHub AI exposes a REST API via **FastAPI** backend. All authenticated endpoints require a valid Supabase JWT token passed in the `Authorization` header.

### 1.1 Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8000` |
| Production | `https://your-backend.onrender.com` |

### 1.2 Authentication Header

```http
Authorization: Bearer <supabase_jwt_token>
```

### 1.3 Common Response Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (unverified email, insufficient permissions) |
| `404` | Not Found |
| `500` | Internal Server Error |

### 1.4 Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## 2. Authentication Endpoints

### 2.1 POST `/auth/signup`

Register a new user account.

**Auth Required:** No

**Request Body:**

```json
{
  "name": "Harsha Kumar",
  "email": "harsha@example.com",
  "password": "securepassword123"
}
```

**Response (201):**

```json
{
  "message": "Account created. Please verify your email.",
  "user": {
    "id": "uuid",
    "email": "harsha@example.com",
    "email_verified": false
  }
}
```

**Errors:**

| Code | Detail |
|------|--------|
| 400 | Email already registered |
| 400 | Password too short (min 8 characters) |
| 400 | Invalid email format |

---

### 2.2 POST `/auth/login`

Sign in with email and password.

**Auth Required:** No

**Request Body:**

```json
{
  "email": "harsha@example.com",
  "password": "securepassword123"
}
```

**Response (200):**

```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": {
    "id": "uuid",
    "name": "Harsha Kumar",
    "email": "harsha@example.com",
    "email_verified": true,
    "role": "student"
  }
}
```

**Errors:**

| Code | Detail |
|------|--------|
| 401 | Invalid email or password |
| 403 | Email not verified |

---

### 2.3 POST `/auth/logout`

End the current user session.

**Auth Required:** Yes

**Request Body:** None

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

---

### 2.4 POST `/auth/google`

Initiate Google OAuth authentication flow.

**Auth Required:** No

**Request Body:**

```json
{
  "redirect_url": "http://localhost:5173/auth/callback"
}
```

**Response (200):**

```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

---

### 2.5 POST `/auth/forgot-password`

Send password reset email.

**Auth Required:** No

**Request Body:**

```json
{
  "email": "harsha@example.com"
}
```

**Response (200):**

```json
{
  "message": "Password reset email sent"
}
```

---

## 3. Resource Endpoints

### 3.1 GET `/resources`

List all resources with optional search, filter, and sort.

**Auth Required:** Yes

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | — | Keyword search in title and description |
| `subject` | string | — | Filter by subject category |
| `sort` | string | `popularity` | Sort: `popularity`, `newest`, `oldest`, `views`, `likes` |
| `page` | integer | `1` | Page number |
| `limit` | integer | `20` | Items per page |

**Example:** `GET /resources?search=python&subject=Programming&sort=newest&page=1&limit=20`

**Response (200):**

```json
{
  "resources": [
    {
      "id": "uuid",
      "title": "Python Basics",
      "subject": "Programming",
      "description": "Beginner-friendly notes covering variables, loops, and functions.",
      "file_url": "https://supabase.co/storage/...",
      "uploaded_by": "uuid",
      "uploader_name": "Harsha Kumar",
      "views": 120,
      "likes": 24,
      "created_at": "2026-07-28T10:30:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "total_pages": 3
}
```

---

### 3.2 POST `/resources`

Upload a new educational resource.

**Auth Required:** Yes (email verified)

**Request Body:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `file` | File (PDF/DOCX/TXT) | Yes |
| `title` | string | Yes |
| `subject` | string | Yes |
| `description` | string | No |

**Response (201):**

```json
{
  "message": "Resource uploaded and indexed successfully",
  "resource": {
    "id": "uuid",
    "title": "Python Basics",
    "subject": "Programming",
    "description": "Beginner-friendly notes",
    "file_url": "https://supabase.co/storage/...",
    "uploaded_by": "uuid",
    "views": 0,
    "likes": 0,
    "created_at": "2026-07-28T10:30:00Z"
  },
  "processing": {
    "summary_generated": true,
    "questions_generated": true,
    "revision_notes_generated": true,
    "indexed": true
  }
}
```

**Errors:**

| Code | Detail |
|------|--------|
| 403 | Email not verified |
| 400 | Invalid file type |
| 400 | File too large (max 20MB) |
| 400 | Missing required fields |

---

### 3.3 GET `/resources/{id}`

Get a single resource by ID. Increments view count.

**Auth Required:** Yes

**Response (200):**

```json
{
  "id": "uuid",
  "title": "Python Basics",
  "subject": "Programming",
  "description": "Beginner-friendly notes covering variables, loops, and functions.",
  "file_url": "https://supabase.co/storage/...",
  "uploaded_by": "uuid",
  "uploader_name": "Harsha Kumar",
  "views": 121,
  "likes": 24,
  "created_at": "2026-07-28T10:30:00Z"
}
```

**Errors:**

| Code | Detail |
|------|--------|
| 404 | Resource not found |

---

### 3.4 DELETE `/resources/{id}`

Delete a resource. Only the owner or admin can delete.

**Auth Required:** Yes (owner or admin)

**Response (200):**

```json
{
  "message": "Resource deleted successfully"
}
```

**Errors:**

| Code | Detail |
|------|--------|
| 403 | Not authorized to delete this resource |
| 404 | Resource not found |

---

## 4. AI Chat Endpoints

### 4.1 POST `/chat`

Send a message and receive an AI response.

**Auth Required:** Yes (email verified)

**Request Body:**

```json
{
  "conversation_id": "uuid",
  "message": "Explain normalization in simple words",
  "resource_id": "uuid"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `conversation_id` | Yes | Existing conversation ID |
| `message` | Yes | User's question |
| `resource_id` | No | Scope retrieval to specific resource |

**Response (200) — Streaming (Server-Sent Events):**

```
data: {"token": "Imagine"}
data: {"token": " a"}
data: {"token": " school"}
...
data: {"done": true, "message_id": "uuid"}
```

**Non-streaming Response (200):**

```json
{
  "message_id": "uuid",
  "response": "Imagine a school library where the same book details...",
  "suggested_questions": [
    "What is 1NF?",
    "Explain 2NF and 3NF",
    "What are the advantages of normalization?"
  ]
}
```

**Errors:**

| Code | Detail |
|------|--------|
| 403 | Email not verified |
| 404 | Conversation not found |
| 500 | LLM generation failed |

---

### 4.2 POST `/conversations`

Create a new conversation.

**Auth Required:** Yes (email verified)

**Request Body:**

```json
{
  "title": "New Conversation",
  "resource_id": "uuid"
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "New Conversation",
  "created_at": "2026-07-28T10:30:00Z"
}
```

---

### 4.3 GET `/conversations/{user_id}`

List all conversations for a user.

**Auth Required:** Yes (must match authenticated user)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by title or message content |
| `sort` | string | `recent` (default), `oldest` |

**Response (200):**

```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Explain normalization in simple words",
      "message_count": 8,
      "last_message": "2NF builds on 1NF by...",
      "created_at": "2026-07-28T10:30:00Z"
    }
  ],
  "total": 12
}
```

---

### 4.4 GET `/messages/{conversation_id}`

Get all messages in a conversation.

**Auth Required:** Yes (must own the conversation)

**Response (200):**

```json
{
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender": "user",
      "message": "Explain normalization in simple words",
      "created_at": "2026-07-28T10:30:00Z"
    },
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender": "assistant",
      "message": "Imagine a school library where the same book details...",
      "created_at": "2026-07-28T10:30:05Z"
    }
  ],
  "total": 8
}
```

---

## 5. AI Tools Endpoints

### 5.1 POST `/summarize`

Generate an auto-summary for a resource.

**Auth Required:** Yes (email verified)

**Request Body:**

```json
{
  "resource_id": "uuid"
}
```

**Response (200):**

```json
{
  "resource_id": "uuid",
  "summary": "This document provides a comprehensive introduction to DBMS...",
  "key_topics": [
    "Introduction to DBMS",
    "Entity-Relationship Modeling",
    "Normalization (1NF, 2NF, 3NF)",
    "SQL Queries"
  ],
  "difficulty": "Intermediate",
  "reading_time": "18 minutes"
}
```

---

### 5.2 POST `/generate-questions`

Extract important exam/interview questions from a resource.

**Auth Required:** Yes (email verified)

**Request Body:**

```json
{
  "resource_id": "uuid"
}
```

**Response (200):**

```json
{
  "resource_id": "uuid",
  "questions": [
    "What is normalization?",
    "Explain 1NF, 2NF, and 3NF with examples.",
    "What are the advantages of DBMS over file systems?",
    "Differentiate between DBMS and RDBMS.",
    "What is an Entity-Relationship (ER) diagram?"
  ]
}
```

---

### 5.3 POST `/generate-revision-notes`

Generate concise revision notes from a resource.

**Auth Required:** Yes (email verified)

**Request Body:**

```json
{
  "resource_id": "uuid"
}
```

**Response (200):**

```json
{
  "resource_id": "uuid",
  "definitions": [
    {"term": "Normalization", "definition": "Process of organizing data to reduce redundancy"}
  ],
  "concepts": [
    "Redundancy causes update, insert, and delete anomalies",
    "Decomposition splits tables while preserving data integrity"
  ],
  "formulas": [
    "1NF → Atomic values only",
    "2NF → Remove partial dependencies"
  ],
  "notes": [
    "Always identify candidate keys first",
    "Draw FD diagrams before decomposing"
  ]
}
```

---

### 5.4 POST `/generate-diagram`

Generate an educational flowchart/diagram for a topic.

**Auth Required:** Yes (email verified)

**Request Body:**

```json
{
  "resource_id": "uuid",
  "topic": "normalization process"
}
```

**Response (200):**

```json
{
  "resource_id": "uuid",
  "topic": "normalization process",
  "diagram": "graph TD\n    A[Unnormalized Data] --> B[1NF: Atomic Values]\n    B --> C[2NF: Remove Partial Dependencies]\n    C --> D[3NF: Remove Transitive Dependencies]",
  "explanation": "This flowchart shows the step-by-step normalization process..."
}
```

---

## 6. API Endpoint Summary

| Method | Endpoint | Auth | Verified | Module |
|--------|----------|------|----------|--------|
| POST | `/auth/signup` | No | — | Authentication |
| POST | `/auth/login` | No | — | Authentication |
| POST | `/auth/logout` | Yes | — | Authentication |
| POST | `/auth/google` | No | — | Authentication |
| POST | `/auth/forgot-password` | No | — | Authentication |
| GET | `/resources` | Yes | — | Resources |
| POST | `/resources` | Yes | Yes | Resources |
| GET | `/resources/{id}` | Yes | — | Resources |
| DELETE | `/resources/{id}` | Yes | — | Resources |
| POST | `/chat` | Yes | Yes | AI Chat |
| POST | `/conversations` | Yes | Yes | Chat History |
| GET | `/conversations/{user_id}` | Yes | Yes | Chat History |
| GET | `/messages/{conversation_id}` | Yes | Yes | Chat History |
| POST | `/summarize` | Yes | Yes | AI Study Tools |
| POST | `/generate-questions` | Yes | Yes | AI Study Tools |
| POST | `/generate-revision-notes` | Yes | Yes | AI Study Tools |
| POST | `/generate-diagram` | Yes | Yes | AI Study Tools |

---

*Previous: [10 – UI/UX Requirements](./10-ui-ux-requirements.md) | Next: [12 – Environment & Deployment](./12-environment-and-deployment.md)*
