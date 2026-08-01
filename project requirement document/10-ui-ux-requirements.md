# Module 10: UI/UX Requirements

> **Design system, page layouts, mobile UI, interaction specifications, and visual design rules**

---

## 1. Design Vision

LearnHub AI must use a **modern AI-first SaaS interface** inspired by **ChatGPT, Notion, Linear, and modern learning platforms**. The UI should feel intelligent, clean, and professional — prioritizing learning flow over decorative elements.

### 1.1 Design Goals

| Goal | Description |
|------|-------------|
| **AI-first UX** | AI Tutor is always one click away; AI actions use distinct purple/cyan accents |
| **Minimal & distraction-free** | Clean layouts with generous whitespace; one primary action per region |
| **Fast resource access** | Search, filter, and browse resources with minimal clicks |
| **Seamless transitions** | Fluid navigation between Resources ↔ AI Tutor ↔ PDF Preview |
| **Responsive** | Fully functional on desktop, tablet, and mobile |
| **Professional SaaS appearance** | Polished cards, shadows, typography, and consistent spacing |
| **Smooth animations** | Hover effects, transitions, streaming chat, loading skeletons |

---

## 2. Design System

### 2.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| **Primary Blue** | `#2563EB` | Primary buttons, links, active navigation, focus rings |
| **AI Purple** | `#7C3AED` | AI Tutor branding, AI action buttons, assistant chat accent |
| **Accent Cyan** | `#06B6D4` | Highlights, badges, gradient accents, hover glows |
| **Background Dark** | `#0B1020` | Hero backgrounds, footer, dark sections |
| **Sidebar** | `#111827` | Sidebar background (dark theme) |
| **Surface Card** | `#F8FAFC` | Card backgrounds, input fields, panels |
| **Border** | `#E5E7EB` | Dividers, card borders, input borders |
| **Text Primary** | `#0F172A` | Headings, primary body text |
| **Text Secondary** | `#475569` | Descriptions, metadata, placeholders |

#### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Success | `#10B981` | Upload success, verified badge |
| Warning | `#F59E0B` | Unverified email banner |
| Error | `#EF4444` | Form errors, failed actions |
| Info | `#3B82F6` | Informational toasts |

#### Gradients

```css
/* Hero background */
--gradient-hero: linear-gradient(135deg, #0B1020 0%, #1E1B4B 40%, #2563EB 100%);

/* AI button gradient */
--gradient-ai: linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%);
```

### 2.2 Typography

| Element | Font | Weight | Size (Desktop) |
|---------|------|--------|----------------|
| H1 (Hero) | Poppins | 700 | 48px |
| H2 (Section) | Poppins | 600 | 32px |
| H3 (Card title) | Poppins | 600 | 20px |
| Body | Inter | 400 | 16px |
| Body Small | Inter | 400 | 14px |
| Label / Caption | Inter | 500 | 12px |
| Code / Diagrams | JetBrains Mono | 400 | 14px |

**Font loading:** Google Fonts — Poppins, Inter, JetBrains Mono.

### 2.3 Spacing & Layout Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Page padding | 24px | Horizontal and vertical page margins |
| Section gap | 48px | Between major page sections |
| Card padding | 20px | Internal card padding |
| Card border radius | 16px | Cards, modals, panels |
| Button border radius | 12px | Buttons, inputs, badges |
| Sidebar width | 260px | Desktop sidebar navigation |
| Top nav height | 64px | Sticky top navigation bar |
| Chat input height | 56px | Sticky chat input bar |
| Bottom nav height | 64px | Mobile bottom navigation |

### 2.4 Shadows

```css
--shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
--shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08);
--shadow-lg: 0 8px 24px rgba(15, 23, 42, 0.12);
--shadow-glow-ai: 0 0 24px rgba(124, 58, 237, 0.25);
```

### 2.5 Global UI Rules

- 24px page padding on all pages
- 16px card border radius
- 12px button border radius
- Soft shadows on elevated elements
- Sticky top navigation on all authenticated pages
- Sticky chat input at bottom of AI Tutor page
- Responsive layouts for all screen sizes
- Lucide React icons throughout (16px inline, 20px buttons, 24px nav)

---

## 3. Complete UI Structure

### 3.1 Home Page (Landing)

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              ✨ LearnHub AI                                 │
│                                                             │
│      Your collaborative AI-powered learning workspace        │
│                                                             │
│  Upload study materials • Learn with AI • Revise smarter   │
│                                                             │
│   [📚 Explore Resources]   [🤖 Open AI Tutor]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Home Page Sections

| Section | Description |
|---------|-------------|
| **Hero** | Animated gradient background, headline, tagline, two CTA buttons |
| **Popular resources carousel** | Horizontal scroll of top resource cards |
| **Continue learning** | Last viewed resources and AI conversations (authenticated) |
| **AI study tools** | Four feature cards: Summarize, Questions, Revision, Diagrams |
| **Platform statistics** | Animated count-up: resources, learners, AI questions, subjects |
| **Footer** | Quick links, social icons, "Built with RAG + LLM" badge |

---

### 3.2 Dashboard Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Top Navigation (64px, sticky)                               │
├───────────────┬─────────────────────────────────────────────┤
│ 🏠 Home        │                                             │
│ 📚 Resources   │                                             │
│ ⬆️ Upload      │            Main Workspace                   │
│ 🤖 AI Tutor    │            (scrollable content)             │
│ 🕘 My Chats    │                                             │
│ 👤 Profile     │                                             │
└──────────────┴─────────────────────────────────────────────┘
     260px
```

| Element | Specification |
|---------|--------------|
| **Sidebar** | Fixed 260px width, dark background `#111827`, icon + label nav items |
| **Active nav item** | Left border accent (4px `#2563EB`) + background highlight |
| **Top nav** | Logo, global search, notification bell, avatar dropdown |
| **Main workspace** | Scrollable content area with 24px padding |

---

### 3.3 Resource Cards

```text
┌──────────────────────────────┐
│  [PDF Icon]  [ Programming ] │
│                              │
│  Python Basics               │
│  by Harsha • 2 days ago      │
│                              │
│  Beginner-friendly notes     │
│                              │
│  👁 120   ❤ 24   💬 18      │
│                              │
│  [ Read ]    [ Ask AI ✨ ]   │
└──────────────────────────────┘
```

#### Card Elements

| Element | Detail |
|---------|--------|
| Subject badge | Colored pill (category-specific color) |
| PDF thumbnail/icon | Document preview or placeholder |
| Title | Poppins 600, max 2 lines |
| Contributor | Avatar initial + name + relative time |
| Description | Truncated to 2 lines |
| Stats | Views, likes, AI question count with icons |
| Read button | Outline primary style |
| Ask AI button | Gradient AI button with sparkle icon |

#### Card Interactions

- Hover: `translateY(-4px)`, increased shadow, subtle top glow
- Like: heart scale animation + fill red
- Click card body: navigate to resource detail page

---

### 3.4 Upload Page

```text
┌─────────────────────────────────────────────────────────────┐
│               ⬆️ Upload Study Material                      │
│                                                             │
│     ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐     │
│     │        📄 Drag & Drop PDF Here                  │     │
│     │              [ Choose File ]                  │     │
│     └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘     │
│                                                             │
│  Title         [____________________________________]       │
│  Subject       [ Programming                          ▼ ]   │
│  Description   [____________________________________]       │
│                                                             │
│                [ Upload & Analyze ✨ ]                      │
└─────────────────────────────────────────────────────────────┘
```

#### Drag & Drop Zone States

| State | Visual |
|-------|--------|
| Default | Dashed border, light background |
| Drag over | Blue border, blue tint, scale up slightly |
| File selected | Solid border, filename + size + remove button |
| Uploading | Progress bar with percentage |
| Error | Red border + error message |

#### Post-Upload Feedback

```text
✅ Document uploaded successfully
📑 Summary generated
📌 Important questions created
⚡ Revision notes ready
🧭 Learning diagrams available

[ View Resource ]    [ Ask AI About This ]
```

---

### 3.5 AI Tutor Page

```text
┌─────────────────────────────────────────────────────────────┐
│ Previous Chats │            LearnHub AI Tutor ✨             │
├────────────────┼─────────────────────────────────────────────┤
│ 📘 Python      │ User: Explain Python lists                 │
│ 📗 DBMS        │                                             │
│ 📕 AI Notes    │ AI: A list is an ordered, mutable          │
│                │ collection used to store multiple values.   │
│ ➕ New Chat    │                                             │
│                │ 💡 Related Questions                        │
│                │ • Difference between list and tuple         │
│                │ • List comprehensions                       │
│                │ • Nested lists                              │
│                │                                             │
│                │ [Type your question.....................] ➤ │
└────────────────┴─────────────────────────────────────────────┘
```

#### Chat Features

| Feature | Description |
|---------|-------------|
| Markdown rendering | Headers, lists, bold, italic, blockquotes |
| Code syntax highlighting | Python, JS, SQL in code blocks |
| Educational diagrams | Mermaid.js rendered flowcharts |
| Suggested follow-up questions | Clickable pill chips below AI response |
| Copy response button | One-click copy on hover |
| Download conversation | Export as Markdown/text |
| Typing animation | Three-dot indicator while generating |
| Streaming effect | Token-by-token reveal with blinking cursor |

#### Message Bubble Styles

| Sender | Style |
|--------|-------|
| User | Right-aligned, `#2563EB` background, white text |
| Assistant | Left-aligned, `#F8FAFC` background, purple left border, AI avatar |

---

### 3.6 Resource Preview + AI Workspace

```text
┌───────────────────────────────┬──────────────────────────────┐
│         PDF VIEWER            │        AI Study Tools        │
│         (60% width)           │                              │
│                               │  📑 Summarize               │
│   Page content with           │  📌 Important Questions      │
│   navigation controls         │  ⚡ Revision Notes           │
│                               │  🧭 Explain with Diagram     │
│   [ ◀ ] Page 1/24 [ ▶ ]      │  🤖 Ask Doubts               │
│   [ − ] 100% [ + ]           │                              │
│                               │  ┌────────────────────────┐  │
│                               │  │  AI Output Panel       │  │
│                               │  └────────────────────────┘  │
└───────────────────────────────┴──────────────────────────────┘
```

This creates a **side-by-side learning workspace** where the PDF and AI tools are available simultaneously.

| Panel | Width | Features |
|-------|-------|----------|
| PDF Viewer (left) | 60% | Page nav, zoom, download, fullscreen |
| AI Tools (right) | 40% | Tool buttons + output panel |
| Divider | Draggable | Resize panels (40%–70% range) |

---

## 4. Mobile UI Design

### 4.1 Bottom Navigation

```text
┌─────────────────────────┐
│     Main Content        │
│     (full width)        │
│                    [🤖] │  ← FAB: Ask AI
├─────────────────────────┤
│ 🏠  📚  ➕  🤖  👤     │
└─────────────────────────┘
```

| Icon | Route | Label |
|------|-------|-------|
| 🏠 | `/dashboard` | Home |
| 📚 | `/resources` | Resources |
| ➕ | `/upload` | Upload |
| 🤖 | `/ai-tutor` | AI Tutor |
| 👤 | `/profile` | Profile |

### 4.2 Mobile-Specific Features

| Feature | Implementation |
|---------|---------------|
| **Bottom navigation bar** | Fixed 64px height, 5 icons |
| **Full-width resource cards** | Single column stacked layout |
| **Collapsible chat history** | Slide-in drawer from left |
| **Floating Ask AI button** | FAB bottom-right above nav, pulse glow |
| **Swipe gestures** | Swipe right to go back; swipe left on chat to delete |
| **PDF + AI workspace** | Tabbed view: "Document" tab / "AI Tools" tab |
| **Sidebar** | Hidden; replaced by bottom nav and hamburger menu |

### 4.3 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, bottom nav |
| Tablet | 640px – 1023px | 2-column grid, collapsible sidebar |
| Desktop | ≥ 1024px | Full sidebar + multi-column |
| Wide | ≥ 1280px | Max content width 1280px centered |

---

## 5. Authentication Pages UI

| Page | Layout | Key Elements |
|------|--------|-------------|
| **Sign Up** | Split: gradient panel + form | Name, email, password, Google button |
| **Sign In** | Split: gradient panel + form | Email, password, remember me, forgot link, Google button |
| **Verify Email** | Centered card | Envelope icon, instructions, resend button |
| **Forgot Password** | Centered card | Email input, submit button |

---

## 6. Interaction & Animation Requirements

| Interaction | Animation |
|-------------|-----------|
| Page transition | Fade + slide up (250ms) |
| Card hover | translateY(-4px) + shadow increase |
| Button hover | translateY(-1px) + glow shadow |
| Like button | Heart scale pop + red fill |
| Toast notification | Slide in from top-right |
| Modal open | Backdrop fade + content scale 0.95 → 1 |
| Chat message appear | Fade in + slide up 8px |
| AI streaming | Blinking cursor + token reveal |
| Upload drop zone | Border pulse on drag-over |
| Skeleton loading | Shimmer gradient sweep |
| Sidebar collapse | Width 260px → 72px (icons only) |

**Accessibility:** Respect `prefers-reduced-motion` — disable parallax, particles, and count-up animations.

---

## 7. UI Component Requirements

The following reusable components must be created:

| Component | Used In |
|-----------|---------|
| `Sidebar` | Dashboard layout |
| `TopNav` / `Navbar` | All authenticated pages |
| `BottomNav` | Mobile layout |
| `ResourceCard` | Resources page, dashboard, home carousel |
| `ChatMessage` | AI Tutor page |
| `ChatInput` | AI Tutor page |
| `UploadZone` | Upload page |
| `PDFViewer` | Resource detail page |
| `Button` | All pages (primary, secondary, AI, ghost variants) |
| `Badge` | Subject categories, status indicators |
| `SearchBar` | Resources page, top nav, chat history |
| `Modal` | Confirmations, dialogs |
| `Toast` | Success/error notifications |
| `Skeleton` | Loading states |
| `EmptyState` | No resources, no chats |

---

## 8. Empty & Loading States

| Page | Empty State | Loading State |
|------|-------------|---------------|
| Resources | "No resources found. Be the first to upload!" + CTA | 6 skeleton cards with shimmer |
| AI Tutor | AI avatar + starter prompt chips | Typing indicator dots |
| My Chats | "Start a conversation with AI Tutor" + CTA | Skeleton list items |
| Upload | Default drop zone | Multi-step progress indicator |
| Profile | "No uploads yet" | Skeleton profile card |

---

*Previous: [09 – Database Design](./09-database-design.md) | Next: [11 – API Specification](./11-api-specification.md)*
