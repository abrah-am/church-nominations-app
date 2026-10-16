# Church Nominations App

Local-development foundation for the React + TypeScript web app and Java/Spring Boot REST API. The API persists church-scoped election setup in PostgreSQL.

## Prerequisites

- Node.js 20 LTS and npm 10 or newer
- JDK 25 LTS or newer
- The API Gradle Wrapper is included; no global Gradle installation is needed
- Docker with Compose support

Compose runs PostgreSQL 16 locally. The API uses Flyway migrations at startup and applies them automatically to the development database.

## Configuration

Frontend: copy `apps/web/.env.example` to `apps/web/.env.local` and set `VITE_API_BASE_URL` if the API is not at `http://localhost:8080`.

Backend and database environment for local development: copy `apps/api/.env.example` to `apps/api/.env`, replace the sample local passwords, then start PostgreSQL from `apps/api` on local port `5433`:

```sh
cd apps/api
cp .env.example .env
${EDITOR:-vi} .env
docker compose up -d
```

The Compose database uses PostgreSQL 16, binds only to `127.0.0.1:5433`, reports readiness, and keeps data in a named volume. Flyway applies schema migrations when the API starts. To launch the API with the same environment, in the `apps/api` directory run:

```sh
set -a
. ./.env
set +a
./gradlew devBootRun
```

`devBootRun` enables local HTTP Basic authentication backed by registered email/password accounts and binds the API to loopback only. The `bootRun` task does not enable local authentication; business endpoints remain denied outside the `dev` profile. Set `CORS_ALLOWED_ORIGIN` if the frontend is not at `http://localhost:5173`. Do not put secrets in frontend environment variables; Vite exposes them to the browser. The POC does not yet send password-reset email.

## Run locally

In one terminal, start the API:

```sh
cd apps/api
./gradlew devBootRun
```

In another terminal, install frontend dependencies and start Vite:

```sh
cd apps/web
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). Create an account using your email and a password, sign in, and register your church; the account that creates the church becomes its administrator. Then configure elections for that church. Passwords are BCrypt-hashed in PostgreSQL. The API health endpoint is `http://localhost:8080/api/health` and returns `{"status":"ok"}`.

## Checks

```sh
# Frontend, from apps/web
npm run lint
npm test
npm run build

# Backend, from apps/api
./gradlew test
./gradlew bootJar
```

Stop the local database with `docker compose down` from `apps/api`; its named volume is retained. To permanently reset local database data, use `docker compose down --volumes` from `apps/api`.
