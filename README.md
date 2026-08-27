# Calby

**Calby** is an intelligent, multi-provider AI personal assistant and productivity suite. It unifies schedule management, task tracking, smart obligations, financial ledgers, and multi-channel communication (Email, Gmail, Telegram, WhatsApp) into a seamless conversational workspace.

---

## Key Capabilities

- **Intelligent Calendar Management**: View, schedule, update, delete, and find collision-free meeting slots across Google Calendar with natural language interaction and confirmation guards.
- **Multi-Provider LLM Engine**: Seamlessly switch between **12 LLM providers** (OpenAI, Google Gemini, Anthropic, DeepSeek, Groq, Mistral, Ollama, OpenRouter, Perplexity, MiniMax, xAI Grok, ZAI) with per-user AES-256-GCM encrypted API key storage.
- **Task & Task List Management**: Nested subtasks, priority levels, status tracking, recurring schedules, and auto-linked reminders.
- **Money & Debts Ledger**: Multi-currency ledger tracking debts, loans, partial payments, and net contact balances with concurrency row locks.
- **Multi-Channel Notifications**: Real-time reminders and scheduled digests dispatched across In-App, Email (SMTP), Gmail (OAuth), Telegram, and WhatsApp Cloud API via BullMQ with automatic in-memory fallback.
- **Executive Summaries & Reports**: On-demand and scheduled daily/weekly/monthly reports with automated export to Google Docs and Google Sheets.
- **Strict Tenant Isolation**: Zero cross-tenant data leakage; all tools, queries, and repositories strictly enforce authenticated session boundaries.

---

## Tech Stack

### Frontend (`client/`)
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Lucide React, Base UI
- **Authentication**: `@descope/nextjs-sdk`
- **Markdown & UI**: `react-markdown`, `remark-gfm`

### Backend (`server/`)
- **Runtime & Server**: Node.js, Express 5, TypeScript (`tsx`)
- **AI Agent Framework**: Mastra (`@mastra/core`, `@mastra/memory`, `@mastra/libsql`)
- **Database**: PostgreSQL 16 (`pg`), LibSQL (conversational agent memory)
- **Queues & Async Dispatch**: BullMQ & Redis (`ioredis`)
- **Integrations**: Google APIs (`googleapis`), Descope Node SDK (`@descope/node-sdk`), Nodemailer (`nodemailer`)

---

## Project Structure

```text
calby/
├── docker-compose.yml       # Local PostgreSQL database container
├── README.md                # Main project documentation
├── docs/                    # Architectural & operational documentation
│   ├── architecture.md      # Multi-tier system architecture & security model
│   ├── development.md       # Setup, local development, migrations & testing
│   ├── integrations.md      # Google, Telegram, WhatsApp & LLM integrations
│   └── deployment.md        # Production hosting, health checks & env vars
│
├── client/                  # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App router pages (dashboard, calendar, sign-in)
│   │   ├── components/      # UI components (auth, dashboard, landing, ui)
│   │   ├── context/         # React contexts (LLM, preferences, profile)
│   │   └── lib/             # API client, types & utilities
│   └── package.json
│
└── server/                  # Express backend & AI services
    ├── sql/                 # 23 idempotent PostgreSQL migrations
    ├── scripts/             # Database migration runner
    ├── src/
    │   ├── config/          # Descope, memory, agent instructions
    │   ├── db/              # PostgreSQL connection pool
    │   ├── middleware/      # Authentication session verification
    │   ├── repositories/    # Data access layer with tenant isolation
    │   ├── routes/          # Express REST & webhook routes
    │   ├── services/        # Domain services (calendar, tasks, money, etc.)
    │   │   ├── llm/         # 12 LLM provider adapters & tool formatters
    │   │   ├── notifications/# Channel registry, queue & transports
    │   │   └── reports/     # Report engine, renderers & export services
    │   ├── tools/           # AI tool registry, router & handlers
    │   └── index.ts         # Application entrypoint & HTTP server
    └── package.json
```

---

## Quick Start

### 1. Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL (local or cloud instance like Neon)
- (Optional) Redis for background queues

### 2. Install & Configure

```bash
# Clone & install backend
cd server
npm install
cp .env.example .env

# Run database migrations
npm run migrate

# Start backend server
npm run dev
```

```bash
# In a separate terminal, install & start frontend
cd client
npm install
cp .env.example .env
npm run dev
```

The client will be running at `http://localhost:3000` and the API server at `http://localhost:4000`.

---

## Testing & Quality Verification

```bash
# Run all backend unit & integration tests
cd server
npm test

# Type check
cd server && npx tsc --noEmit
cd ../client && npx tsc --noEmit

# Production builds
cd server && npm run build
cd ../client && npm run build
```

---

## Documentation

- [Architecture & Security](docs/architecture.md)
- [Local Development & Testing](docs/development.md)
- [Integrations & Connectors](docs/integrations.md)
- [Production Deployment](docs/deployment.md)
