# Timesheet/Standup Backend Starter

Minimal Express + Prisma backend with Postgres and optional pgvector for RAG.

## Quick start

1. Copy `.env.example` to `.env` and set `DATABASE_URL` (Supabase or local Postgres) and `OPENAI_API_KEY`.
2. Run:
   pnpm i
   pnpm prisma:generate
   pnpm prisma:migrate
   pnpm dev

## Endpoints
- GET /health
- POST /api/standups/start
- POST /api/standups/:sessionId/answer
- POST /api/standups/:sessionId/submit
- GET  /api/analytics/overview?orgId=ORG&userId=USER
- POST /api/rag/upsert
- POST /api/rag/query
