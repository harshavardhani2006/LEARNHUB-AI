# Phase 4: Resource Library (Browse)

| | |
|---|---|
| **Depends on** | [Phase 3](./phase-03-app-shell-and-landing.md) |
| **Blocks** | Phase 5, 8 |
| **PRD modules** | [03](../project%20requirement%20document/03-resource-sharing-module.md), [11](../project%20requirement%20document/11-api-specification.md) (GET resources) |
| **Design** | [§4.4 Resources](../design.md), [§5 ResourceCard](../design.md) |

---

## 1. Phase Goal

Deliver the **Resource Library** page: grid of shared materials with search, subject filter, sort, engagement stats, and navigation to detail (detail fully built in Phase 8).

---

## 2. Deliverables

- [ ] `/resources` page with header, search, filters, sort
- [ ] `ResourceCard`, `ResourceGrid`, `SubjectFilter`, `SearchBar`
- [ ] `GET /resources` with query params: search, subject, sort, page, limit
- [ ] View count increment on open detail (stub detail OK)
- [ ] Skeleton loading and empty states

---

## 3. Frontend Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | Resources page layout and title | Module 10 §12.3, design §4.4 |
| 2 | `SearchBar` with 300ms debounce | Module 03 §5.3, design §4.4 |
| 3 | `SubjectFilter` — 9 categories + All | Module 03 §4 |
| 4 | Sort dropdown: popularity, newest, views, likes | Module 03 §5.5 |
| 5 | `ResourceCard`: badge, title, uploader, description, stats | design §4.4.1 badges |
| 6 | Read → `/resources/:id` (minimal detail or placeholder) | Module 03 §7 |
| 7 | Ask AI → `/ai-tutor` with resource context query param | Module 03 §6.1 |
| 8 | Like button UI (API can stub until backend ready) | Module 03 §5.7 |
| 9 | Card hover animation (lift + shadow) | design §6.2 |
| 10 | Grid responsive: 3 / 2 / 1 columns | design §7 |
| 11 | Skeleton cards while loading | design §8 |

---

## 4. Backend Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | `GET /resources` — list with pagination | Module 11 |
| 2 | Query: `search`, `subject`, `sort`, `page`, `limit` | Module 03 §9.1 |
| 3 | Join uploader name from `users` | Module 09 §9.1 |
| 4 | `GET /resources/{id}` — single resource metadata | Module 11 |
| 5 | Increment `views` on GET detail (or dedicated POST view) | Module 03 §5.8 |
| 6 | Auth required for list/detail per Module 11 | Module 11 summary |

---

## 5. Database / Seed Data

| # | Task |
|---|------|
| 1 | Seed 3–5 sample resources for UI testing (optional SQL or script) |
| 2 | Verify subject enum values match Module 03 §4 |

---

## 6. Acceptance Criteria

- [ ] Resources grid loads from API
- [ ] Search filters results by title/description
- [ ] Subject pills filter correctly
- [ ] Sort changes order (popularity default)
- [ ] Empty search shows empty state + upload CTA
- [ ] Unverified users can browse (read-only)
- [ ] ResourceCard displays views, likes, AI count (AI count 0 OK initially)

---

## 7. Testing Checklist

- [ ] Pagination or infinite scroll with 20+ items
- [ ] Mobile: full-width cards
- [ ] Open resource detail increments view count

---

*Previous: [Phase 3](./phase-03-app-shell-and-landing.md) | Next: [Phase 5](./phase-05-upload-and-rag-ingestion.md)*
