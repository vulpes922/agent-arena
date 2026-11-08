# Try Agent Arena on your own computer

This is the `local` branch. It runs live debates using the Codex CLI signed in on **your** computer. It does not use the author's account, a shared API key, or a remote agent server.

## First run

Install Node.js 22.13 or later, then:

```sh
git clone --branch local https://github.com/vulpes922/agent-arena.git
cd agent-arena
npm ci
npm run local
```

The repository is private. You need an invitation from its owner to clone it. If the owner sends you a source ZIP instead, extract it and run the final two commands from the extracted folder.

The launcher checks dependencies and sign-in. If needed, the official Codex CLI opens its ChatGPT login in your browser. Complete that login yourself, return to the terminal, and open the local URL it prints. No passwords or API keys are entered into Agent Arena.

On a Mac, after installing dependencies, double-click `start-local.command`. On Windows and Linux, use `npm run local`. Keep the terminal running; press Ctrl+C when done.

## Your first product idea

1. Open Agent settings to choose Spark and Anchor's perspectives and models.
2. Enter what you want to make.
3. Watch the agents reply to each other in the conversation.
4. Pause anytime, or send a direction to pause and steer the next reply.
5. Continue the same conversation for another six replies.
6. Ask Orbit to summarize, or export the entire discussion.

The result is a product direction. Agent Arena does not automatically implement or deploy that product. Replies appear as each model call completes, rather than token by token. Your original staged arenas remain available at `/classic`.

## Which account is used?

The launcher reuses the Codex account already signed in on your computer. If this is a shared computer, check the CLI account before starting. To deliberately change that shared Codex login, run `npx codex logout`, then `npx codex login`. Logging out affects other Codex CLI use on that computer too; Agent Arena never does it automatically.

Eligible account access and remaining Codex usage are required. Each reply uses one model call. Agents take turns, with up to six replies per run before an automatic pause. Continue to allow another six. Ask Orbit uses one additional call.

## Troubleshooting

- Run `npm run doctor` to check your runtime, installed dependencies, and login without starting a debate.
- If sign-in cannot open a browser, run `npx codex login --device-auth`, complete the official device flow, then retry.
- If a model is unavailable, open Agent settings and choose a model available to your account. Blank values use your configured Codex model.
- If you only want to look around, use `npm run dev` and select the authored sample. It uses no model calls.
- Arenas are saved in this browser on this machine. Export important results. There is no cloud backup or project sharing.

## Branches

- `local`: working local inference and tester onboarding.
- `online`: hosted preview and the application for visitors to authorize their own ChatGPT plans. Hosted inference remains unavailable until approved and implemented.
- `main`: the original tested prototype baseline.
