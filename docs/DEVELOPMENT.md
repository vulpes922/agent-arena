# Development notes

[Overview](../README.md) · [Setup](SETUP.md) · [User guide](USER-GUIDE.md)

## Choose a branch

| Branch | Purpose |
| --- | --- |
| `local` | Current conversation UI with local Codex inference and tester onboarding. |
| `online` | Same conversation UI with a hosted approval gate and an authored sample. |
| `main` | Original implementation baseline; its README and guides point to the current editions. |

Run the current local application from `local`, not `main`. Work in separate checkouts/worktrees if you maintain both editions. The guides in this directory describe current `local`/`online` behavior, not the older baseline's scripts.

## Local commands

Use Node.js 24 LTS and run `npm ci` first. These commands target the `local` branch:

| Command | Purpose |
| --- | --- |
| `npm run local` | Check dependencies/login, prompt for sign-in when needed, and start local development. |
| `npm run doctor` | Check runtime, dependencies, and CLI login; no debate or model request. |
| `npm run dev` | Start the development server without the login wizard; useful for sample mode. |
| `npm test` | Run the Node test suite. |
| `npm run typecheck` | Check TypeScript. |
| `npm run build` | Build the production bundle. |
| `npm start` | Preview an existing production build without local Codex inference. |

For `online` development, use `npm ci` followed by `npm run dev`. It serves the authored sample and retains the hosted inference gate. Do not use the local sign-in launcher as a way to enable online inference.

## Architecture

The UI uses React 19 and TypeScript through Vinext/Vite. The local development server provides the Codex middleware. A static or production build alone cannot use a visitor's local Codex account.

| File | Responsibility |
| --- | --- |
| `app/page.tsx` | Conversation interface, settings, browser history, human direction. |
| `app/conversation.css` | Minimal two-sided conversation layout. |
| `lib/conversation.mjs` | Sequential turn runner, next speaker, transcript export. |
| `lib/conversation-contract.mjs` | Context limits and model prompts. |
| `lib/conversation-sample.ts` | Authored sample content. |
| `lib/edition.ts` | Edition capability setting. |
| `scripts/start-local.mjs` | Dependency/login checks and local launcher. |
| `scripts/codex-provider.mjs` | CLI account status, model suggestions, cancellable model calls. |
| `app/classic/page.tsx` | Preserved original staged prototype on local. |

Internal speaker IDs `spark` and `anchor` remain stable for saved-conversation compatibility. Display names and behavior follow the selected perspectives. Do not rename stored IDs solely to change interface labels.

The online generation endpoint returns `503 approval_required`; its Vite configuration does not load local Codex middleware. Keep this gate, online API routes, edition setting, and approval documentation intact when synchronizing shared UI changes. See the [online approval record](https://github.com/vulpes922/agent-arena/blob/online/docs/HOSTED-APPROVAL.md).

## Optional local environment defaults

| Variable | Purpose |
| --- | --- |
| `ARENA_CODEX_BIN` | Override the Codex executable used by the provider. Normally use the installed project CLI. |
| `ARENA_TEAM_MODEL` | Default model for both debating agents when no explicit UI model is selected. |
| `ARENA_MODERATOR_MODEL` | Default model for moderator requests when no explicit UI model is selected. |

An explicit UI model wins over these model defaults. Otherwise the provider falls back to local model configuration and ultimately the CLI default. Choose exact model IDs available to your account; model availability is not hardcoded as a promise. The onboarding login check still uses the project CLI, so a custom provider executable must use a compatible login environment.

## Checks and screenshots

Before shipping a code change, run the applicable checks:

```sh
npm test
npm run typecheck
npm run build
```

For documentation-only changes, check relative links, screenshots, command accuracy, and `git diff --check`; a new model call is unnecessary.

Screenshots in `docs/screenshots/` were captured from the running local UI on November 8, 2026. `overview.jpg` shows the initial screen; `debate.jpg` shows the authored sample and moderator recap. They are actual browser captures, not generated mockups. Older screenshots elsewhere in `docs/` may depict earlier iterations.
