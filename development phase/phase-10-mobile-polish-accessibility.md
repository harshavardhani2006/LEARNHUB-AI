# Phase 10: Mobile, Polish & Accessibility

| | |
|---|---|
| **Depends on** | Phases 3–9 (feature-complete app) |
| **Blocks** | Phase 11 (production readiness) |
| **PRD modules** | [10](../project%20requirement%20document/10-ui-ux-requirements.md) §13, [13](../project%20requirement%20document/13-development-guidelines.md) |
| **Design** | [§7 Responsive](../design.md), [§6 Motion](../design.md), [§13 Accessibility](../design.md) |

---

## 1. Phase Goal

Refine the product for **mobile/tablet**, add **motion and micro-interactions**, implement **loading/empty/error** states everywhere, and meet baseline **accessibility** (WCAG 2.1 AA target).

---

## 2. Deliverables

- [ ] `BottomNav` on mobile (Home, Resources, Upload, AI Tutor, Profile)
- [ ] Collapsible sidebar / chat drawer on tablet
- [ ] Floating **Ask AI** FAB on mobile resource views
- [ ] Global toast notifications and error boundaries
- [ ] `prefers-reduced-motion` support
- [ ] Keyboard focus rings and ARIA on icon buttons

---

## 3. Frontend Tasks

### 3.1 Mobile Layout

| # | Task | Reference |
|---|------|-----------|
| 1 | `BottomNav` 64px, 5 icons | Module 10 §13, design §7.2 |
| 2 | Hide sidebar on `< 640px`; show bottom nav | design §7.1 |
| 3 | Chat history slide-in drawer | Module 10 §13 |
| 4 | FAB above bottom nav on resource/chat pages | design §7.2 |
| 5 | Swipe-back navigation (optional) | Module 10 §13 |

### 3.2 Polish & Motion

| # | Task | Reference |
|---|------|-----------|
| 1 | Page transition fade/slide | design §6.2 |
| 2 | Resource card stagger on load | design §6.2 |
| 3 | Like heart pop animation | design §6.2 |
| 4 | Upload drop zone pulse | design §6.2 |
| 5 | Stat count-up on landing (if stats live) | design §4.1 |
| 6 | Copy button → checkmark feedback | design §6.3 |

### 3.3 UX Quality

| # | Task | Reference |
|---|------|-----------|
| 1 | Skeleton loaders on all async pages | design §13.2 |
| 2 | Empty states per design §8 | design §8 |
| 3 | Confirm modal before delete resource/conversation | design §13.2 |
| 4 | Debounced search everywhere | design §13.2 |
| 5 | Optimistic like with rollback on error | design §13.2 |
| 6 | React error boundary fallback UI | design §13.2 |
| 7 | Offline/network error toast | design §13.2 |

### 3.4 Accessibility

| # | Task | Reference |
|---|------|-----------|
| 1 | Focus visible on all interactive elements | design §13.1 |
| 2 | `aria-label` on Lucide icon-only buttons | design §13.1 |
| 3 | Live region for streaming chat (optional) | design §13.1 |
| 4 | Color contrast check on primary text/buttons | design §13.1 |
| 5 | Reduce motion media query disables parallax/count-up | design §6.1 |

---

## 4. Backend Tasks

| # | Task |
|---|------|
| 1 | Consistent error JSON shape across all routers |
| 2 | Rate limit sensitive endpoints if time permits |

---

## 5. Acceptance Criteria

- [ ] App usable on 375px width without horizontal scroll on main flows
- [ ] Bottom nav navigates to correct routes
- [ ] All primary flows have loading and empty states
- [ ] No critical accessibility violations on auth, resources, chat
- [ ] Animations respect reduced-motion preference

---

## 6. Testing Checklist

- [ ] Chrome DevTools device mode: iPhone, iPad, desktop
- [ ] Tab through login and chat without mouse
- [ ] Lighthouse accessibility score documented (optional)

---

*Previous: [Phase 9](./phase-09-profile-my-chats-admin.md) | Next: [Phase 11](./phase-11-deployment-and-capstone-qa.md)*
