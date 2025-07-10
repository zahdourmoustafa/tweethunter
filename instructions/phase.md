tweet-inspire/
├── README.md
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── drizzle.config.ts
├── .env.local
├── .env.example
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── components.json                  # shadcn/ui config
├── 
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
│       ├── twitter-logo.svg
│       └── placeholder-avatar.png
├── 
├── src/
│   ├── app/                        # Next.js 14 App Router
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing page
│   │   ├── loading.tsx             # Global loading UI
│   │   ├── error.tsx               # Global error UI
│   │   ├── not-found.tsx           # 404 page
│   │   ├── globals.css             # Global styles
│   │   ├── 
│   │   ├── api/                    # API routes
│   │   │   ├── auth/
│   │   │   │   └── [...auth]/
│   │   │   │       └── route.ts    # Better-auth routes
│   │   │   ├── trpc/
│   │   │   │   └── [trpc]/
│   │   │   │       └── route.ts    # tRPC handler
│   │   │   ├── twitter/
│   │   │   │   ├── search/
│   │   │   │   │   └── route.ts    # Tweet search endpoint
│   │   │   │   └── metrics/
│   │   │   │       └── route.ts    # Tweet metrics endpoint
│   │   │   └── ai/
│   │   │       ├── generate/
│   │   │       │   └── route.ts    # AI tools endpoint
│   │   │       └── stream/
│   │   │           └── route.ts    # Streaming AI responses
│   │   ├── 
│   │   ├── auth/                   # Authentication pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # Login page
│   │   │   ├── callback/
│   │   │   │   └── page.tsx        # OAuth callback
│   │   │   └── error/
│   │   │       └── page.tsx        # Auth error page
│   │   ├── 
│   │   ├── onboarding/             # Onboarding flow
│   │   │   ├── page.tsx            # Welcome page
│   │   │   └── topics/
│   │   │       └── page.tsx        # Topic selection
│   │   ├── 
│   │   └── dashboard/              # Protected dashboard
│   │       ├── layout.tsx          # Dashboard layout
│   │       ├── page.tsx            # Dashboard home
│   │       ├── inspirations/
│   │       │   └── page.tsx        # Main inspirations page
│   │       ├── saved/
│   │       │   └── page.tsx        # Saved content page
│   │       ├── settings/
│   │       │   └── page.tsx        # User settings
│   │       └── analytics/
│   │           └── page.tsx        # Analytics (future)
│   ├── 
│   ├── components/                 # React components
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── separator.tsx
│   │   │   └── textarea.tsx
│   │   ├── 
│   │   ├── auth/                   # Authentication components
│   │   │   ├── login-button.tsx
│   │   │   ├── logout-button.tsx
│   │   │   ├── auth-guard.tsx
│   │   │   └── user-avatar.tsx
│   │   ├── 
│   │   ├── dashboard/              # Dashboard components
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── navigation.tsx
│   │   │   └── stats-card.tsx
│   │   ├── 
│   │   ├── tweets/                 # Tweet-related components
│   │   │   ├── tweet-card.tsx
│   │   │   ├── tweet-grid.tsx
│   │   │   ├── tweet-metrics.tsx
│   │   │   ├── tweet-search.tsx
│   │   │   └── tweet-filters.tsx
│   │   ├── 
│   │   ├── ai-tools/               # AI tool components
│   │   │   ├── ai-tools-sidebar.tsx
│   │   │   ├── ai-tool-button.tsx
│   │   │   ├── ai-tool-dialog.tsx
│   │   │   ├── content-composer.tsx
│   │   │   ├── tool-result.tsx
│   │   │   └── tools/
│   │   │       ├── copywriting-tips.tsx
│   │   │       ├── keep-writing.tsx
│   │   │       ├── add-emojis.tsx
│   │   │       ├── make-shorter.tsx
│   │   │       ├── expand-tweet.tsx
│   │   │       ├── create-hook.tsx
│   │   │       ├── create-cta.tsx
│   │   │       ├── improve-tweet.tsx
│   │   │       ├── more-assertive.tsx
│   │   │       ├── more-casual.tsx
│   │   │       ├── more-formal.tsx
│   │   │       ├── fix-grammar.tsx
│   │   │       └── tweet-ideas.tsx
│   │   ├── 
│   │   ├── common/                 # Common components
│   │   │   ├── loading-spinner.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── confirmation-dialog.tsx
│   │   │   └── page-header.tsx
│   │   ├── 
│   │   └── layout/                 # Layout components
│   │       ├── main-layout.tsx
│   │       ├── dashboard-layout.tsx
│   │       ├── auth-layout.tsx
│   │       └── footer.tsx
│   ├── 
│   ├── lib/                        # Utility libraries
│   │   ├── auth.ts                 # Better-auth configuration
│   │   ├── db.ts                   # Database connection
│   │   ├── twitter.ts              # Twitter API client
│   │   ├── openai.ts               # OpenAI API client
│   │   ├── trpc.ts                 # tRPC client setup
│   │   ├── utils.ts                # General utilities
│   │   ├── constants.ts            # App constants
│   │   ├── validations.ts          # Zod schemas
│   │   └── hooks.ts                # Custom React hooks
│   ├── 
│   ├── server/                     # Server-side code
│   │   ├── api/                    # tRPC routers
│   │   │   ├── root.ts             # Main router
│   │   │   ├── auth.ts             # Auth router
│   │   │   ├── tweets.ts           # Tweet operations
│   │   │   ├── ai-tools.ts         # AI tool operations
│   │   │   └── users.ts            # User operations
│   │   ├── 
│   │   ├── services/               # Business logic
│   │   │   ├── twitter-service.ts
│   │   │   ├── ai-service.ts
│   │   │   ├── user-service.ts
│   │   │   └── analytics-service.ts
│   │   ├── 
│   │   └── middleware/             # Server middleware
│   │       ├── auth-middleware.ts
│   │       ├── rate-limit.ts
│   │       └── error-handler.ts
│   ├── 
│   ├── db/                         # Database
│   │   ├── schema.ts               # Drizzle schema
│   │   ├── migrations/             # Database migrations
│   │   │   ├── 0000_init.sql
│   │   │   ├── 0001_add_users.sql
│   │   │   └── 0002_add_saved_tweets.sql
│   │   ├── seed.ts                 # Database seeding
│   │   └── index.ts                # Database exports
│   ├── 
│   ├── types/                      # TypeScript types
│   │   ├── auth.ts                 # Auth types
│   │   ├── tweet.ts                # Tweet types
│   │   ├── ai.ts                   # AI types
│   │   ├── user.ts                 # User types
│   │   └── api.ts                  # API types
│   ├── 
│   ├── config/                     # Configuration
│   │   ├── env.ts                  # Environment variables
│   │   ├── database.ts             # Database config
│   │   ├── auth.ts                 # Auth config
│   │   └── api.ts                  # API config
│   ├── 
│   └── styles/                     # Styling
│       ├── globals.css             # Global styles
│       └── components.css          # Component styles
├── 
├── docs/                          # Documentation
│   ├── API.md                     # API documentation
│   ├── DEPLOYMENT.md              # Deployment guide
│   ├── CONTRIBUTING.md            # Contributing guide
│   └── ARCHITECTURE.md            # Architecture overview
├── 

├── 
├── scripts/                       # Build scripts
│   ├── build.js                   # Build script
│   ├── dev.js                     # Development script
│   ├── migrate.js                 # Migration script
│   └── seed.js                    # Seeding script
├── 
└── .github/                       # GitHub workflows
    └── workflows/
        ├── ci.yml                 # Continuous integration
        ├── deploy.yml             # Deployment workflow
        └── test.yml               # Testing workflow