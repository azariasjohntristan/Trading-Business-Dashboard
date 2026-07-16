# Agent Instructions

## Project
Trading Business Dashboard — personal trading analytics platform.

## Commands

### Server
```bash
cd server && npm run dev        # Start dev server (tsx watch)
cd server && npm run db:migrate # Run Prisma migrations
cd server && npm run db:seed    # Seed database
cd server && npm run db:studio  # Open Prisma Studio
```

### Web
```bash
cd web && npm run dev           # Start Vite dev server
```

### Docker
```bash
docker compose up -d db         # Start PostgreSQL only (dev)
docker compose up -d            # Start all services (prod)
```

### Root
```bash
npm run dev                     # Runs server + web concurrently
```

## Architecture
- `server/` — Express.js + Prisma ORM on port 3001
- `web/` — Vite + React + Tailwind CSS + shadcn/ui on port 5173
- Database — PostgreSQL 17 on port 5432
- API format — REST JSON at `/api/*`
- Timezone — America/New_York

## Coding Rules
- No hardcoded secrets — always use environment variables
- No AI features in Version 1
- UUIDs for all primary keys
- All monetary values: DECIMAL(15,2)
- No comments in code unless absolutely necessary
- Follow existing patterns when adding new code
