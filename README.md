# Agent Arena

**Ideas enter. Better ideas leave.**

A playful space where two AI perspectives challenge an idea, respond to your direction, and turn it into an editable product blueprint. Built as a functional prototype for FIG AI Design Makeathon 2026, Track 1.

![Agent Arena interface](docs/arena-home.png)

## Online edition — approval pending

This is the `online` branch. OpenAI's Sign in with ChatGPT interest form has been submitted for **sign-in and visitors' own ChatGPT plan usage**. Submission is not approval. Hosted inference and plan authorization are not implemented yet.

[Private online preview](https://agent-arena-jh-2026.bryan922.chatgpt.site) · [Application and implementation checklist](docs/HOSTED-APPROVAL.md) · [Working local edition](https://github.com/vulpes922/agent-arena/tree/local)

This edition demonstrates the authored sample, human direction, history, and editable/exportable blueprint. Its generation endpoint returns `503 approval_required`, including in development. It never invokes the developer's local Codex account. Signing into the private preview only grants site access.

For real debates today, switch to `local` and follow its setup guide. The GitHub repository remains private, so testers need an invitation or a source ZIP from the owner. `main` preserves the original prototype.

To develop this online preview with Node.js 22.13+:

```sh
npm ci
npm run dev
```

## The experience

1. **Set the mission.** Describe what you want to make and choose each agent’s role.
2. **Approve the brief.** Orbit splits your mission into questions and success criteria. Edit the mission and questions before proceeding.
3. **Opening ideas.** Spark and Anchor propose independently, without seeing each other’s opening answer.
4. **Crossfire.** Each agent challenges specific claims from the other proposal and suggests alternatives.
5. **Direct the debate.** Pin useful claims and add constraints between rounds. Each next round waits for your click.
6. **Refine.** Agents explain what they adopt, revise, defend, or concede.
7. **Take the blueprint.** Orbit synthesizes the discussion into an MVP brief. Edit it, copy it, or export Markdown.

Six perspectives are available: Visionary, Pragmatist, User advocate, Contrarian, Strategist, and Craftsperson. These are separate prompted turns, not claims of independent model identities.

In the local edition, one complete live arena uses eight Codex calls: one brief, two openings, two critiques, two revisions, and one synthesis. Team turns run concurrently, with a maximum of two active calls. Live use consumes your subscription allowance; it is not unlimited or free inference.

## Demo in 90 seconds

Select **Watch an idea evolve** for the reliable, clearly labeled Sidequest sample. Review the brief, start the opening round, pin a claim, and proceed to Crossfire. Add a direction, refine, and show the final editable blueprint.

## Development

```sh
npm test
npm run typecheck
npm run build
```

React 19, TypeScript, Vinext/Vite, and custom CSS. Avatars are original SVG artwork. Hosted builds run on a Cloudflare Worker using the Sites starter; the online branch never registers the local Codex middleware. Both `npm run dev` and `npm start` serve sample-only behavior here.

Main files:

- `app/page.tsx`: setup, round controls, intervention, history, and blueprint editor.
- `app/globals.css`: responsive interface and motion.
- `lib/debate-contract.mjs`: stage prompts, request validation, output contracts.
- `app/api/arena/status/route.ts`: explicitly reports approval pending.
- `app/api/arena/generate/route.ts`: rejects hosted generation until integration is approved and implemented.
- `scripts/codex-provider.mjs` and `scripts/vite/arena-local-plugin.mjs`: retained reference implementation, not registered in this edition.
- `lib/sample.ts`: explicitly authored walkthrough.

## Data and limits

- The most recent 12 arenas are saved in this browser’s local storage. There is no server database or cross-device sync. Export anything you want to keep.
- The online preview makes no model requests and stores no plan credentials. The local edition documents its separate inference behavior.
- The sample is fixed content. It saves director notes but does not dynamically generate a new debate for arbitrary prompts.
- This is an idea-development prototype, not a code generator. The result is a product/MVP blueprint. Agreement between agents is not evidence that a claim is true; assumptions and open questions remain visible.

## Track 1 design focus

The human-control moment is explicit: the agents propose and challenge, then pause for the director to pin a claim or introduce a constraint. The next revision shows what changed, and the human edits the final artifact. The prototype makes a multi-agent workflow understandable through named characters, distinct phases, specific rebuttals, and visible pause points.

This repository is a prototype deliverable; event submission, final pitch materials, and changing the preview’s private audience are separate steps.
