# Module 02: Authentication Module

> **Secure user authentication with email verification, Google OAuth, and protected routes**

---

## 1. Module Overview

The Authentication Module is responsible for user registration, login, session management, and access control across the LearnHub AI platform. It uses **Supabase Auth** as the authentication provider and enforces **mandatory email confirmation** before granting access to core platform features.

### 1.1 Module Goals

- Provide secure, friction-minimized sign-up and sign-in experiences
- Enforce email verification before access to upload, AI, and chat features
- Support Google OAuth as an alternative login method
- Manage user sessions securely across the application
- Protect routes so unauthenticated users cannot access private features

### 1.2 Technology

| Component | Technology |
|-----------|------------|
| Auth Provider | Supabase Auth |
| OAuth Provider | Google |
| Session Storage | Supabase JWT tokens |
| Frontend Integration | Supabase JS client + React Router protected routes |
| Backend Validation | FastAPI middleware verifying Supabase JWT |

---

## 2. Required Features

### 2.1 Feature List

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | Email & Password Sign Up | Register with name, email, and password | High |
| 2 | Email & Password Sign In | Login with registered credentials | High |
| 3 | Forgot Password | Request password reset via email | High |
| 4 | Reset Password | Set new password via reset link | High |
| 5 | Google Authentication (OAuth) | One-click sign in with Google account | High |
| 6 | Mandatory Email Confirmation | Block unverified users from core features | High |
| 7 | Secure Session Management | JWT-based sessions with auto-refresh | High |
| 8 | Protected Routes | Redirect unauthenticated users to login | High |
| 9 | Logout | End session and clear tokens | High |
| 10 | Resend Verification Email | Allow users to resend confirmation email | Medium |

---

## 3. Registration Flow (Email & Password)

### 3.1 Step-by-Step Flow

```text
User navigates to Sign Up page
        ↓
User enters Name, Email, Password
        ↓
Frontend validates input (format, password strength)
        ↓
POST /auth/signup → Supabase creates account
        ↓
Supabase sends verification email to user
        ↓
User redirected to "Verify Your Email" page
        ↓
User clicks verification link in email
        ↓
Supabase marks email as verified
        ↓
User redirected to LearnHub AI Dashboard
        ↓
Full platform access granted
```

### 3.2 Sign Up Form Fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| **Name** | Text | Min 2 characters, max 100 | Yes |
| **Email** | Email | Valid email format, unique | Yes |
| **Password** | Password | Min 8 characters, strength indicator | Yes |
| **Confirm Password** | Password | Must match password | Yes |

### 3.3 Post-Registration Behavior

- User account is created in Supabase Auth
- A corresponding row is inserted into the `users` table with `email_verified = false`
- Verification email is sent automatically by Supabase
- User is redirected to `/verify-email` page with instructions
- User **cannot** access Upload, AI Tutor, or My Chats until verified

---

## 4. Sign In Flow (Email & Password)

### 4.1 Step-by-Step Flow

```text
User navigates to Sign In page
        ↓
User enters Email and Password
        ↓
POST /auth/login → Supabase validates credentials
        ↓
If valid → JWT session token issued
        ↓
If email verified → Redirect to Dashboard
If email NOT verified → Redirect to Verify Email page with banner
        ↓
Session stored; protected routes accessible (based on verification status)
```

### 4.2 Sign In Form Fields

| Field | Type | Required |
|-------|------|----------|
| **Email** | Email | Yes |
| **Password** | Password | Yes |
| **Remember Me** | Checkbox | No |

### 4.3 Error Handling

| Error | User Message |
|-------|--------------|
| Invalid credentials | "Invalid email or password. Please try again." |
| Email not verified | "Please verify your email before signing in." + link to resend |
| Account not found | "No account found with this email. Sign up instead." |
| Network error | "Connection error. Please check your internet and try again." |

---

## 5. Google OAuth Flow

### 5.1 Step-by-Step Flow

```text
User clicks "Continue with Google" button
        ↓
Redirect to Google OAuth consent screen
        ↓
User grants permission to LearnHub AI
        ↓
Google returns authorization code
        ↓
Supabase exchanges code for user session
        ↓
Supabase creates/updates user account
        ↓
Redirect to /auth/callback on frontend
        ↓
Frontend captures session and redirects to Dashboard
        ↓
Full access granted (Google accounts are pre-verified)
```

### 5.2 Google OAuth Configuration

**Supabase Settings:**

```text
Enable Google OAuth: ON
```

**Redirect URLs:**

```text
http://localhost:5173/auth/callback       (development)
https://your-app.vercel.app/auth/callback  (production)
```

### 5.3 Google Sign-In Behavior

- Google-authenticated users are automatically marked as **email verified**
- If user already exists with same email (registered via password), accounts are linked
- User name and email are pulled from Google profile
- No separate password is required for Google users

---

## 6. Email Verification

### 6.1 Mandatory Verification Rule

> **Critical Rule:** Unverified users **cannot upload resources, access the AI assistant, or use chat history features.**

### 6.2 Restricted Features for Unverified Users

| Feature | Unverified | Verified |
|---------|------------|----------|
| Browse resources (read-only) | ✅ Allowed | ✅ Allowed |
| View profile | ✅ Allowed | ✅ Allowed |
| Upload resources | ❌ Blocked | ✅ Allowed |
| AI Tutor | ❌ Blocked | ✅ Allowed |
| My Chats / Chat history | ❌ Blocked | ✅ Allowed |
| Like resources | ❌ Blocked | ✅ Allowed |
| Ask AI on resources | ❌ Blocked | ✅ Allowed |

### 6.3 Verification Page (`/verify-email`)

**Content displayed:**

- Illustration / icon (envelope)
- Heading: "Verify Your Email"
- Message: "We've sent a verification link to **{user_email}**. Please check your inbox and click the link to activate your account."
- **Resend Verification Email** button (60-second cooldown)
- Link to change email or contact support

### 6.4 Verification Banner

For logged-in but unverified users, display a persistent banner on all pages:

> ⚠️ **Verify your email to unlock upload, AI Tutor, and chat features.** [Resend Email]

---

## 7. Password Recovery

### 7.1 Forgot Password Flow

```text
User clicks "Forgot Password?" on Sign In page
        ↓
User enters email address
        ↓
POST /auth/forgot-password
        ↓
Supabase sends password reset email
        ↓
User clicks reset link in email
        ↓
User redirected to /reset-password page
        ↓
User enters new password + confirmation
        ↓
Password updated → Redirect to Sign In
```

### 7.2 Reset Password Form Fields

| Field | Validation |
|-------|------------|
| **New Password** | Min 8 characters |
| **Confirm Password** | Must match new password |

---

## 8. Session Management

### 8.1 Session Strategy

| Aspect | Implementation |
|--------|----------------|
| Token type | JWT (issued by Supabase Auth) |
| Storage | Browser local storage / Supabase client session |
| Refresh | Automatic token refresh via Supabase client |
| Expiry | Default Supabase session expiry with refresh |
| Logout | Clear session, revoke token, redirect to home |

### 8.2 Protected Routes

Routes that require authentication:

| Route | Auth Required | Email Verified Required |
|-------|---------------|------------------------|
| `/dashboard` | Yes | No (limited view if unverified) |
| `/resources` | Yes | No (read-only if unverified) |
| `/upload` | Yes | Yes |
| `/ai-tutor` | Yes | Yes |
| `/my-chats` | Yes | Yes |
| `/profile` | Yes | No |

**Implementation:**

- React Router route guards check auth state on navigation
- Unauthenticated users → redirect to `/login`
- Authenticated but unverified → show banner, block restricted features
- Backend API endpoints validate JWT on every request

---

## 9. API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Register new user | No |
| POST | `/auth/login` | Sign in with email/password | No |
| POST | `/auth/logout` | End current session | Yes |
| POST | `/auth/google` | Initiate Google OAuth flow | No |
| POST | `/auth/forgot-password` | Send password reset email | No |

See [Module 11 – API Specification](./11-api-specification.md) for detailed request/response formats.

---

## 10. Database Integration

On successful registration, a row is created in the `users` table:

| Column | Value on Sign Up |
|--------|------------------|
| `id` | Supabase Auth UID |
| `name` | From registration form |
| `email` | From registration form |
| `role` | Default: `student` |
| `email_verified` | `false` (updated to `true` on verification) |
| `created_at` | Current timestamp |

See [Module 09 – Database Design](./09-database-design.md) for full schema.

---

## 11. Supabase Auth Configuration

```text
Enable Email Confirmation:  ON
Enable Password Recovery:   ON
Enable Google OAuth:          ON
```

---

## 12. Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Password hashing | Handled by Supabase Auth (bcrypt) |
| HTTPS only | Enforced in production (Vercel + Render) |
| CSRF protection | Supabase OAuth state parameter |
| Rate limiting | Supabase built-in rate limits on auth endpoints |
| Input sanitization | Frontend validation + backend validation |
| JWT verification | Backend middleware validates token on protected routes |

---

## 13. UI Pages (Authentication)

| Page | Route | Description |
|------|-------|-------------|
| Sign Up | `/signup` | Registration form + Google button |
| Sign In | `/login` | Login form + Google button + forgot password link |
| Verify Email | `/verify-email` | Verification instructions + resend button |
| Forgot Password | `/forgot-password` | Email input for reset link |
| Reset Password | `/reset-password` | New password form |
| OAuth Callback | `/auth/callback` | Handles Google OAuth redirect |

See [Module 10 – UI/UX Requirements](./10-ui-ux-requirements.md) for visual design specs.

---

*Previous: [01 – Project Overview](./01-project-overview.md) | Next: [03 – Resource Sharing Module](./03-resource-sharing-module.md)*
