# Drug API

Backend API for the Drug app. A Bun + Turborepo monorepo deployed with [SST](https://sst.dev) to AWS Lambda.

## Stack

- **Runtime:** [Bun](https://bun.sh) 1.3, Node `>=24`
- **API:** [Hono](https://hono.dev) + [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi)
- **Auth:** [Better Auth](https://www.better-auth.com) (email/password, admin, organizations)
- **Database:** Postgres via [Drizzle ORM](https://orm.drizzle.team)
- **Infra:** SST v4 (`sst.aws.Function` + `sst.aws.Router`)
- **Docs:** OpenAPI 3 + [Scalar](https://scalar.com)

## Repository

```
apps/
  api/                 Hono app (Lambda handler)
packages/
  auth/                Better Auth server + React client
  db/                  Drizzle client, schema, migrations
  infra/               SST resources, domain, origins, secrets
sst.config.ts          SST app entry
```

| Package         | Name           | Role                                                    |
| --------------- | -------------- | ------------------------------------------------------- |
| `apps/api`      | `api`          | HTTP API: CORS, errors, auth mount, OpenAPI, health     |
| `packages/auth` | `@repo/auth`   | `betterAuth` server, React client, session cookie helper |
| `packages/db`   | `@repo/db`     | Postgres client + Drizzle schema (auth tables today)    |
| `packages/infra`| `@repo/infra`  | Domain, origins, SST secrets, API Router + Lambda       |

Hosts are derived from `packages/infra/domain.ts` via `packages/infra/origins.ts`:

| Helper            | URL                                         |
| ----------------- | ------------------------------------------- |
| `appOrigin()`     | `https://{stage}.{domain}`                  |
| `apiOrigin()`     | `https://{stage}.api.{domain}`              |
| `trustedOrigins()`| app + API origins (CORS and Better Auth)    |

## Prerequisites

- [Bun](https://bun.sh) 1.3.14
- Node 24+
- AWS CLI, signed in with the profile configured in `sst.config.ts`
- A Postgres URL (SSL required) and a Better Auth secret

## Setup

```sh
bun install
bun run sso
```

Set SST secrets for each stage you use (`local`, `dev`, …):

```sh
bunx sst secret set DATABASE_URL "postgres://..." --stage local
bunx sst secret set BETTER_AUTH_SECRET "..." --stage local
```

Apply schema, then start the live AWS dev environment:

```sh
bun run db:migrate
bun run dev:local
```

The API is served through the SST Router at `https://{stage}.api.{domain}`.

## Scripts

| Script                | Description                                              |
| --------------------- | -------------------------------------------------------- |
| `bun run sso`         | AWS SSO login                                            |
| `bun run dev:local`   | `sst dev --stage local`                                  |
| `bun run deploy:dev`  | `sst deploy --stage dev`                                 |
| `bun run db:generate` | Generate Drizzle migrations                              |
| `bun run db:migrate`  | Run migrations                                           |
| `bun run db:push`     | Push schema without a migration                          |
| `bun run db:studio`   | Open Drizzle Studio                                      |
| `bun run auth:generate` | Regenerate auth tables into `packages/db/schema/auth.ts` |
| `bun run lint`        | Lint all workspaces                                      |
| `bun run check-types` | Typecheck all workspaces                                 |
| `bun run format`      | Prettier                                                 |

DB and auth scripts run inside `sst shell --stage local` so they can read linked secrets.

## API

Lambda entry: `apps/api/src/lambda.ts` → `apps/api/src/app.ts`.

| Method     | Path              | Description                       |
| ---------- | ----------------- | --------------------------------- |
| `GET`      | `/api/health`     | Liveness (`{ ok: true }`)         |
| `GET/POST` | `/api/auth/*`     | Better Auth (sign-in, session, …) |
| `GET`      | `/doc`            | OpenAPI JSON (app routes)         |
| `GET`      | `/reference`      | Scalar UI (Auth + App specs)      |

Auth OpenAPI is also at `/api/auth/open-api/generate-schema`.

CORS allows `trustedOrigins()` only (stage app + API hosts) and sends credentials. Every response sets `Cache-Control: no-store`.

Errors use a consistent envelope:

```json
{ "ok": false, "errors": [{ "message": "...", "source": "validation|not_found|server" }] }
```

Validation failures return `422`. On `production`, unhandled 500s hide the exception message.

### Adding a route

1. Create `apps/api/src/routes/<name>/{routes,handlers,index}.ts` with `createRoute` + a handler.
2. Mount it from `apps/api/src/app.ts` (same pattern as `health`).

## Auth

Configured in `packages/auth/server.ts`.

- **Base URL:** `apiOrigin()` — `https://{stage}.api.{domain}`
- **Trusted origins:** `trustedOrigins()` (app + API)
- **Email + password** enabled; **sign-up is disabled**
- Plugins: admin, organization, OpenAPI, last-login method, multi-session, Next.js cookies
- Cookies: `{domain}-{stage}` prefix, `Secure` + `SameSite=Lax`, shared across `*.{domain}`
- Client: `@repo/auth/client` (`authReactClient`) talks to `apiOrigin()`

After changing Better Auth options that affect the schema:

```sh
bun run auth:generate
bun run db:generate
bun run db:migrate
```

## Database

`packages/db` uses Drizzle against `Resource.DATABASE_URL` with `ssl: "require"`. Schema lives in `packages/db/schema/` and currently exports Better Auth tables (`user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`).

Tables matching `mastra_*` are ignored by Drizzle Kit so an external store can share the same database.

## Infrastructure

`sst.config.ts` loads `packages/infra/secrets` then `packages/infra/api`.

| Resource             | Type               | Notes                                                              |
| -------------------- | ------------------ | ------------------------------------------------------------------ |
| `DATABASE_URL`       | `sst.Secret`       | Postgres connection string                                         |
| `BETTER_AUTH_SECRET` | `sst.Secret`       | Better Auth signing secret                                         |
| `ApiRouter`          | `sst.aws.Router`   | `{stage}.api.{domain}`, OAC + edge signing, WAF 200 req/IP         |
| `Hono`               | `sst.aws.Function` | Handler `apps/api/src/lambda.handler`, linked to both secrets      |

The Router is configured not to cache (TTL 0, nothing in the cache key). WAF logs blocked requests only.

AWS account, profile, and region live in `sst.config.ts`. Domain lives in `packages/infra/domain.ts`.

| Stage        | Removal | Protect |
| ------------ | ------- | ------- |
| `local`      | remove  | no      |
| `dev`        | remove  | no      |
| `production` | retain  | yes     |
