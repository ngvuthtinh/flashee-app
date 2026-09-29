# flashee-app

## What this project is

A single-brand e-commerce storefront with flash-sale mechanics — think a brand's own official store (e.g. "Adidas.com"), not a multi-vendor marketplace like Shopee/Amazon. One catalog, one seller, real-time stock tracking, and a checkout path that has to survive many people buying the same limited-stock item at once.

## Why this project exists

This is a **learning-by-building project**. The primary goal is not "ship a store" — it's to become a backend engineer by building one, for real, concept by concept. Optimize explanations and suggestions for genuine understanding, not for the fastest working code.

Concretely this means:
- Prefer explaining the *why* behind a suggestion over just handing over a diff, especially for anything non-obvious.
- It's fine — expected — to move slowly through fundamentals before touching advanced topics. Don't skip ahead to "impressive" solutions if the basics underneath haven't been covered yet.
- When a concept is genuinely hard, break it down rather than compressing it. Prefer a good explanation with a small example over a link-dump of terms.
- Frontend (React/Vite) is a secondary concern — functional but not where learning time should go. Don't over-invest effort or explanation depth there; the backend is the point.

## Learning roadmap (backend engineering fundamentals)

Staged roughly foundation → the hard concurrency core → scaling it for real flash-sale traffic → production maturity. Order is a guide, not a hard gate — follow what the current feature naturally demands, but don't jump to Stage 3 concepts before Stage 2 ones have landed.

**Stage 1 — Foundations (API & data basics)**
- ✅ Auth fundamentals: password hashing (bcrypt), JWT issuing/verifying, role-based middleware
- ✅ DB migrations: why they exist, versioning/tracking tables, how tools like `node-pg-migrate` implement "what's already applied"
- ⬜ RESTful API design & resource modeling (formalize what routes/controllers already do ad hoc)
- ⬜ Input validation & centralized error handling (there's already an `errorHandler` middleware — deepen it: validation layer, consistent error shapes)
- ⬜ Pagination (offset vs. keyset/cursor-based, and why offset breaks down at scale) — natural fit once a product-listing endpoint exists
- ⬜ Indexing & query performance (`EXPLAIN ANALYZE`, N+1 queries) — pairs directly with pagination/listing work

**Stage 2 — Data integrity & concurrency (the core of "flash sale")**
- ⬜ Transactions & ACID (Atomicity, Consistency, Isolation, Durability — grounded in real Postgres behavior, not just definitions)
- ⬜ Optimistic vs. pessimistic concurrency control (the umbrella concept — locking mechanisms below are one way to implement pessimistic control)
- ⬜ Locking mechanisms (row locks, `SELECT ... FOR UPDATE`, advisory locks)
- ⬜ Race conditions & deadlocks (how they actually manifest in this app's flash-sale checkout, how to reproduce and fix them)
- ⬜ Isolation levels (READ COMMITTED vs. REPEATABLE READ vs. SERIALIZABLE, and what Postgres actually defaults to)

**Stage 3 — Making the checkout survive real traffic**
- ⬜ Idempotency (retried requests — network blips, double-clicks — must not double-charge or double-decrement stock)
- ⬜ Rate limiting & throttling (protect login and the flash-sale checkout endpoint from bots/hammering)
- ⬜ Caching (e.g. Redis) for hot reads (product/stock lookups) without hammering the DB every request
- ⬜ Message queues / async processing (decouple "order accepted" from slower downstream work like payment confirmation, notifications)

**Stage 4 — Production maturity**
- ⬜ Testing strategy (unit vs. integration tests — especially ones that can actually catch race conditions, since those are the bugs most likely to hide until production)
- ⬜ Observability (structured logging, metrics; there's already a bare `/health` route — grow it into real health/readiness checks)
- ⬜ Auth hardening (refresh tokens, token revocation/blacklisting — current JWT setup has no way to invalidate a token before expiry)
- ⬜ Session-based auth as a further extension after refresh tokens/blacklist land — user wants to explore JWT-in-session vs. session-in-JWT approaches, eventually moving to cookie-based sessions instead of the current header-based JWT

(This list grows as the project surfaces new needs — it isn't fixed.)

When implementing a feature that touches one of these concepts, treat it as a teaching moment first, implementation second — explain the concept against this project's actual schema/code, not in the abstract.

## Stack

- **Backend**: Node.js + Express + TypeScript + PostgreSQL (`pg`, raw SQL — no ORM). Layered as Route → Controller → Service → Repository.
- **Migrations**: `node-pg-migrate`, run via `npm run db:migrate` (backend). Migration files live in `backend/src/database/migrations/`. `dir` in `migrate.ts` is resolved via `__dirname`, not cwd.
- **Frontend**: React 19 + Vite + TypeScript. Currently just scaffold — minimal investment expected here.
- **Local DB**: PostgreSQL runs as a native Windows service (`postgresql-x64-18`) at `T:\Program\PostgreSQL`, not Docker. `psql` is not on PATH by default.

## Collaboration notes

- The user generally prefers to run commands themselves rather than have them executed automatically — explain the steps clearly and let them run it, unless they explicitly ask for something to be applied/run directly. Diagnostic, read-only checks (reading files, `tsc --noEmit`, checking versions) are fine to run directly when needed to give an accurate answer.
- Don't build ahead of what's been asked — this project deliberately grows one concept at a time. Resist adding abstractions, extra tooling, or "best practice" scaffolding that isn't yet motivated by something the user is actually learning or building.
