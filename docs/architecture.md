# Calby — System Architecture

This document details the architectural design, subsystems, and data flows of Calby.

---

## High-Level Architecture Overview

Calby is structured as a multi-tier agentic system with strict tenant isolation, multi-provider LLM orchestration, durable persistence, and multi-channel notification dispatch.

```text
┌────────────────────────────────────────────────────────────┐
│                    Next.js Client (App Router)            │
│  - Interactive Calendar Workspace & Week View             │
│  - Conversational AI Composer & Multi-Provider Switcher   │
│  - Contacts, Reminders, Tasks, Money Ledger, Reports View │
└────────────────────────────┬───────────────────────────────┘
                             │ HTTPS / REST / SSE
┌────────────────────────────▼───────────────────────────────┐
│                    Express 5 Backend Server                │
│  - Descope JWT Session Authentication Middleware           │
│  - Domain Routes & Input Validation Layer                  │
└───────┬──────────────┬──────────────┬──────────────┬───────┘
        │              │              │              │
┌───────▼──────┐┌──────▼──────┐┌──────▼──────┐┌──────▼───────┐
│ AI & LLM     ││ Domain      ││ Notification││ Tool Router  │
│ Orchestration││ Services    ││ Subsystem   ││ & Registry   │
│ (12 Adapters)││ - Calendar  ││ - Channel   ││ - Validation │
│              ││ - Tasks     ││   Registry  ││ - Confirm    │
│              ││ - Reminders ││ - Queue /   ││ - Audit Log  │
│              ││ - Contacts  ││   Dispatcher││              │
│              ││ - Money     ││ - Transports││              │
│              ││ - Reports   ││             ││              │
└───────┬──────┘└──────┬──────┘└──────┬──────┘└──────┬───────┘
        │              │              │              │
┌───────▼──────────────▼──────────────▼──────────────▼───────┐
│                      Persistence Layer                     │
│  - PostgreSQL (Neon / Self-Hosted) for all relational data │
│  - Redis / BullMQ for async delivery queue                 │
│  - Mastra LibSQL for conversational memory storage         │
└────────────────────────────────────────────────────────────┘
```

---

## Core Subsystems

### 1. Multi-Provider LLM Engine (`src/services/llm/`)
- **Factory & Registry**: Supports 12 providers (OpenAI, Gemini, Anthropic, DeepSeek, Groq, Mistral, Ollama, OpenRouter, Perplexity, MiniMax, xAI Grok, ZAI).
- **Normalized Schema**: Standardizes tool definitions, tool calls, message formats, and streaming deltas across heterogeneous vendor specifications.
- **Secure Encrypted Storage**: User API keys are stored in PostgreSQL using AES-256-GCM encryption with randomized IVs and authentication tags. Plaintext secrets are never returned to the frontend.

### 2. AI Tool Router & Execution Pipeline (`src/tools/`)
- **Isolation**: All tools enforce `authUserId` from the authenticated session context. The LLM cannot provide or override user IDs.
- **Confirmation Flow**: High-impact actions (e.g. event cancellation, message sending) require explicit confirmation.
- **Audit Logging**: Every tool execution is recorded in `tool_execution_logs` with latency, parameters, and status.

### 3. Notification & Delivery Subsystem (`src/services/notifications/`)
- **Channel Registry**: Dynamic registry coordinating In-App, Email (SMTP), Gmail (OAuth), Telegram, and WhatsApp delivery.
- **Queue Architecture**: Employs BullMQ backed by Redis for asynchronous retries and throttling, with an automatic in-memory fallback when Redis is unconfigured.
- **Recipient Resolution**: Automatically resolves external recipients (email address, phone numbers, Telegram chat IDs) from the user's secure contact database.

### 4. Personal Assistant & Intelligence Engine (`src/services/`)
- **Obligation Engine**: Detects outstanding deliverables, commitments, and deadlines across calendar events, reminders, and tasks.
- **Money Ledger**: Multi-currency ledger tracking debts, loans, partial payments, and net contact balances with concurrency row locks.
- **Scheduled Reports**: Automated delivery of daily, weekly, or monthly summaries to configured channels or external documents (Google Docs / Google Sheets).

---

## Security Boundaries & Design Principles

1. **Tenant Isolation**: Every database query scopes access using `WHERE auth_user_id = $1`. Cross-tenant record inspection or manipulation is physically blocked at the repository layer.
2. **Credential Safety**: No credentials, tokens, or encryption keys are ever logged or included in queue payloads.
3. **Defense in Depth**: Incoming webhooks (Telegram, WhatsApp) validate signatures and verification secrets before processing.
