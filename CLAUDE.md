# ConductorOS — CLAUDE.md

## Project Overview
ConductorOS is an AI-powered SaaS for construction site managers (conducteurs de travaux). It automates emails, tender analysis, contract analysis, completion reports, and more.

## Tech Stack
- **Frontend**: Next.js 14 App Router, TypeScript strict
- **Styling**: Tailwind CSS + custom design system (shadcn/ui-inspired)
- **Auth**: NextAuth.js (Google OAuth + email magic link + credentials)
- **Database**: PostgreSQL via Supabase, Prisma ORM v5
- **AI**: Anthropic Claude API (Haiku for simple tasks, Sonnet for complex)
- **i18n**: next-intl (FR/EN/ES/PT)
- **Cache**: Upstash Redis (serverless)
- **Payments**: Stripe Billing
- **Deployment**: Vercel-ready

## Project Structure
```
src/
  app/
    (auth)/       - login, register, forgot-password, reset-password
    (dashboard)/  - main app pages (sidebar layout)
    (admin)/      - super admin pages (admin layout)
    (landing)/    - public landing page
    api/          - API routes
  components/
    ui/           - design system (button, card, input, badge, avatar, separator)
    layout/       - sidebar, header, dashboard-shell
    providers.tsx - session + theme providers
    theme-provider.tsx - dark/light/system theme
  lib/
    auth.ts       - NextAuth configuration
    db.ts         - Prisma client singleton
    utils.ts      - cn() utility
    fonts.ts      - font configuration
    ai/           - Claude API wrappers (callAi, streamAi, getPrompt)
    email/        - Gmail/Outlook connectors (sync, classify, reply)
    pdf/          - Triple-layer PDF processing (parse → fallback → Vision OCR)
    stripe/       - Stripe integration (checkout, portal, webhooks)
  i18n.ts         - next-intl configuration
  middleware.ts   - i18n middleware
messages/         - fr.json, en.json, es.json, pt.json
prisma/
  schema.prisma   - Complete database schema
```

## Design System
- **Dark mode**: bg #080809, surface #111113, accent #F59E0B
- **Light mode**: bg #FFFFFF, surface #F8F8F9, accent #D97706
- **Fonts**: DM Sans (body), Syne (display), JetBrains Mono (code)
- **Border radius**: 8px cards, 6px inputs, 4px badges
- **Animations**: 150ms ease-out
- **Sidebar**: 240px fixed desktop, drawer on mobile

## Key Commands
```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
npx prisma generate  # Regenerate Prisma client
npx prisma db push   # Push schema to DB
```

## Environment Variables
See `.env.example` for all required variables.

## Conventions
- No console.log in production code
- No hardcoded strings (use i18n messages)
- No hardcoded AI prompts (use AiPrompt table via getPrompt())
- All AI prompts editable from admin panel
- AI model routing: Haiku for simple, Sonnet for complex tasks
- Cache AI results in Redis (SHA256 key, 30-day TTL)
- Mobile-first responsive design (320px, 768px, 1440px)

## Build Status
- [x] Phase 1: Foundations (Next.js, Tailwind, Prisma, NextAuth, Layout, i18n)
- [x] Phase 2: Email module (Gmail/Outlook, AI classification, AI reply with streaming)
- [x] Phase 3: PDF analysis (triple-layer extraction, AO/contract analysis, PV generation)
- [x] Phase 4-6: Business features, Settings, Stripe, AI assistant
- [x] Phase 7: Super Admin (dashboard, users, prompts, costs, audit, config)
- [x] Phase 8: Landing page (hero, features, pricing, FAQ, CTA)
- [x] Phase 9: SEO (next-sitemap, robots.txt, Open Graph, JSON-LD)
- [x] Phase 10: Company creation guide (7-step accordion)
- [x] Phase 11: Distribution strategy guide (6 marketing channels)
- [x] Phase 12: Growth roadmap (admin, Q1-Q4 2026 timeline)
- [x] Phase 13: Testing (Vitest, 20 unit tests, 4 test suites)
