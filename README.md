# Church Nominations App

Minimal local-development foundation for the React + TypeScript web app and Java/Spring Boot REST API. The health-only API is stateless and does not require PostgreSQL.

## Prerequisites

- Node.js 20 LTS and npm 10 or newer
- JDK 25 LTS or newer
- The API Gradle Wrapper is included; no global Gradle installation is needed

PostgreSQL is an approved architectural choice, but is not used by this health endpoint and is intentionally not configured or included as a dependency.

## Configuration

Frontend: copy `apps/web/.env.example` to `apps/web/.env.local` and set `VITE_API_BASE_URL` if the API is not at `http://localhost:8080`.

Backend: set `CORS_ALLOWED_ORIGIN` if the frontend is not at `http://localhost:5173`. The default allows only that local origin. Do not put secrets in frontend environment variables; Vite exposes them to the browser.

## Run locally

In one terminal, start the API:

```sh
cd apps/api
./gradlew bootRun
```

In another terminal, install frontend dependencies and start Vite:

```sh
cd apps/web
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). The API health endpoint is `http://localhost:8080/api/health` and returns `{"status":"ok"}`.

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
