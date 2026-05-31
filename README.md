Mnemio is a free, ad-free vocabulary learning platform with AI-driven deck creation, smart hints, and a gamified progression system. This repository contains the frontend application built with Nuxt 4, Vue 3, and TypeScript.

Features

AI Bulk Deck Creation — Paste 50+ words at once and let the AI find the best definitions and build a deck automatically
All Study Modes Free — Flashcards, True/False, Multiple Choice, Matching, Written, and Advanced Learning — no subscription required
Smart Hints — AI tracks your hardest words and generates mnemonics, synonyms, and example sentences to improve retention
Strict Mode — No hints, no second attempts; failed cards are revisited at the end of the session
Leagues & Achievements — Weekly XP-based leagues, badges, streaks, and reward points
Zero Ads — Clean, distraction-free study environment
20+ Language UI — Full internationalisation via nuxt-i18n
Light / Dark / Custom Themes — Powered by @nuxtjs/color-mode


Tech Stack
LayerTechnologyFrameworkNuxt 4 + Vue 3LanguageTypeScriptStylingTailwind CSSComponentsshadcn-vueStatePiniaUtilitiesVueUseAnimations@vueuse/motionFormsvee-validate + Zodi18nnuxt-i18nHTTPofetchThemes@nuxtjs/color-mode

Architecture
mnemio-web/          # This repo — Nuxt 4 frontend
     ↕ REST API (ofetch)
mnemio-api/          # Fastify backend (separate repo)
     ↕ Prisma ORM
PostgreSQL           # Hosted on Supabase
The frontend never connects to the database directly. All data flows through the Fastify REST API.
Deployment: Vercel

Getting Started
Prerequisites

Node.js 20+
pnpm (recommended)

Install
bashgit clone https://github.com/your-username/mnemio-web.git
cd mnemio-web
pnpm install
Environment
Copy .env.example to .env and fill in the values:
bashcp .env.example .env
envNUXT_PUBLIC_API_BASE=http://localhost:3001
Dev server
bashpnpm dev
App runs at http://localhost:3000.
Build
bashpnpm build

Project Structure
mnemio-web/
├── app/
│   ├── components/       # Reusable Vue components
│   ├── composables/      # Shared Vue composables
│   ├── layouts/          # Nuxt layouts
│   ├── pages/            # File-based routing
│   ├── stores/           # Pinia stores
│   └── utils/            # Helper functions
├── i18n/
│   └── locales/          # Translation files
├── public/               # Static assets
├── server/               # Nuxt server middleware (minimal — logic lives in mnemio-api)
├── shared/
│   └── schemas/          # Zod schemas shared with backend
└── nuxt.config.ts

Related Repositories
RepoDescriptionmnemio-apiFastify backend — auth, decks, AI features, progress tracking

Roadmap

 Auth — login, register, Google OAuth
 Deck management — create, edit, delete, folders
 Study modes — Flashcards, Written, Multiple Choice, Matching, True/False
 AI deck creation — bulk word input with AI definition lookup
 Strict mode
 Spaced repetition engine (SM-2)
 Leagues & XP system
 Achievements & badges
 AI smart hints
 AI quiz generator
 Full language learning platform


License
Private — all rights reserved.Project content🧮 MnemioCreated by youeslint.config.js30 linesjsMnemio — Product Vision & Advantages.md84 linesmd
