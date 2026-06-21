# CareerPath

CareerPath is an Express and EJS career counselling application with a Supabase Postgres backend for users, counselor profiles, psychometric test results, and counselor assignment tracking.

## Stack

- Node.js
- Express
- EJS
- Supabase Postgres
- Docker Compose
- Vercel

## Environment

All runtime configuration lives in `.env`.

Required keys:

```env
PORT=3000
SUPABASE_URL=
SUPABASE_ANON_KEY=
POSTGRES_DB=careerpath
POSTGRES_USER=postgres
POSTGRES_PASSWORD=
POSTGRES_PORT=54322
SUPABASE_POSTGRES_IMAGE=supabase/postgres:15.14.1.138_amd64
```

Fill `SUPABASE_URL` and `SUPABASE_ANON_KEY` for hosted Supabase access. Fill `POSTGRES_PASSWORD` before starting the local Docker database.

## Install

```bash
npm install
```

## Run Locally

```bash
npm start
```

The app listens on `PORT` from `.env`, defaulting to `3000`.

## Local Supabase Postgres

```bash
docker compose up -d
```

The database migration is mounted from:

```text
supabase/migrations/init.sql
```

## Database Schema

The migration creates:

- `users`
- `counselors`
- `test_results`

It also creates indexes for counselor specialization lookup, test result foreign keys, and pending assignment queries.

## Deployment

`vercel.json` routes all requests to `server.js` through `@vercel/node`.

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel project environment variables before deployment.
