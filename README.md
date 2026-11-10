# flashee-app
Full-stack E-commerce & Flash Sale platform with real-time stock tracking and high-concurrency checkout engine.

## Getting started

Prerequisites: Node.js, Docker Desktop (must be running).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
```

Open `backend/.env` and fill in your own values:

- `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Postgres credentials. Docker applies them **only when the `postgres-data` volume is first created**; changing them later does not change the account inside the database.
- `DB_PORT=5433`: host port of the Dockerized Postgres (5432 may be taken by a native install).
- `JWT_SECRET`: use your own long random string, never the example value.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: from Google Cloud Console (OAuth client). The authorized redirect URI must be exactly `http://localhost:3000/api/auth/google/callback`. Only needed for Google login.
- `REDIS_URL`, `FRONTEND_URL`: the defaults in `.env.example` work for local dev.

Start Postgres and Redis, create the schema, load seed data, run the API:

```bash
docker compose up -d        # must be run inside backend/
npm run db:migrate
npm run db:seed
npm run dev                 # http://localhost:3000, check /health
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Vite proxies `/api/*` to the backend, so the browser talks to a single origin and the httpOnly refresh cookie works without extra CORS setup.

## Useful commands (backend)

| Command | What it does |
| --- | --- |
| `npm run db:migrate` | Apply migrations that have not run yet |
| `npm run db:migrate:down` | Roll back the last migration |
| `npm run db:migrate:create -- <name>` | Create a new SQL migration file |
| `npm run db:seed` | Load seed data (countries, users, profiles) |
| `docker compose down -v` | Stop containers **and delete all data** (Postgres + Redis volumes) |

RedisInsight is available at http://localhost:5540 (connect to host `redis`, port `6379` from inside the compose network).

## Notes

- Data lives in Docker volumes on each machine, not in git: after cloning, run migrate + seed to get a working database.
- Migrations are the only way to change the schema; never edit an applied migration, add a new one.
