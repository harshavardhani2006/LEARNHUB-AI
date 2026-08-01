# Phase 9: Profile, My Chats & Admin

| | |
|---|---|
| **Depends on** | [Phase 6](./phase-06-ai-tutor-and-chat-history.md), [Phase 4](./phase-04-resource-library.md) |
| **Blocks** | Phase 10–11 |
| **PRD modules** | [01](../project%20requirement%20document/01-project-overview.md) §5.3, [03](../project%20requirement%20document/03-resource-sharing-module.md) §8, [05](../project%20requirement%20document/05-chat-history-module.md), [02](../project%20requirement%20document/02-authentication-module.md) roles |
| **Design** | [§4.8 My Chats](../design.md), [§4.9 Profile](../design.md) |

---

## 1. Phase Goal

Complete **Profile** (stats, my uploads, settings), dedicated **My Chats** management page, and **admin/moderation** basics (delete any resource, optional FAQ upload).

---

## 2. Deliverables

- [ ] `/profile` — avatar, verified badge, stats, user's uploads grid
- [ ] `/my-chats` — searchable list, sort, delete, open in AI Tutor
- [ ] Admin role check: delete resources not owned by user
- [ ] Edit profile name; change password via Supabase
- [ ] Dashboard "Continue Learning" wired to real data

---

## 3. Frontend Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | Profile page layout and stats row | design §4.9 |
| 2 | Filter resources grid by `uploaded_by = current user` | Module 03 |
| 3 | My Chats full-page list with search and sort | Module 05 §4.2, design §4.8 |
| 4 | Bulk/single delete conversation with confirm modal | Module 05 §8.1 |
| 5 | Rename conversation (optional) | Module 05 §8.2 |
| 6 | Dashboard recent resources + last conversation | design §4.3 |
| 7 | Admin-only delete button on ResourceCard (role from `users.role`) | Module 01 §5.4 |
| 8 | Landing carousel popular resources from API sort=popularity | design §4.1 |

---

## 4. Backend Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | `DELETE /resources/{id}` — owner OR admin | Module 03 §8, Module 11 |
| 2 | `DELETE /conversations/{id}` — owner only | Module 05 §10 |
| 3 | `PATCH /conversations/{id}` — update title | Module 05 |
| 4 | `GET /resources?uploaded_by={user_id}` filter | Module 03 |
| 5 | User stats aggregation endpoint (optional) | design §4.9 |
| 6 | Admin FAQ ingest script or protected route | Module 06 §6 |

---

## 5. Acceptance Criteria

- [ ] Profile shows correct upload count and user info
- [ ] My Chats search finds conversations by title/content
- [ ] Delete conversation removes from DB and UI
- [ ] Admin can delete another user's resource
- [ ] Non-admin cannot delete others' resources (403)
- [ ] Dashboard continue sections link to real resource/chat

---

## 6. Testing Checklist

- [ ] Two users: user A cannot delete user B's conversation
- [ ] Admin role in DB enables moderation actions

---

*Previous: [Phase 8](./phase-08-resource-preview-ai-workspace.md) | Next: [Phase 10](./phase-10-mobile-polish-accessibility.md)*
