# Next.js + Postgres + pgAdmin (Dockerized)

Local development infrastructure for a Next.js application backed by
Postgres, fully orchestrated with Docker Compose. Three containers:

| Service   | Image                  | Purpose                          | Default URL             |
|-----------|-------------------------|-----------------------------------|--------------------------|
| `web`     | built from `Dockerfile` | Next.js app                       | http://localhost:3000    |
| `db`      | `postgres:16-alpine`    | Postgres database                 | localhost:5432 (psql)    |
| `pgadmin` | `dpage/pgadmin4`        | Web UI for administering Postgres | http://localhost:5050    |

## Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)

## Setup

1. Copy the environment template and adjust values as needed:

   ```bash
   cp .env.example .env
   ```

2. Build and start all three containers:

   ```bash
   docker compose up --build
   ```

3. Once running:
   - Next.js app: [http://localhost:3000](http://localhost:3000)
   - Health check (verifies the app can reach Postgres): [http://localhost:3000/api/health](http://localhost:3000/api/health)
   - pgAdmin: [http://localhost:5050](http://localhost:5050)
     - Log in with `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD` from `.env`.
     - A server named **Docker Postgres** is pre-registered (see `pgadmin/servers.json`). On first connection you'll be prompted for the Postgres password — use `POSTGRES_PASSWORD` from `.env`.

4. Stop everything:

   ```bash
   docker compose down
   ```

   Add `-v` to also delete the Postgres/pgAdmin data volumes:

   ```bash
   docker compose down -v
   ```

## How it fits together

- All three services share a single Docker network (`app-network`) defined
  in [docker-compose.yml](docker-compose.yml), so containers reach each
  other by service name (`db`, `web`, `pgadmin`) rather than `localhost`.
- The `web` container talks to Postgres using `DATABASE_URL`, which points
  at the `db` service's hostname on the internal network:
  ```
  postgresql://<user>:<password>@db:5432/<database>
  ```
- `web` waits for `db` to report healthy (via a `pg_isready` healthcheck)
  before starting.
- Postgres data persists in the named volume `postgres_data`; pgAdmin's own
  settings persist in `pgadmin_data`. Both survive `docker compose down`
  (removed only with `down -v`).

## Project layout

```
.
├── app/                  # Next.js App Router pages/routes
│   ├── api/health/       # DB connectivity check (GET /api/health)
│   ├── layout.tsx
│   └── page.tsx
├── lib/db.ts             # Shared `pg` connection pool (reads DATABASE_URL)
├── pgadmin/servers.json  # Pre-registers the Postgres connection in pgAdmin
├── Dockerfile            # Multi-stage build: dev / builder / runner
├── docker-compose.yml    # web + db + pgadmin orchestration
├── .env.example          # Template for required environment variables
└── .dockerignore
```

## Dockerfile stages

The [Dockerfile](Dockerfile) is multi-stage:

- **`base`** – installs npm dependencies, shared by other stages.
- **`dev`** – used by `docker-compose.yml` for local development. The
  project directory is bind-mounted into the container so `next dev`
  hot-reloads on file changes.
- **`builder`** – runs `next build` (production build, `output: "standalone"`).
- **`runner`** – final production image: copies only the standalone build
  output, runs as a non-root user, no dev dependencies or source included.

To build and run the production image directly (outside Compose, or when
deploying):

```bash
docker build -t nextjswebsite:prod .
docker run -p 3000:3000 --env DATABASE_URL=postgresql://... nextjswebsite:prod
```

(`docker build` with no `--target` builds through to the last stage,
`runner`.) For a production Compose setup, add an override file that sets
`build.target: runner` on the `web` service and drops the bind-mount
volumes.

## Environment variables

Defined in `.env` (see `.env.example` for defaults):

| Variable                  | Used by         | Description                                  |
|----------------------------|-----------------|-----------------------------------------------|
| `POSTGRES_USER`            | `db`, `web`     | Postgres superuser/app user                   |
| `POSTGRES_PASSWORD`        | `db`, `web`     | Postgres password                             |
| `POSTGRES_DB`              | `db`, `web`     | Database name created on first boot           |
| `POSTGRES_PORT`            | `db`            | Host port mapped to Postgres's `5432`         |
| `DATABASE_URL`             | `web`           | Full connection string used by the app        |
| `WEB_PORT`                 | `web`           | Host port mapped to the Next.js app's `3000`  |
| `PGADMIN_DEFAULT_EMAIL`    | `pgadmin`       | Login email for the pgAdmin UI                |
| `PGADMIN_DEFAULT_PASSWORD` | `pgadmin`       | Login password for the pgAdmin UI             |
| `PGADMIN_PORT`             | `pgadmin`       | Host port mapped to pgAdmin's internal `80`   |

`.env` is git-ignored — never commit real credentials. Change all default
passwords before using this outside of local development.

## Local development without Docker (optional)

```bash
npm install
npm run dev
```

Requires a reachable Postgres instance and a `DATABASE_URL` in your shell
environment or a `.env.local` file.