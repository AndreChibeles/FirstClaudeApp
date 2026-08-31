# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Cyberpunk 2077-styled contacts manager: Next.js 15 (App Router, TypeScript, React 19) backed by Postgres via Prisma, validated with Zod, running as three Docker Compose services (`web`, `db`, `pgadmin`).

## Commands

This app has no meaningful standalone dev mode — `web` needs `db` (and its migrations applied) to do anything, so develop through Docker Compose, not `npm run dev` directly.

```bash
cp .env.example .env               # first time only
docker compose up --build          # start web (:3000) + db (:5432) + pgadmin (:5050)
docker compose exec web npx prisma migrate dev --name <description>   # after changing prisma/schema.prisma
docker compose exec web npx prisma migrate deploy   # apply committed migrations without creating one
docker compose exec web npx prisma studio            # browse/edit data
docker compose logs web -f          # tail app logs
docker compose down                 # stop (add -v to also wipe db/pgadmin volumes)
```

`web`'s compose command already runs `prisma migrate deploy` before `npm run dev` on every start, so committed migrations apply automatically — the manual `migrate dev` step is only needed when you've changed the schema and need a new migration generated.

No test suite exists yet. `npm run lint` runs `next lint` (no custom ESLint config beyond Next's default).

To build/run the production image directly (outside Compose):
```bash
docker build --target runner -t nextjswebsite:prod .
docker run -p 3000:3000 --env DATABASE_URL=postgresql://... nextjswebsite:prod
```

## Architecture

**Data flow**: Server Components read via a shared Prisma singleton ([lib/prisma.ts](lib/prisma.ts)); writes go through Server Actions in [app/contacts/actions.ts](app/contacts/actions.ts) (`"use server"`), which validate `FormData` against the Zod schema in [lib/validations/contact.ts](lib/validations/contact.ts) — that schema is the single source of truth for "mandatory + valid email"; HTML `required` attributes on form inputs are UX sugar only, not authoritative. Actions call `revalidatePath("/")` then `redirect("/")` on success, and map Prisma's `P2002` (unique-email violation) to a friendly message.

**Forms**: [components/ContactForm.tsx](components/ContactForm.tsx) is shared between create and edit, driven by React 19's `useActionState`. Edit binds `updateContact` with `.bind(null, contact.id)`; delete ([components/DeleteButton.tsx](components/DeleteButton.tsx)) similarly binds `deleteContact` and gates the submit with `window.confirm` in a client component wrapping a plain Server Action form.

**Routing gotcha**: `app/page.tsx` (the contacts list) has `export const dynamic = "force-dynamic"` — without it, `next build` tries to statically prerender `/` and crashes because there's no `DATABASE_URL` at build time. Any new page that reads from Prisma at the top level needs the same treatment unless it's already forced dynamic (e.g. by a dynamic route segment). Dynamic route params (`app/contacts/[id]/edit/page.tsx`) are `Promise`s in Next 15 — `await params` before use.

**Docker + Prisma interplay** (the non-obvious part of the [Dockerfile](Dockerfile)):
- The `base` stage installs `openssl`/`libc6-compat` (Prisma's query engine needs them on Alpine/musl) and copies `prisma/schema.prisma` in *before* `npm install`, because the `postinstall: prisma generate` script needs a schema present at install time.
- The `runner` (production) stage manually copies `node_modules/.prisma`, `node_modules/@prisma/client`, and `prisma/` from `builder` — Next's `output: "standalone"` file tracing doesn't reliably pick up Prisma's native engine binary, so this must be done explicitly, plus `openssl`/`libc6-compat` again since this stage is what actually loads the engine at runtime.
- `docker-compose.yml`'s bind-mounts `./:/app` over the `dev` container, but `/app/node_modules` and `/app/.next` are anonymous volumes so the image's installed deps (with the generated Prisma client) survive the mount. If you rebuild the image after adding a dependency and `docker compose up` behaves as if it wasn't installed, the anonymous volume is stale — recreate with `docker compose up -d --force-recreate --renew-anon-volumes web`.
- `prisma/schema.prisma`'s `generator` block sets `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` to cover both host runs and the Alpine container.

**pgAdmin**: pre-registers a connection to the `db` service via [pgadmin/servers.json](pgadmin/servers.json) (mounted read-only), but still requires entering the Postgres password on first connect (`server_mode` is left at its default `True`, so pgAdmin also requires its own login — don't set `PGADMIN_CONFIG_SERVER_MODE: "False"`, that silently skips the login screen and was reverted once already).

**Networking**: all three services share the `app-network` bridge network and reach each other by service name (`db`, `web`, `pgadmin`), not `localhost`. `DATABASE_URL` inside the `web` container points at `db:5432`.
