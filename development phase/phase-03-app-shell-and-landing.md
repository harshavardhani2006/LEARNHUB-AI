# Phase 3: Design System, App Shell & Landing

| | |
|---|---|
| **Depends on** | [Phase 2](./phase-02-authentication.md) |
| **Blocks** | Phases 4–10 (authenticated UI) |
| **PRD modules** | [10](../project%20requirement%20document/10-ui-ux-requirements.md), [01](../project%20requirement%20document/01-project-overview.md), [13](../project%20requirement%20document/13-development-guidelines.md) |
| **Design** | [§2 Design System](../design.md), [§3 Layout](../design.md), [§4.1 Landing](../design.md), [§4.3 Dashboard](../design.md), [§5 UI components](../design.md) |

---

## 1. Phase Goal

Implement the global design system (Tailwind tokens), application shell (Sidebar, TopNav, DashboardLayout), public landing page, and authenticated dashboard home — matching the AI-first SaaS look from design.md.

---

## 2. Deliverables

- [ ] CSS variables / Tailwind theme aligned with design tokens
- [ ] Reusable UI primitives: `Button`, `Badge`, `Modal`, `Toast`, `Skeleton`, `EmptyState`
- [ ] `Sidebar` (260px), `TopNav`, `DashboardLayout`, route outlet
- [ ] Public `/` landing with hero, sections (placeholders OK for dynamic data)
- [ ] `/dashboard` personalized home with quick actions
- [ ] Route map wired for all main nav targets (pages may be stubs)

---

## 3. Frontend Tasks

### 3.1 Design System

| # | Task | Reference |
|---|------|-----------|
| 1 | Colors: primary, ai-purple, accent-cyan, surfaces, semantic | design §2.1 |
| 2 | Typography: Poppins headings, Inter body, JetBrains code | design §2.2 |
| 3 | Spacing: 24px page padding, 16px card radius, 12px button radius | design §2.3, Module 10 §2.3 |
| 4 | Shadows and gradient utilities for hero/AI buttons | design §2.4–2.5 |
| 5 | `Button` variants: primary, secondary, ai (gradient), ghost, danger | design §5.2 |

### 3.2 Layout Shell

| # | Task | Reference |
|---|------|-----------|
| 1 | `DashboardLayout`: sidebar + main + top nav | design §3.1 |
| 2 | Sidebar nav: Home, Resources, Upload, AI Tutor, My Chats, Profile | Module 10 §3.2, design §3.1 |
| 3 | Active route: left border accent + highlight | design §3.1 |
| 4 | TopNav: logo, search placeholder, avatar dropdown (profile, logout) | design §3.1 |
| 5 | Register all routes in React Router with layout wrapper | design §3.2 |

### 3.3 Landing Page (`/`)

| # | Task | Reference |
|---|------|-----------|
| 1 | Hero: title, tagline, animated gradient background | design §4.1 |
| 2 | CTAs: Explore Resources, Open AI Tutor (auth-aware links) | Module 10 §12.1 |
| 3 | Sections: popular resources (stub), AI tools grid, stats (stub), footer | design §4.1 |
| 4 | Hover/motion on CTAs per design §6 | design §6 |

### 3.4 Dashboard (`/dashboard`)

| # | Task | Reference |
|---|------|-----------|
| 1 | Time-based greeting + quick action cards | design §4.3 |
| 2 | Placeholders: Recent Resources, Continue Learning | design §4.3 |
| 3 | AI Quick Actions row (links to future phases) | design §4.3 |

---

## 4. Backend Tasks

| # | Task |
|---|------|
| 1 | Optional: `GET /stats` stub for platform statistics (Phase 4+ can implement) |
| 2 | Ensure CORS allows frontend origin |

*No major backend feature work in this phase.*

---

## 5. Acceptance Criteria

- [ ] Authenticated user sees shell on `/dashboard` and navigates between stub routes
- [ ] Unauthenticated user sees landing; CTAs lead to login/signup
- [ ] Sidebar width 260px; sticky top nav 64px height
- [ ] Design colors and fonts match design.md tokens
- [ ] Toast/Modal/Skeleton components usable from any page
- [ ] Verification banner still visible when applicable (Phase 2)

---

## 6. Testing Checklist

- [ ] Resize window: layout remains usable at tablet width
- [ ] Logout from avatar dropdown works
- [ ] All sidebar links resolve (no 404 except intentional stubs)

---

*Previous: [Phase 2](./phase-02-authentication.md) | Next: [Phase 4](./phase-04-resource-library.md)*
