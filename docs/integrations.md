# Calby — Integrations & External Connectors

This document describes how Calby connects with external providers, calendars, communication channels, and productivity tools.

---

## 1. Google Ecosystem

### Google Calendar
- **Protocol**: OAuth 2.0 via Descope Outbound Applications or Google Cloud Console Credentials.
- **Capabilities**:
  - Read calendar events across customizable time intervals.
  - Create and schedule new meetings with attendee invites.
  - Reschedule and modify existing meetings.
  - Delete/cancel meetings with confirmation guards.
  - Query availability and recommend collision-free slots.

### Gmail
- **Protocol**: Google OAuth with `gmail.send` scope.
- **Capabilities**:
  - Send direct emails or reminder dispatches on behalf of the user.
  - RFC 2822 MIME message formatting with subject, body, and recipient headers.

### Google Docs & Google Sheets
- **Protocol**: Google Drive / Docs / Sheets REST APIs.
- **Capabilities**:
  - Export structured executive summaries into newly created Google Docs.
  - Export ledger standings, tasks, or event digests into structured Google Sheets spreadsheets.

---

## 2. Messaging & Communication

### Telegram
- **Transport**: Telegram Bot API (`https://api.telegram.org/bot<TOKEN>`).
- **Connection Flow**: Secure token / deep link authentication via `/start <token>`.
- **Webhook Endpoint**: `POST /api/webhooks/telegram` validating `X-Telegram-Bot-Api-Secret-Token`.
- **Formatting**: HTML mode formatting for reminder and report delivery.

### WhatsApp Business Cloud API
- **Transport**: Meta Graph API (`https://graph.facebook.com/<API_VERSION>/<PHONE_ID>/messages`).
- **Connection Flow**: Per-tenant Phone Number ID and Access Token encrypted in PostgreSQL.
- **Webhook Verification**: `GET /api/webhooks/whatsapp` verifying hub challenge & verify token.
- **Delivery Status Updates**: `POST /api/webhooks/whatsapp` tracking `sent`, `delivered`, and `read` statuses.

### SMTP Email
- **Transport**: Nodemailer SMTP client.
- **Use Cases**: System reminders, daily digest emails, and export delivery.

---

## 3. LLM Providers

Calby supports 12 first-class LLM providers through a unified adapter architecture:

| Provider | Authentication | Tool Calling Format | Streaming Support |
| :--- | :--- | :--- | :--- |
| **OpenAI** | API Key | Native Function Calling | Yes |
| **Google Gemini** | API Key | Gemini Function Declarations | Yes |
| **Anthropic** | API Key | Tool Use (`input_schema`) | Yes |
| **DeepSeek** | API Key | OpenAI Compatible | Yes |
| **Groq** | API Key | OpenAI Compatible | Yes |
| **Mistral** | API Key | OpenAI Compatible | Yes |
| **Ollama** | Base URL / Key | OpenAI Compatible | Yes |
| **OpenRouter** | API Key | OpenAI Compatible | Yes |
| **Perplexity** | API Key | OpenAI Compatible | Yes |
| **MiniMax** | API Key | OpenAI Compatible | Yes |
| **xAI Grok** | API Key | OpenAI Compatible | Yes |
| **ZAI** | API Key | OpenAI Compatible | Yes |

Credentials for each provider are encrypted with AES-256-GCM and stored per user.
