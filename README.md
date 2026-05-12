# AI-Linc LMS Platform — Frontend

A modern, full-featured Learning Management System built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Material-UI 7**, and **Tailwind CSS 4**. The platform powers end-to-end learning workflows: authentication, courses, assessments with live proctoring, AI-assisted mock interviews, live classes, a job portal, certificate generation, community threads, and a complete admin console.

---

## Table of Contents

- [Highlights](#highlights)
- [Feature Scope](#feature-scope)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Architecture Notes](#architecture-notes)
- [API Services](#api-services)
- [Authentication & Authorization](#authentication--authorization)
- [Proctoring System](#proctoring-system)
- [Internationalization](#internationalization)
- [Observability](#observability)
- [Build & Deployment](#build--deployment)
- [Contributing](#contributing)

---

## Highlights

- **Next.js 16 App Router** with Turbopack-friendly config and standalone output for container deployments.
- **React 19** with concurrent features and a Redux Toolkit + React Context hybrid state model.
- **Material-UI 7 + Tailwind CSS 4** for a hybrid design system (MUI primitives, Tailwind utility passes).
- **AI-powered course builder** and **AI mock interview** flows.
- **Browser-side proctoring** via TensorFlow.js BlazeFace, fullscreen + tab-switch + devtools detection, screen wake-lock, and live publishing through LiveKit.
- **PDF certificate generation** (jsPDF + html2canvas + html-to-image) with custom font (Montserrat) support and shareable links.
- **OpenTelemetry instrumentation** wired for both Node and browser traces.
- **i18next** with locale files for multi-language support.

---

## Feature Scope

### Learner Experience

| Area | Capabilities |
| --- | --- |
| **Authentication** | Email/password login, signup, forgot/reset password, email verification (OTP), Google OAuth scaffolding |
| **Dashboard** | Enrolled courses, progress, leaderboard, streaks, congratulations modals |
| **Courses** | Course catalog, detail page (`/courses/[id]`), modules, enrollment, progress tracking |
| **Assessments** | Browse assessments, take page (`/assessments/[slug]`), section timers, autosave, results page, scorecards |
| **Coding & Quiz** | Monaco editor, syntax highlighting, multi-language support, quiz components |
| **Mock Interview** | Quick-start, scheduled, and previous interviews; AI avatar; video preview; live transcript via speech-to-text |
| **Live Sessions** | LiveKit-based classroom; participant view; live publishing |
| **Community** | Threaded discussions (`/community/[threadId]`) |
| **Job Portal** | Jobs v1 + v2 listings, filters, detail pages (`/jobs-v2/[id]`), application flow |
| **Profile & Resume** | Profile editor, saved resumes, resume URL preview |
| **Certificates** | Generated PDFs, shareable links, custom branding |
| **Attendance** | Learner attendance view |
| **Notifications** | In-app notification center |

### Admin Console (`/admin`)

- AI Course Builder
- Course Builder (manual)
- Assessment authoring & analytics
- Manage Students
- Pending Instructor approvals
- Branding (colors, logos)
- Certificate management
- Live Sessions scheduling
- Mock Interview administration
- Jobs (v2) management
- Email campaigns
- Notifications broadcast
- Scorecard management
- Content verification
- Attendance reports
- Admin profile

### Cross-cutting

- Proctoring (face/no-face/multi-face detection, fullscreen lock, tab-switch, devtools probe, trackpad gesture detection)
- Theme switching (light/dark) via `ThemeContext`
- Admin/Learner mode switching via `AdminModeContext`
- Client white-labeling via `ClientInfoContext`

---

## Tech Stack

**Framework & Language**
- Next.js `16.1.1` (App Router, standalone output, Turbopack-compatible)
- React `19.2.3`, React DOM `19.2.3`
- TypeScript `5`

**UI & Styling**
- Material-UI `^7.3.6` (`@mui/material`, `@mui/icons-material`)
- Emotion `^11` (cache, react, styled)
- Tailwind CSS `^4` (with `@tailwindcss/postcss`)
- Framer Motion `^12`
- `lucide-react`, `@iconify/react` for icons
- `mui-tel-input` for phone inputs

**State, Forms & Validation**
- Redux Toolkit `^2.11` + React Redux `^9`
- React Hook Form `^7.69`
- Zod `^4`, Yup `^1.7`, Formik `^2.4`

**Networking**
- Axios `^1.13`
- `js-cookie`

**Editor, Charts & DnD**
- Monaco Editor + `@monaco-editor/react`
- `react-syntax-highlighter`
- Recharts `^3.6`
- `@hello-pangea/dnd`

**Live Media & AI**
- LiveKit Client + Components (`@livekit/components-react`)
- TensorFlow.js (`@tensorflow/tfjs-core`, `tfjs-backend-webgl`, `tfjs-converter`) with `@tensorflow-models/blazeface`

**Documents & Files**
- `jspdf` (aliased to ESM build for browser bundling), `html2canvas`, `html-to-image`, `jszip`, `canvas`

**i18n & Markdown**
- `i18next` + `react-i18next`
- `react-markdown` + `remark-gfm`

**Observability**
- OpenTelemetry SDKs (Node + Web), OTLP HTTP exporter, fetch + xhr instrumentations

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20 (Next.js 16 requires modern Node)
- **Yarn** classic (the repo ships `yarn.lock`)
- A running backend exposing the LMS API (default `http://localhost:8000`)

### Install

```bash
yarn install
```

### Run the dev server

```bash
yarn dev
```

The app starts on `http://localhost:3000`. Hot reloading is enabled via Next.js dev mode.

### Lint

```bash
yarn lint
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_CLIENT_ID=1

# OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# LiveKit (live sessions, mock interview, proctoring publishing)
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-host
NEXT_PUBLIC_LIVEKIT_API_KEY=...

# OpenTelemetry (optional)
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel.example.com
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=https://otel.example.com

# Misc
NEXT_PUBLIC_APP_ENV=development
```

> Confirm exact variable names against [`lib/config.ts`](lib/config.ts), [`instrumentation.ts`](instrumentation.ts), and the relevant service files before deploying — only public-prefixed vars are exposed to the browser.

---

## Available Scripts

| Script | Description |
| --- | --- |
| `yarn dev` | Start the Next.js dev server |
| `yarn build` | Production build (uses webpack alias for `jspdf` ESM) |
| `yarn start` | Run the production server (after `build`) |
| `yarn lint` | Run ESLint with the Next.js config |
| `yarn ngrok` | Tunnel local dev (port 5173) via ngrok |

---

## Project Structure

```
lms-platform-revamped/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # login, signup, forgot/reset password, verify-email
│   ├── admin/                    # Admin console (course builder, assessments, students, …)
│   ├── api/                      # Route handlers (server-side endpoints)
│   ├── assessments/              # Assessment list, take page, results
│   ├── attendance/
│   ├── community/[threadId]/
│   ├── courses/[id]/
│   ├── dashboard/
│   ├── jobs/   jobs-v2/[id]/
│   ├── live-sessions/
│   ├── mock-interview/[id]/      # quick-start, schedule, scheduled, previous
│   ├── proctoring-demo/
│   ├── profile/
│   └── user/scorecard/
│
├── components/                   # Feature-grouped React components
│   ├── admin/                    # admin dashboards & tools
│   ├── assessment/  proctoring/  # take + monitor flows
│   ├── auth/  certificate/  charts/
│   ├── coding/  editor/  quiz/
│   ├── community/  course/  dashboard/
│   ├── jobs/  jobs-v2/  live-sessions/  mock-interview/
│   ├── notifications/  profile/  scorecard/  video/
│   ├── common/  layout/  ui/     # shared primitives
│   └── providers/                # Redux, Theme, Client, i18n providers
│
├── lib/
│   ├── auth/                     # auth helpers
│   ├── certificate/              # PDF / certificate utilities
│   ├── contexts/                 # AdminMode, ClientInfo, Theme
│   ├── fullscreen/               # fullscreen lock helpers
│   ├── hooks/                    # 20+ custom hooks (proctoring, timers, autosave, …)
│   ├── i18n.ts                   # i18next setup
│   ├── mock-data/                # local fixtures
│   ├── schemas/                  # Zod / Yup schemas
│   ├── services/                 # API clients (one file per domain)
│   ├── store/                    # Redux store + typed hooks
│   ├── telemetry/                # OpenTelemetry helpers
│   ├── theme/  theme.ts          # MUI theme + tokens
│   ├── types/  utils/            # shared types & helpers
│   └── config.ts                 # runtime config
│
├── hooks/                        # top-level shared hooks
├── workers/                      # web workers
├── locales/                      # i18n translations
├── public/                       # static assets
├── types/                        # ambient declarations
├── utils/                        # top-level utilities
├── instrumentation.ts            # Next.js instrumentation entry (OpenTelemetry)
├── proxy.ts                      # dev/proxy helpers
├── netlify.toml                  # Netlify deploy config
├── next.config.ts                # Next config (jspdf alias, image, OTel-friendly)
└── tsconfig.json
```

---

## Architecture Notes

- **App Router everywhere.** All routes live under `app/`. Client components are explicitly marked with `"use client"`; data fetching and shells stay server-side where possible.
- **Service layer.** Every backend domain has a dedicated service in `lib/services/*.service.ts` that wraps a single shared Axios instance from `lib/services/api.ts`. Components never call Axios directly.
- **State.** Redux Toolkit holds long-lived/global state (auth session, dashboard caches). React Context handles cross-cutting concerns (theme, admin mode, client branding). Local UI state stays in components.
- **Forms.** React Hook Form is the default; Zod (and Yup in legacy spots) provide schemas. Centralized resolvers live in `lib/schemas`.
- **Styling.** MUI provides primitives, layout, and theming; Tailwind handles utility-level tweaks. Avoid mixing `sx` and Tailwind on the same element.
- **PDF generation.** `jspdf` is force-aliased to its ESM build in [`next.config.ts`](next.config.ts) so Turbopack and Webpack both bundle a browser-safe entry.
- **Image optimization.** AVIF/WebP enabled with permissive remote pattern; tighten the `remotePatterns` allowlist before production.
- **Bundle size.** `experimental.optimizePackageImports` covers `@mui/material` and `@mui/icons-material`.

---

## API Services

A complete list of endpoints lives in [`lib/services/api-list.ts`](lib/services/api-list.ts). At a glance:

- `accounts`, `activity`, `client`, `dashboard`, `profile`
- `courses`, `assessment`, `community`
- `jobs`, `jobs-v2`
- `mock-interview`, `live-class`, `livekit`, `zoom`
- `proctoring`, `proctoring-api`
- `certificate`, `certificate-share`
- `notification`, `payment`, `resume`, `file-upload`
- `scorecard`, `admin/*`, `live-sessions/*`

All services share an Axios instance with auth/cookie headers, response normalization, and centralized error handling.

---

## Authentication & Authorization

- **Tokens** issued by the backend are stored in cookies (via `js-cookie`) and attached to every Axios request.
- **Session bootstrapping** happens in providers under [`components/providers`](components/providers).
- **Route guards** live alongside contexts (e.g. `AdminModeContext`) and per-page client checks.
- **Google OAuth** is wired but gated on `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

---

## Proctoring System

The assessment + mock-interview flows enforce strict integrity controls (see [`lib/hooks`](lib/hooks)):

- `useProctoring` / `useProctoringWithLogging` — face detection via TensorFlow BlazeFace
- `useLiveProctoringPublisher` — live video relay to LiveKit
- `useFullscreenHandler`, `useFullscreenMonitor` — enforce/exit fullscreen
- `useTabSwitchDetector`, `useDevtoolsProbe`, `useTrackpadSwipeDetector` — anti-cheat heuristics
- `useScreenWakeLock` — keep the screen awake during long assessments
- `useStopCameraOnMount`, `useCameraRouteGuard` — camera lifecycle on route changes

Demo: [`/proctoring-demo`](app/proctoring-demo/page.tsx).

---

## Internationalization

- Initialized in [`lib/i18n.ts`](lib/i18n.ts) using `i18next` + `react-i18next`.
- Translation files live in [`locales/`](locales).
- Use the `useTranslation()` hook in client components; keep keys namespaced by feature.

---

## Observability

- Browser + Node tracing is bootstrapped in [`instrumentation.ts`](instrumentation.ts).
- Fetch and XHR instrumentations are enabled by default; spans export over OTLP/HTTP.
- Add custom spans through helpers in [`lib/telemetry`](lib/telemetry).

---

## Build & Deployment

```bash
yarn build
yarn start
```

- Output mode is `standalone` — the `.next/standalone` folder is the deploy artifact (Docker/Node hosts).
- A [`netlify.toml`](netlify.toml) is provided for Netlify deployments.
- Set every `NEXT_PUBLIC_*` variable at build time; server-only secrets at runtime.
- Production builds strip `console.log` (preserving `error` and `warn`) — see [`next.config.ts`](next.config.ts).

---

## Contributing

1. Read [`DEVELOPMENT_GUIDELINES.md`](DEVELOPMENT_GUIDELINES.md) for code style, naming, component, and Git workflow rules.
2. Create a feature branch off `stagging`.
3. Run `yarn lint` and ensure the build succeeds before pushing.
4. Open a PR into `stagging`; production releases merge `stagging` → `main`.
5. For new API integrations, add a service file under `lib/services/` instead of calling endpoints inline.
6. For new proctoring or assessment behavior, prefer composing existing hooks in `lib/hooks/`.

---

## Related Documents

- [`DEVELOPMENT_GUIDELINES.md`](DEVELOPMENT_GUIDELINES.md) — coding standards & PR checklist
- [`API_CONTRACT (1).md`](API_CONTRACT%20%281%29.md) — backend contract reference
- [`MOCK_INTERVIEW_STRUCTURE.md`](MOCK_INTERVIEW_STRUCTURE.md) — mock interview architecture
- [`MOCK_INTERVIEW_ADMIN_DASHBOARD.md`](MOCK_INTERVIEW_ADMIN_DASHBOARD.md) — admin tooling for interviews
