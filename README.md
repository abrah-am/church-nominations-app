# Church Nominations App

Local-development foundation for the React + TypeScript web app and Java/Spring Boot REST API. The API persists church-scoped election setup in PostgreSQL.

## Code Map

The repository separates the applications under `apps/`: `apps/web` contains the React client, and `apps/api` contains the Spring Boot API and database migrations. Within those applications, code is organized by feature/domain so contributors can work in a focused area.

### Web (`apps/web/src`)

- `App.tsx` composes routes, authenticated session state, and top-level navigation.
- `features/auth` contains sign-in and registration UI.
- `features/elections` contains election setup forms and candidate recommendation rules.
- `features/nominations` contains admin intake/consolidation and the public nomination form.
- `features/voting` contains the public ballot experience.
- `features/boards` contains annual board and attendance screens.
- `api` contains typed HTTP clients and their focused API tests, grouped by domain.
- `styles.css` contains shared application styles; `App.test.tsx` covers cross-feature workflows.

### API (`apps/api/src/main/java/org/churchnominations/api`)

- `identity`, `church`, `board`, and `nominations` contain their respective domain workflows.
- `election` contains election and position setup, plus shared election ownership/context.
- `election/voting` contains voting-round lifecycle, private ballot submission, results, and candidate decisions.
- `config` contains security, CORS, and application configuration; `health` contains the health endpoint.
- `src/main/resources/db/migration` contains ordered Flyway migrations.
- Tests live under `apps/api/src/test/java` and are grouped by domain and integration scenario.

When changing a workflow, start in its feature/domain folder, then follow imports to shared API or persistence contracts. Run the focused test first, followed by the application-wide checks below.

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
export JAVA_HOME="/path/to/jdk-25/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
./gradlew -Dorg.gradle.java.installations.paths="$JAVA_HOME" devBootRun
```

Replace the `JAVA_HOME` example with the JDK 25 installation directory on your machine. Gradle must be able to discover this installation as its Java 25 toolchain. On macOS, a JDK installed in a standard system location can be located with `/usr/libexec/java_home -v 25`; for a JDK installed elsewhere, use its `Contents/Home` directory. For example, if your JDK is under `~/.jdk`, set `JAVA_HOME` to that installation's `Contents/Home` path.

`devBootRun` enables local HTTP Basic authentication backed by registered email/password accounts and binds the API to loopback only. The `bootRun` task does not enable local authentication; business endpoints remain denied outside the `dev` profile. Set `CORS_ALLOWED_ORIGIN` if the frontend is not at `http://localhost:5173`. Do not put secrets in frontend environment variables; Vite exposes them to the browser. The POC does not yet send password-reset email.

## Run locally

In one terminal, start the API:

```sh
cd apps/api
set -a
. ./.env
set +a
export JAVA_HOME="/path/to/jdk-25/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
./gradlew -Dorg.gradle.java.installations.paths="$JAVA_HOME" devBootRun
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
