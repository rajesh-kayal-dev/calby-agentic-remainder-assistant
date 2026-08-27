# Calby — Local Development Guide

This guide details instructions for setting up, running, testing, and contributing to Calby.

---

## Prerequisites

- **Node.js**: v20.x or higher recommended
- **npm**: v10.x or higher
- **PostgreSQL**: Local instance (Docker Compose provided) or cloud instance (e.g. Neon)
- **Redis**: (Optional) For BullMQ background job queues

---

## Initial Setup

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd Calby

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Configuration

Copy the example environment templates:

```bash
# In server/
cp .env.example .env

# In client/
cp .env.example .env
```

Configure the required variables in `server/.env`:
- `DATABASE_URL`: PostgreSQL connection string
- `DESCOPE_PROJECT_ID`: Descope project identifier
- `DESCOPE_MANAGEMENT_KEY`: Descope management key
- `LLM_ENCRYPTION_SECRET`: 32-character AES encryption key
- `OPENAI_API_KEY`: OpenAI API key (or configure other providers in the UI)

Configure `client/.env`:
- `NEXT_PUBLIC_DESCOPE_PROJECT_ID`: Same Descope project identifier
- `NEXT_PUBLIC_API_URL`: Backend URL (defaults to `http://localhost:4000`)

---

## Database Migrations

Calby manages PostgreSQL schema changes with numbered SQL migrations in `server/sql/`:

```bash
cd server
npm run migrate
```

---

## Running the Application

### Start the Backend Server

```bash
cd server
npm run dev
```
The server starts on `http://localhost:4000` with hot reloading enabled via `tsx watch`.

### Start the Frontend Client

```bash
cd client
npm run dev
```
The Next.js client starts on `http://localhost:3000`.

---

## Testing & Quality Assurance

### Run Backend Unit & Integration Tests

```bash
cd server
npm test
```
Executes all 289 unit and integration tests across services, adapters, and repositories.

### Type Checking

```bash
# Server typecheck
cd server
npx tsc --noEmit

# Client typecheck
cd client
npx tsc --noEmit
```

### Production Builds

```bash
# Server build
cd server
npm run build

# Client build
cd client
npm run build
```
