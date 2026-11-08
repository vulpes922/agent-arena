# Agent Arena

**Two AI perspectives. One moderator. You set the direction.**

Describe something you want to make, watch two agents debate it, and jump in to steer the conversation. Visionary and Pragmatist are the default perspectives; each side and the Moderator can use a separate model in the local edition.

![Agent Arena: two sides and a moderator](docs/screenshots/overview.jpg)

[Mac & Windows setup](docs/SETUP.md) · [User guide](docs/USER-GUIDE.md) · [Development](docs/DEVELOPMENT.md)

## Choose your edition

| Edition | What works today |
| --- | --- |
| [Local](https://github.com/vulpes922/agent-arena/tree/local) | Live conversations using your own Codex login, per-agent models, human direction, moderator recaps, history, and export. |
| [Online](https://github.com/vulpes922/agent-arena/tree/online) | The same minimal interface with an authored sample. Hosted ChatGPT-plan access is pending approval and implementation. |
| `main` | Original prototype code baseline, with this documentation pointing to the current editions. |

The repository is private; accept an invitation before cloning. The [online preview](https://agent-arena-jh-2026.bryan922.chatgpt.site) also requires access. Site sign-in does not enable live AI.

## Quick start: local edition

Requires **Node.js 24 LTS recommended (minimum 22.13)**, npm, Git, and your own ChatGPT account with Codex access and available usage. On Windows, run these commands **inside WSL 2/Ubuntu**. Native PowerShell execution is not currently supported by this prototype's agent runner.

```sh
git clone --branch local https://github.com/vulpes922/agent-arena.git
cd agent-arena
npm ci
npm run local
```

Complete the official Codex sign-in if prompted, then open the local URL printed by the terminal, normally `http://127.0.0.1:5173`. Keep the terminal running. No API key is required for ChatGPT sign-in, and the project installs its own Codex CLI.

**New to the tools?** Follow the [step-by-step setup guide](docs/SETUP.md) for Mac or Windows, prerequisites, ZIP download, account selection, and troubleshooting. macOS has been exercised locally; the WSL instructions have not been tested end to end on Windows.

To explore without a model account, run `npm run dev` after installing dependencies and choose **Try a sample**.

## How it works

1. Choose two perspectives and optionally a model for each participant in **Agent settings**.
2. Enter your idea. The two agents respond in turn, with replies appearing when each model call finishes.
3. **Pause** or add your own direction. **Continue** resumes the same conversation, up to six replies per run.
4. **Ask moderator** for a recap, then continue refining or **Export conversation** as Markdown.

<details>
<summary>See a complete sample debate and moderator recap</summary>

![Authored sample debate with moderator recap](docs/screenshots/debate.jpg)

</details>

*Actual screenshot of the authored sample. Sample replies are fixed, use no model calls, and do not adapt to your notes.*

Each live reply uses your signed-in account's usage. The last 12 conversations are saved in the current browser; there is no cloud sync. The output is a discussion and product direction, not an automatically implemented application. Read the [user guide](docs/USER-GUIDE.md) for model selection, context limits, privacy, and controls.

## Contributing

Use `local` for local inference work and `online` for the hosted preview. Preserve the online approval gate when synchronizing UI changes. See [development notes](docs/DEVELOPMENT.md) for commands, architecture, and checks.
