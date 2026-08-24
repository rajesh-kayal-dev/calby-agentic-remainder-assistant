# Calby

AI-powered calendar assistant for scheduling, rescheduling, meeting management, and intelligent calendar workflows.

---

## Overview

Calby is an intelligent calendar management assistant that connects to your calendar and leverages agentic AI to help you manage your schedule seamlessly. With natural language interaction, Calby can view, schedule, update, delete, and find optimal meeting slots across your connected calendars.

---

## Features

- **Natural Language Calendar Assistant**: Chat with an AI agent capable of managing events, resolving scheduling conflicts, and finding free slots.
- **Google Calendar Integration**: Secure connection and synchronization with Google Calendar via Descope OAuth.
- **Interactive Calendar Workspace**: Full calendar views (week view, mini-calendar, event details, and connection status) alongside the chat interface.
- **Persistent AI Memory**: Threaded conversations and agent memory powered by Mastra LibSQL storage.
- **Secure Authentication**: User management and authentication powered by Descope (Next.js SDK & Node.js SDK).
- **PostgreSQL Data Persistence**: User accounts, connections, and metadata stored in PostgreSQL (Neon or Docker-hosted).

---

## Tech Stack

### Frontend (`client/`)
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Lucide React icons, Base UI
- **Authentication**: `@descope/nextjs-sdk`
- **Markdown Rendering**: `react-markdown`, `remark-gfm`

### Backend (`server/`)
- **Runtime & Server**: Node.js, Express 5, TypeScript (`tsx`)
- **AI Agent Framework**: Mastra (`@mastra/core`, `@mastra/memory`, `@mastra/libsql`)
- **AI Provider**: OpenAI (`gpt-4o-mini`)
- **Calendar & Auth**: Google APIs (`googleapis`), Descope Node SDK (`@descope/node-sdk`, `@descope/mcp-express`)
- **Database**: PostgreSQL (`pg`), LibSQL (Mastra memory storage)

### Infrastructure & Tooling
- **Database Container**: Docker Compose (PostgreSQL 16)
- **Package Manager**: npm

---

## Project Structure

```text
calby/
├── docker-compose.yml       # Local PostgreSQL container service
├── .gitignore               # Multi-package ignore rules
├── README.md                # Project documentation
├── client/                  # Next.js frontend application
│   ├── .env.example         # Frontend environment template
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── public/              # Static assets and branding
│   └── src/
│       ├── app/             # App router pages (dashboard, sign-in)
│       ├── components/      # UI components (auth, dashboard, landing)
│       └── lib/             # API client, agent client, utility functions
└── server/                  # Express & Mastra backend service
    ├── .env.example         # Backend environment template
    ├── package.json
    ├── tsconfig.json
    ├── scripts/             # Database migration scripts
    ├── sql/                 # SQL schema definitions
    └── src/
        ├── config/          # Descope, memory, and agent instructions
        ├── db/              # PostgreSQL pool connection
        ├── mcp/             # Calendar tools & MCP mount
        ├── middleware/      # Authentication session middleware
        ├── repositories/    # Database access layer (users, connections)
        ├── routes/          # Express route definitions
        └── services/        # Business logic (agent, calendar, token)
```

---

## Environment Variables

### Frontend (`client/.env`)
Create `client/.env` based on `client/.env.example`:

```env
# Descope Client Authentication
NEXT_PUBLIC_DESCOPE_PROJECT_ID=your_descope_project_id

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Backend (`server/.env`)
Create `server/.env` based on `server/.env.example`:

```env
# Server Configuration
PORT=4000
APP_URL=http://localhost:3000

# PostgreSQL Database (Neon PostgreSQL or self-hosted)
DATABASE_URL=postgresql://user:password@your-neon-host/neondb?sslmode=require

# Descope Authentication
DESCOPE_PROJECT_ID=your_descope_project_id
DESCOPE_MANAGEMENT_KEY=your_descope_management_key
DESCOPE_CALENDAR_CONNECTION_ID=google-calendar

# AI Configuration
OPENAI_API_KEY=your_openai_api_key
AI_MODEL=gpt-4o-mini

# Model Context Protocol (MCP) Server
SERVER_URL=http://localhost:4000
DESCOPE_MCP_SERVER_WELL_KNOWN_URL=
```

---

## Local Development

### Prerequisites
- Node.js (v20+ recommended)
- npm
- Docker & Docker Compose (optional for local PostgreSQL)

### 1. Database Setup
Start local PostgreSQL via Docker Compose:
```bash
docker compose up -d
```
Or configure a cloud PostgreSQL connection string (such as Neon) in `server/.env`.

Run database migrations:
```bash
cd server
npm run migrate
```

### 2. Start the Backend Server
```bash
cd server
npm install
npm run dev
```
The server will start on `http://localhost:4000`.

### 3. Start the Frontend Client
```bash
cd client
npm install
npm run dev
```
The application will be accessible at `http://localhost:3000`.

---

## Calendar Integrations

Calby integrates with **Google Calendar** via OAuth tokens managed securely through Descope Outbound Applications:
- **List Events**: Retrieve scheduled events across specified date ranges.
- **Create Events**: Schedule new meetings with titles, descriptions, times, and attendees.
- **Update Events**: Reschedule or modify existing meetings.
- **Delete Events**: Cancel meetings directly through conversational commands.
- **Find Free Slots**: Query calendar availability to suggest non-conflicting meeting slots.

---

## AI Providers

- **Agent Engine**: Mastra Agent framework orchestrating calendar tool calling and conversational memory.
- **Model**: OpenAI `gpt-4o-mini` configured for structured tool use and conversational scheduling workflows.

---

## Development Workflow

- **Branching Strategy**:
  - `main`: Production-ready releases.
  - `develop`: Integration branch for ongoing development.
  - `feature/*`: Specific feature branches (e.g. `feature/calendar-ui`).
- **Commit Style**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `perf:`).

---

## Security Notes

- **Never Commit Secrets**: Real API keys, Descope management keys, database credentials, and OAuth secrets must never be committed.
- **Environment Isolation**: Always use `.env` for local configuration and refer to `.env.example` for required variables.
- **Token Security**: OAuth access and refresh tokens are retrieved and validated per session without persisting long-term credentials on the client.
