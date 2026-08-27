# Calby — Production Deployment Guide

This document outlines best practices and steps for deploying Calby to production environments.

---

## Production Architecture Checklist

1. **Database**: Managed PostgreSQL instance (e.g. Neon, AWS RDS, Supabase) with SSL mode enabled.
2. **Redis**: (Optional / Recommended for scale) Managed Redis instance (e.g. Upstash, Redis Cloud, AWS ElastiCache) for BullMQ background queues.
3. **Backend Service**: Containerized Node.js service (e.g. Railway, Render, Fly.io, ECS, Kubernetes).
4. **Frontend Service**: Next.js optimized host (e.g. Vercel, Cloudflare, Node.js container).
5. **Authentication**: Descope production project with verified domain routing.

---

## Deployment Steps

### 1. Database Provisioning & Schema Migration

Set `DATABASE_URL` pointing to your production database, then run migrations:

```bash
cd server
npm run migrate
```

### 2. Environment Variables Configuration

Ensure all required production environment variables are configured on the hosting platform:

```env
NODE_ENV=production
PORT=4000
APP_URL=https://your-calby-domain.com
SERVER_URL=https://api.your-calby-domain.com

DATABASE_URL=postgresql://user:password@neon-host/neondb?sslmode=require
DESCOPE_PROJECT_ID=P2...
DESCOPE_MANAGEMENT_KEY=...
LLM_ENCRYPTION_SECRET=...
REDIS_URL=rediss://...

# Optional external credentials (can also be connected per-user via UI)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://api.your-calby-domain.com/api/connections/google/callback
```

### 3. Server Build & Run

```bash
cd server
npm run build
npm start
```

### 4. Client Build & Deployment

```bash
cd client
npm run build
npm start
```

---

## Health Checks & Monitoring

The backend exposes health check endpoints for uptime monitors and orchestrators (e.g. Kubernetes, AWS ALB):

- `GET /health`
- `GET /api/health`

**Success Response (`200 OK`)**:
```json
{
  "status": "ok",
  "service": "calby-server",
  "database": "up"
}
```

**Failure Response (`503 Service Unavailable`)**:
```json
{
  "status": "error",
  "service": "calby-server",
  "database": "down"
}
```
