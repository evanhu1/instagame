# Repository Guidelines

## Project Structure & Module Organization
`src/` holds the whole API. `src/server.js` starts the process, `src/app.js` wires Express, `src/routes/` defines endpoints, `src/services/` wraps Gemini and media generation, `src/db/` handles schema and queries, and `src/utils/` contains shared helpers. Local files live in `storage/`, with generated assets in `storage/generated/` and uploaded source images in `storage/uploads/source/`.

## Build, Test, and Development Commands
Run `npm install` once. Use `npm run dev` for local development with file watching, `npm start` for a normal run, and `npm run check` for a quick module-load sanity check before submitting changes. There is no separate build step.

## Coding Style & Naming Conventions
The project uses ESM, two-space indentation, semicolons, and single quotes. Use `camelCase` for variables and functions, `PascalCase` for classes, and descriptive file names like `storyRepository.js`. Keep route handlers thin; move persistence into `src/db/` and external-service logic into `src/services/`.

## Testing Guidelines
There is no automated test suite yet. At minimum, run `npm run check` and manually smoke-test any changed endpoint against local MySQL. If you add tests, use `*.test.js` and focus first on route validation, database transactions, and Gemini response parsing.

## Commit & Pull Request Guidelines
This branch does not have established commit history yet, so use short imperative subjects like `Add story deletion rollback`. Keep commits focused. PRs should include a short summary, manual verification steps, and sample request or response payloads when an endpoint changes.

## Security & Configuration Tips
Copy `.env.example` to `.env` and set `MYSQL_*` and `GEMINI_*` before running locally. Do not commit `.env`, generated files, or uploaded source images. Treat files under `storage/uploads/source/` as user input and validate them before reuse.
