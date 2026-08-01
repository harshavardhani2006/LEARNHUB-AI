# Module 09: Database Design

> **Complete database schema, table definitions, relationships, and constraints**

---

## 1. Overview

LearnHub AI uses **Supabase PostgreSQL** as its primary database. The schema consists of four core tables that support user management, resource sharing, and AI conversation persistence. Supabase Auth manages the authentication layer separately, with the `users` table extending auth data with application-specific fields.

### 1.1 Database Technology

| Property | Value |
|----------|-------|
| **Provider** | Supabase (Managed PostgreSQL) |
| **Version** | PostgreSQL 15+ |
| **Connection** | Supabase client SDK (frontend) + supabase-py (backend) |
| **Security** | Row Level Security (RLS) policies |

---

## 2. Entity Relationship Diagram

```text
┌──────────────────┐
│      users       │
├──────────────────┤
│ id (PK, UUID)    │
│ name             │
│ email            │
│ role             │
│ email_verified   │
│ created_at       │
└────────┬─────────┘
         │
         │ 1:N (uploaded_by)
         ▼
┌──────────────────┐
│    resources     │
├──────────────────┤
│ id (PK, UUID)    │
│ title            │
│ subject          │
│ description      │
│ file_url         │
│ uploaded_by (FK) │
│ views            │
│ likes            │
│ created_at       │
└──────────────────┘

┌──────────────────┐         ┌──────────────────┐
│      users       │         │  conversations   │
│                  │ 1:N     ├──────────────────┤
│ id (PK)     ─────────────→│ id (PK, UUID)    │
│                  │         │ user_id (FK)     │
└──────────────────┘         │ title            │
                             │ created_at       │
                             └────────┬─────────┘
                                      │
                                      │ 1:N
                                      ▼
                             ┌──────────────────┐
                             │    messages      │
                             ├──────────────────┤
                             │ id (PK, UUID)    │
                             │ conversation_id  │
                             │ sender           │
                             │ message          │
                             │ created_at       │
                             └──────────────────┘
```

---

## 3. Table Definitions

### 3.1 Table: `users`

Stores application-specific user profile data. The `id` column matches the Supabase Auth user UUID.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | — | Matches Supabase Auth UID |
| `name` | TEXT | NOT NULL | — | User's display name |
| `email` | TEXT | NOT NULL, UNIQUE | — | User's email address |
| `role` | TEXT | NOT NULL | `'student'` | User role: `student`, `educator`, `admin` |
| `email_verified` | BOOLEAN | NOT NULL | `false` | Whether email has been verified |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `now()` | Account creation timestamp |

**SQL Definition:**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'student',
    email_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Indexes:**

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Notes:**
- Row created via database trigger on Supabase Auth signup
- `email_verified` updated when user confirms email
- Google OAuth users are created with `email_verified = true`

---

### 3.2 Table: `resources`

Stores metadata for uploaded educational resources.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Unique resource identifier |
| `title` | TEXT | NOT NULL | — | Resource title |
| `subject` | TEXT | NOT NULL | — | Category (one of 9 subjects) |
| `description` | TEXT | NULLABLE | — | Short description (max 500 chars) |
| `file_url` | TEXT | NOT NULL | — | Supabase Storage URL |
| `uploaded_by` | UUID | NOT NULL, FK → users.id | — | Uploader's user ID |
| `views` | INTEGER | NOT NULL | `0` | Total view count |
| `likes` | INTEGER | NOT NULL | `0` | Total like count |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `now()` | Upload timestamp |

**SQL Definition:**

```sql
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    views INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Indexes:**

```sql
CREATE INDEX idx_resources_subject ON resources(subject);
CREATE INDEX idx_resources_uploaded_by ON resources(uploaded_by);
CREATE INDEX idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX idx_resources_views ON resources(views DESC);
CREATE INDEX idx_resources_likes ON resources(likes DESC);
CREATE INDEX idx_resources_title_search ON resources USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

**Valid Subject Values:**

```sql
-- Enforced via CHECK constraint or application-level validation
'Programming'
'Database Management Systems'
'Artificial Intelligence'
'Web Development'
'Data Structures'
'Mathematics'
'Science'
'Interview Preparation'
'Exam Notes'
```

---

### 3.3 Table: `conversations`

Stores AI chat conversation metadata.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Unique conversation identifier |
| `user_id` | UUID | NOT NULL, FK → users.id | — | Conversation owner |
| `title` | TEXT | NOT NULL | `'New Conversation'` | Auto-generated or user-set title |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `now()` | Conversation start timestamp |

**SQL Definition:**

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Indexes:**

```sql
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_title_search ON conversations USING gin(to_tsvector('english', title));
```

---

### 3.4 Table: `messages`

Stores individual messages within AI conversations.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Unique message identifier |
| `conversation_id` | UUID | NOT NULL, FK → conversations.id | — | Parent conversation |
| `sender` | TEXT | NOT NULL | — | `'user'` or `'assistant'` |
| `message` | TEXT | NOT NULL | — | Message content (Markdown for AI) |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | `now()` | Message timestamp |

**SQL Definition:**

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Indexes:**

```sql
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at ASC);
CREATE INDEX idx_messages_content_search ON messages USING gin(to_tsvector('english', message));
```

---

## 4. Relationships Summary

| Relationship | Type | Cascade |
|-------------|------|---------|
| `users` → `resources` | One-to-Many (via `uploaded_by`) | DELETE user → delete their resources |
| `users` → `conversations` | One-to-Many (via `user_id`) | DELETE user → delete their conversations |
| `conversations` → `messages` | One-to-Many (via `conversation_id`) | DELETE conversation → delete all messages |

---

## 5. Row Level Security (RLS) Policies

### 5.1 Users Table

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);
```

### 5.2 Resources Table

```sql
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view resources
CREATE POLICY "Authenticated users can view resources"
    ON resources FOR SELECT
    USING (auth.role() = 'authenticated');

-- Verified users can insert resources
CREATE POLICY "Verified users can upload resources"
    ON resources FOR INSERT
    WITH CHECK (auth.uid() = uploaded_by);

-- Owners can delete their own resources
CREATE POLICY "Owners can delete own resources"
    ON resources FOR DELETE
    USING (auth.uid() = uploaded_by);
```

### 5.3 Conversations Table

```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can only view their own conversations
CREATE POLICY "Users can view own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own conversations
CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
    ON conversations FOR DELETE
    USING (auth.uid() = user_id);
```

### 5.4 Messages Table

```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their own conversations
CREATE POLICY "Users can view own messages"
    ON messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

-- Users can insert messages in their own conversations
CREATE POLICY "Users can insert own messages"
    ON messages FOR INSERT
    WITH CHECK (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );
```

---

## 6. Database Triggers

### 6.1 Auto-Create User Profile on Signup

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, email, email_verified)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        NEW.email,
        NEW.email_confirmed_at IS NOT NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 6.2 Update Email Verified Status

```sql
CREATE OR REPLACE FUNCTION handle_email_verified()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public.users
        SET email_verified = true
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_email_verified
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_email_verified();
```

---

## 7. Supabase Storage

### 7.1 Bucket Configuration

| Property | Value |
|----------|-------|
| **Bucket name** | `resources` |
| **Public** | No |
| **File size limit** | 20 MB |
| **Allowed MIME types** | `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain` |

### 7.2 Storage Path Structure

```text
resources/
 └── {user_id}/
      └── {resource_id}/
           └── {original_filename}.pdf
```

### 7.3 Storage Policies

```sql
-- Authenticated users can read any resource file
CREATE POLICY "Authenticated users can read resources"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'resources' AND auth.role() = 'authenticated');

-- Users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'resources'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'resources'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
```

---

## 8. FAISS Index Storage (Non-SQL)

FAISS vector indexes are **not stored in PostgreSQL**. They are persisted on the backend server's filesystem:

```text
backend/
 └── faiss_indexes/
      ├── global.index          # Combined index (optional)
      ├── global_metadata.json  # Chunk metadata mapping
      └── resources/
           ├── {resource_id_1}.index
           ├── {resource_id_1}_metadata.json
           ├── {resource_id_2}.index
           └── {resource_id_2}_metadata.json
```

| File | Content |
|------|---------|
| `*.index` | FAISS binary index file |
| `*_metadata.json` | Maps FAISS index positions to chunk text and resource info |

---

## 9. Sample Queries

### 9.1 Get Resources with Popularity Sort

```sql
SELECT r.*, u.name AS uploader_name
FROM resources r
JOIN users u ON r.uploaded_by = u.id
ORDER BY (r.views + r.likes) DESC
LIMIT 20 OFFSET 0;
```

### 9.2 Search Resources by Keyword

```sql
SELECT r.*, u.name AS uploader_name
FROM resources r
JOIN users u ON r.uploaded_by = u.id
WHERE r.title ILIKE '%python%'
   OR r.description ILIKE '%python%'
ORDER BY r.created_at DESC;
```

### 9.3 Get User Conversations with Message Count

```sql
SELECT c.*, COUNT(m.id) AS message_count
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.user_id = $1
GROUP BY c.id
ORDER BY c.created_at DESC;
```

### 9.4 Get Full Conversation History

```sql
SELECT id, sender, message, created_at
FROM messages
WHERE conversation_id = $1
ORDER BY created_at ASC;
```

---

*Previous: [08 – System Architecture](./08-system-architecture.md) | Next: [10 – UI/UX Requirements](./10-ui-ux-requirements.md)*
