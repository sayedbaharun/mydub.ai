# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyDub.AI (recently rebranded from "AI Concierge" to "Ayyan X") is an AI-powered information platform for Dubai residents and tourists, built with React 18, TypeScript, Vite, and Supabase. The application provides real-time government data, news aggregation, tourism information, and AI chatbots with multi-language support (English, Arabic, Hindi, Urdu) including RTL text support.

## Development Commands

### Core Development
- `npm run dev` - Start development server on port 8001 (not default 5173)
- `npm run build` - Build for production  
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Testing
- `npm run test` - Run unit tests with Vitest
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Generate test coverage reports
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:ui` - Run E2E tests with UI
- `npm run test:e2e:debug` - Debug E2E tests

### Performance Analysis
- `npm run build:analyze` - Analyze bundle size with rollup-plugin-visualizer
- `npm run lighthouse` - Run Lighthouse performance audits
- `npm run perf:check` - Run performance analysis

### Data Management
- `npm run seed` - Seed database with initial data
- `npm run import:articles` - Import articles to Supabase
- `npm run migrate:api-keys` - Migrate API keys (scripts/migrate-api-keys.ts)

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript 5, Vite 6, React Router DOM 7
- **Styling**: Tailwind CSS 3, Shadcn/ui (Radix UI), Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime)
- **AI Integration**: OpenRouter API (GPT-4, Claude-3, Gemini Pro) abstracted in `services/aiClient.ts`
- **State Management**: TanStack Query, React Context
- **Internationalization**: i18next with RTL support for Arabic/Urdu
- **PWA**: Vite PWA plugin with network-first caching strategy
- **Monitoring**: Sentry for errors, Google Analytics 4 for usage

### Directory Structure
```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Header, Sidebar)
│   ├── shared/         # Shared utilities (ErrorBoundary, LoadingSpinner)  
│   └── ui/             # Shadcn UI components
├── features/           # Feature-based modules
│   ├── auth/           # Authentication system
│   ├── chatbot/        # AI chatbot interface
│   ├── dashboard/      # Admin dashboard
│   ├── government/     # Government data feeds
│   ├── news/           # News aggregation
│   ├── practical/      # Practical information
│   ├── search/         # Search functionality
│   └── tourism/        # Tourism information
├── hooks/              # Custom React hooks
├── i18n/               # Internationalization configs
├── lib/                # Core utilities (Supabase client, constants)
├── pages/              # Page-level components
├── providers/          # React context providers
├── routes/             # Route configuration
├── services/           # API integration services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Feature Architecture
Each feature module follows a consistent structure:
- `components/` - Feature-specific UI components
- `pages/` - Page components for routing
- `services/` - API calls and business logic
- `types/` - TypeScript definitions
- `hooks/` - Custom hooks

### Key Patterns
- **Authentication**: Context-based auth with Supabase Auth, protected routes with role-based access (user, curator, editor, admin). Profile creation handled by database triggers
- **Routing**: Centralized in `src/routes/router.tsx` with lazy loading, Suspense boundaries, protected/public route wrappers
- **Internationalization**: Dynamic locale loading, RTL support via `tailwindcss-rtl` plugin, HTML `dir` attribute changes for Arabic/Urdu
- **Performance**: Advanced Vite chunk splitting, service worker caching, intersection observer for images, bundle monitoring
- **Error Handling**: Global error boundaries, consistent error states, Sentry integration for production monitoring

## Configuration Notes

### Environment Variables
Use `import.meta.env.VITE_*` prefix for environment variables in Vite. The app gracefully handles missing variables with placeholder values. Key variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_SENTRY_DSN` - Error monitoring
- `VITE_GA_MEASUREMENT_ID` - Google Analytics
- `VITE_PUBLIC_SITE_URL` - Site URL for PWA manifest
- `VITE_OPENROUTER_API_KEY` - AI model access

### Database
Supabase PostgreSQL with Row-Level Security policies. Migration files in `/supabase/migrations/`. Recent migrations show ongoing RLS policy improvements. Host in AWS Middle East region for UAE data residency compliance.

### TypeScript
Strict mode enabled with path aliases (`@/*` maps to `./src/*`). Use absolute imports with the `@/` prefix.

### Styling
Tailwind utility-first approach. Shadcn/ui components in `src/components/ui/`. Custom theme in `tailwind.config.js` supports light/dark modes and RTL layouts. Brand colors: Desert Gold (#DBA853), AI Blue (#0EA5E9). Recent fixes for Radix UI scope prop warnings.

### Testing
- Unit tests: Vitest with jsdom environment and Testing Library
- E2E tests: Playwright with multiple projects (desktop, mobile, accessibility)
- Coverage with v8 provider
- Test files in `__tests__/` folders alongside components
- Run single test: `npm run test -- path/to/test.spec.ts`

## Development Rules

From cursor_project_rules.mdc and best-practices.mdc:
- Use functional components only (no class components)
- Follow TypeScript strict mode
- Use Tailwind utility classes for styling
- Organize code by feature, not by file type
- Implement proper error boundaries and loading states
- Ensure accessibility and internationalization support
- Abstract AI model calls in `services/aiClient.ts`
- Store prompt templates under `src/prompts/`
- Use React.lazy and Suspense for code-splitting heavy modules
- Initialize Supabase once in `lib/supabase.ts`
- Lazy-load i18n locale bundles with `useTranslation` hook
- Use React Hook Form with Zod for form validation
- Implement RLS policies for all Supabase tables

## Critical Architecture Decisions

### Route-based Code Splitting
All routing is centralized in `src/routes/router.tsx`. Routes use lazy loading with error boundaries. Example pattern:
```typescript
const HomePage = lazy(() => import('@/pages/HomePage'))
```

### AI Integration Pattern
All AI calls go through `src/lib/ai-services.ts` which abstracts multiple providers via OpenRouter. Never call AI APIs directly. Prompt templates are versioned in `src/prompts/`.

### Authentication Flow
1. User signs up → Supabase Auth creates user
2. Database trigger creates profile automatically
3. AuthContext provides session throughout app
4. Protected routes check roles: user → curator → editor → admin

### Performance Optimization
- Vite config has advanced chunk splitting (vendor, react, ui chunks)
- Images use lazy loading with intersection observer
- Service worker implements network-first caching
- Bundle size monitored with rollup-plugin-visualizer

### UAE Compliance
- Parental consent system for users under 18
- Data residency in AWS Middle East region
- Comprehensive CSP headers for security
- RTL support with proper `dir` attribute handling

## Brand Voice (from mydub_brand_voice.md)

When writing user-facing content:
- Personality: "Sophisticated AI friend who knows everything happening in Dubai right now"
- Use phrases: "Our AI spotted...", "The city's buzzing about...", "Data shows..."
- Tone: Sophisticated but approachable, real-time & urgent, transparent about AI

## Common Pitfalls to Avoid

1. **Don't use default Vite port** - Dev server runs on 8001, not 5173
2. **Don't call AI APIs directly** - Always use `services/aiClient.ts`
3. **Don't forget RLS policies** - Every Supabase table needs proper RLS
4. **Don't mix import styles** - Always use absolute imports with `@/`
5. **Don't ignore RTL** - Test Arabic/Urdu layouts with proper `dir` attribute
6. **Don't create unnecessary files** - Prefer editing existing files
7. **Don't skip error boundaries** - Every lazy-loaded route needs one

## Deployment Notes

- Deployed on Vercel with automatic SSL
- Environment variables prefixed with `VITE_` are exposed to client
- PWA manifest generated automatically
- GitHub Actions CI/CD pipeline configured
- Launch readiness score: 72/100 (see PWC_LAUNCH_READINESS_REPORT.md)