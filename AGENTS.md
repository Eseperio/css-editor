# Repository Guidelines

## Project Structure & Module Organization
- Source lives in `src/` (TypeScript). Key modules: `editor-panel.ts` (UI), `element-picker.ts` (DOM selection), `selector-generator.ts` (unique selectors), `property-inputs.ts` and `css-properties.ts` (property metadata), `index.ts` entry.
- Bundled outputs land in `dist/` (`css-editor.js`, `css-editor.esm.js`, `css-editor.d.ts`). Do not edit generated files directly.
- `example/` hosts a demo page; use it for manual QA. `server.js` starts the local demo server.

## Build, Test, and Development Commands
- `npm install` to fetch dependencies.
- `npm run build` runs `tsc` then Rollup, emitting updated bundles in `dist/`.
- `npm run dev` starts Rollup in watch mode for fast iteration.
- `npm test` currently returns success with a placeholder; add real tests before relying on it.
- `node server.js` serves the example for interactive testing (defaults to http://localhost:3000).

## Coding Style & Naming Conventions
- TypeScript with ES modules; favor explicit types on public APIs.
- Use 2-space indentation, single quotes, and trailing commas where arrays/objects span lines.
- Prefer descriptive file- and class-level names aligned with UI features (e.g., `*-panel`, `*-picker`).
- Keep DOM selectors and CSS class names kebab-case; exported symbols in camelCase/PascalCase.

## Testing Guidelines
- Add unit tests alongside source (e.g., `src/__tests__/selector-generator.test.ts`) using your preferred TS-compatible test runner (Vitest/Jest acceptable).
- Test names: `feature.behavior` (e.g., `selectorGenerator.returnsMostSpecific`).
- For UI changes, exercise flows via the `example/` page and note manual steps in the PR.

## Commit & Pull Request Guidelines
- Commits: short imperative subject, scoped by area when useful (e.g., `picker: highlight hovered element`). Group related changes; avoid noisy churn in `dist/` unless releasing.
- PRs: include a concise summary, screenshots/GIFs for UI shifts, steps to reproduce/verify, and linked issues. Mention impacts on API surface or bundle size when applicable.

## Security & Configuration Tips
- Avoid loading remote assets in the example page; keep demos self-contained.
- Do not check in secrets; configuration lives in code or env vars consumed by `server.js` when extending backend features.
