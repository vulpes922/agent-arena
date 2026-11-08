# Agent Arena · online edition

A minimal two-sided debate: **Visionary** and **Pragmatist** debate from their selected perspectives, shown in blue and orange. The selected perspective is the participant name; neither side has a fixed defender or challenger assignment. A neutral **Moderator** brings both sides together. The online and local branches share the same conversation interface.

[Private online preview](https://agent-arena-jh-2026.bryan922.chatgpt.site) · [Working local edition](https://github.com/vulpes922/agent-arena/tree/local) · [Hosted access application](docs/HOSTED-APPROVAL.md)

## Approval pending

OpenAI's interest form has been submitted for sign-in and visitors' own ChatGPT plan usage. Submission is not approval. This branch plays a clearly labeled authored sample. Its generation endpoint returns `503 approval_required` in both development and production. It does not load local Codex middleware or use the developer's account. Signing into the private preview grants site access only.

Play the sample to see alternating replies, pause/continue, human direction, a moderator recap, saved browser history, and Markdown export. Sample responses are fixed: notes are saved but do not alter the replies. Model controls are visible but disabled until hosted access is approved and integrated. For live debates and per-agent models today, use the `local` branch with your own Codex account.

Both the repository and hosted preview remain private; testing access requires an invitation.

## Development

Requires Node.js 22.13+.

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

- `app/page.tsx` and `app/conversation.css`: shared minimal debate interface.
- `lib/edition.ts`: online execution capability; the local branch sets `online: false`.
- `lib/conversation.mjs`: sequential conversation runner and transcript export.
- `lib/conversation-sample.ts`: authored demonstration.
- `app/api/arena/status/route.ts`: approval status.
- `app/api/arena/generate/route.ts`: explicit generation gate.

The last 12 conversations are saved in this browser. There is no server history or cross-device sync. The output is a discussion and product direction, not an automatically built application. Agent agreement is not factual verification.

Keep shared interface files synchronized with `local`. Preserve the online-only API gate, Vite configuration, edition setting, and approval documentation when merging updates. Internal speaker IDs remain stable so saved conversations continue to load under the new display names.

Participant names follow the selected perspectives. Blue and orange distinguish the two sides; either side can propose, challenge, or concede. The authored sample uses Visionary and Pragmatist.
