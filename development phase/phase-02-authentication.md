# Phase 2: Authentication & Access Control

| | |
|---|---|
| **Depends on** | [Phase 1](./phase-01-project-foundation.md) |
| **Blocks** | Phases 3–11 (verified features) |
| **PRD modules** | [02](../project%20requirement%20document/02-authentication-module.md), [11](../project%20requirement%20document/11-api-specification.md) (auth), [09](../project%20requirement%20document/09-database-design.md) |
| **Design** | [design.md §4.2](../design.md), [§3.3 Unverified UX](../design.md) |

---

## 1. Phase Goal

Implement complete authentication: email/password signup and login, mandatory email verification, Google OAuth, password recovery, protected routes, and **hard block** for unverified users on upload, AI Tutor, and chat history.

---

## 2. Deliverables

- [ ] Sign Up, Sign In, Verify Email, Forgot/Reset Password pages
- [ ] Google OAuth with `/auth/callback` handler
- [ ] `useAuth` hook / auth context with session persistence
- [ ] Protected route wrapper + email verification gate
- [ ] Backend auth routes (or Supabase-direct with backend JWT validation for API)
- [ ] Persistent verification banner for unverified users

---

## 3. Frontend Tasks

| # | Task | Design / PRD detail |
|---|------|---------------------|
| 1 | Pages: `/signup`, `/login`, `/verify-email`, `/forgot-password`, `/reset-password` | Module 02 §3–7, design §4.2 |
| 2 | Split layout: brand panel + form (desktop) | design §4.2 |
| 3 | `LoginForm`, `SignupForm`, `GoogleAuthButton` components | design §15 |
| 4 | Password strength indicator on signup | design §4.2 |
| 5 | `useAuth`: session, user profile, `email_verified` from `users` table | Module 02 §8 |
| 6 | `ProtectedRoute` — redirect to `/login` if no session | Module 02 §8.2 |
| 7 | `VerifiedRoute` or gate — block `/upload`, `/ai-tutor`, `/my-chats` | Module 02 §6.2 |
| 8 | `EmailVerificationBanner` on all authenticated pages | design §5.1, Module 02 §6.4 |
| 9 | OAuth callback route `/auth/callback` → dashboard | Module 02 §5 |
| 10 | Disable nav items with lock + tooltip when unverified | design §3.3 |

---

## 4. Backend Tasks

| # | Task | Reference |
|---|------|-----------|
| 1 | Implement or proxy: `POST /auth/signup`, `/login`, `/logout`, `/forgot-password` | Module 11 §2 |
| 2 | `POST /auth/google` or document client-only OAuth flow | Module 02 §5 |
| 3 | JWT middleware: validate Supabase token on protected API routes | Module 08 §6 |
| 4 | Return 403 for verified-only endpoints when `email_verified === false` | Module 02 §6 |
| 5 | Sync `users.email_verified` on verification (trigger from Phase 1) | Module 09 §6.2 |

---

## 5. Supabase Tasks

| # | Task |
|---|------|
| 1 | Complete Google OAuth Client ID/Secret in Supabase |
| 2 | Redirect URLs: localhost + production Vercel URL |
| 3 | Test confirmation email delivery |
| 4 | Test password reset email |

---

## 6. Acceptance Criteria

- [ ] New user signup sends verification email
- [ ] Unverified user **cannot** access upload, AI tutor, or my chats
- [ ] Unverified user **can** browse resources (read-only) per PRD
- [ ] Verified user reaches dashboard after email confirm
- [ ] Google login creates session and lands on dashboard
- [ ] Logout clears session and redirects appropriately
- [ ] Forgot password flow sends email and allows reset
- [ ] API returns 401 without token, 403 when unverified on gated endpoints

---

## 7. Testing Checklist

- [ ] E2E: signup → verify (manual link) → access upload route
- [ ] Attempt upload while unverified → blocked with banner
- [ ] Google OAuth on localhost callback
- [ ] JWT attached on Axios requests after login

---

*Previous: [Phase 1](./phase-01-project-foundation.md) | Next: [Phase 3](./phase-03-app-shell-and-landing.md)*
