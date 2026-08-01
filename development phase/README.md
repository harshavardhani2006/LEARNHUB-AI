# LearnHub AI – Development Phases

> **Execution roadmap** derived from [project requirement document](../project%20requirement%20document/) modules and [design.md](../design.md).

---

## Purpose

This folder breaks the full LearnHub AI build into **sequential development phases**. Each phase file lists goals, tasks (frontend/backend/infra), acceptance criteria, and links to the source PRD modules and design sections.

**Rule:** Complete phases in order unless noted; later phases depend on earlier deliverables.

---

## Phase Index

| Phase | Title | Primary PRD Modules | Design.md Sections |
|-------|--------|---------------------|-------------------|
| [Phase 1](./phase-01-project-foundation.md) | Project Foundation & Environment | 07, 08, 09, 12, 13 | §15 File structure, Appendix A Tailwind |
| [Phase 2](./phase-02-authentication.md) | Authentication & Access Control | 02, 11 (auth), 09 | §4.2 Auth pages, §3.3 Unverified UX |
| [Phase 3](./phase-03-app-shell-and-landing.md) | Design System, App Shell & Landing | 10, 01, 13 | §2 Design System, §3 Layout, §4.1 Landing, §4.3 Dashboard |
| [Phase 4](./phase-04-resource-library.md) | Resource Library (Browse) | 03, 11 (GET resources) | §4.4 Resources, §5 ResourceCard |
| [Phase 5](./phase-05-upload-and-rag-ingestion.md) | Upload & RAG Document Ingestion | 03, 04, 08, 11 (POST resources) | §4.5 Upload, §6 Motion (upload states) |
| [Phase 6](./phase-06-ai-tutor-and-chat-history.md) | AI Tutor & Chat History | 04, 05, 11 (chat) | §4.6 AI Tutor, §5 Chat components, §6 Streaming |
| [Phase 7](./phase-07-ai-study-tools.md) | AI Study Tools | 06, 11 (AI tools) | §4.7 AI tools panel, §5 AIToolCard |
| [Phase 8](./phase-08-resource-preview-ai-workspace.md) | Resource Preview + AI Workspace | 03, 06, 10 | §4.7 Split workspace, §5 PDFViewer |
| [Phase 9](./phase-09-profile-my-chats-admin.md) | Profile, My Chats & Admin | 01, 02, 03, 05 | §4.8 My Chats, §4.9 Profile |
| [Phase 10](./phase-10-mobile-polish-accessibility.md) | Mobile, Polish & Accessibility | 10, 13 | §7 Responsive, §6 Motion, §13 a11y |
| [Phase 11](./phase-11-deployment-and-capstone-qa.md) | Deployment & Capstone QA | 12, 14, 11 | §12 Environment (design), §14 Priority validation |

---

## Dependency Graph

```text
Phase 1 (Foundation)
    ↓
Phase 2 (Auth)
    ↓
Phase 3 (Shell + Landing)
    ↓
Phase 4 (Resource Library) ──→ Phase 5 (Upload + RAG Ingest)
    ↓                              ↓
    └──────────────┬───────────────┘
                   ↓
         Phase 6 (AI Tutor + History)
                   ↓
         Phase 7 (AI Study Tools)
                   ↓
         Phase 8 (Preview + Workspace)
                   ↓
         Phase 9 (Profile / My Chats / Admin)
                   ↓
         Phase 10 (Mobile + Polish)
                   ↓
         Phase 11 (Deploy + QA)
```

---

## Alignment with design.md Implementation Priority

| design.md Phase | Maps to Development Phase |
|-----------------|---------------------------|
| 1 Auth | Phase 2 |
| 2 Dashboard + Shell | Phase 3 |
| 3 Resources | Phase 4 |
| 4 Upload | Phase 5 |
| 5 AI Tutor | Phase 6 (+ Phase 5 backend for indexed docs) |
| 6 Resource Preview + AI | Phase 8 (+ Phase 7 tools) |
| 7 Profile, My Chats | Phase 9 |
| 8 Polish | Phase 10 |
| — | Phase 1 (foundation), Phase 11 (deploy) |

---

## How to Use

1. Open **[prompt.md](./prompt.md)** — copy the agent prompt for your current phase (includes global rules and post-phase report template).
2. Open the current phase markdown file.
3. Work through **Frontend**, **Backend**, and **Infrastructure** task lists.
4. Check off **Acceptance Criteria** before starting the next phase.
5. Reference linked PRD modules for detailed requirements.
6. Review the agent's **Phase Completion Report** (missing details, env updates) before moving to the next phase.

---

*LearnHub AI – OnlyAI Academy LLM & RAG Capstone*
