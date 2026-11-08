# Run Agent Arena on your computer

This guide targets the **`local` branch**. It runs the conversation in your browser and uses the official Codex CLI on your computer for live replies.

[Overview](../README.md) · [User guide](USER-GUIDE.md) · [Development](DEVELOPMENT.md)

## Before you begin

| Requirement | What you need |
| --- | --- |
| Repository access | An invitation to this private GitHub repository, accepted on your own GitHub account. |
| Operating system | macOS, or Windows with WSL 2 and Ubuntu. Native PowerShell execution is not currently supported by this prototype's agent runner. |
| Node.js and npm | Node.js **24 LTS recommended**; minimum **22.13**. npm comes with Node.js. |
| Source download | Git, or a ZIP downloaded from the repository's `local` branch. |
| Browser | A modern browser such as Chrome, Edge, Firefox, or Safari. |
| Live AI | Your own ChatGPT account with Codex access and remaining usage. Select ChatGPT sign-in in the official CLI. |
| Network | Internet access for dependency installation, account sign-in, and live model calls. |

You do not need an API key for the ChatGPT sign-in route, a globally installed Codex CLI, the Codex desktop app, Docker, a database, or a GPU. The project installs its own Codex CLI dependency. Sample mode needs no model account.

**Verification:** the local app has been exercised on macOS with Node.js 24.22.1. The Windows/WSL instructions were reviewed against official setup documentation but have not been tested end to end on Windows. The Windows limitation is in Agent Arena's CLI process wrapper, not a statement about Codex's own Windows support.

## macOS

### 1. Install Node.js and Git

Download the **Node.js 24 LTS macOS installer** from [nodejs.org](https://nodejs.org/en/download), install it, and open a new Terminal window. Check:

```sh
node --version
npm --version
git --version
```

If Git is missing, install Apple's Command Line Tools and finish the installation dialog:

```sh
xcode-select --install
```

This is one of the installation routes in the [official Git macOS guide](https://git-scm.com/install/mac). Reopen Terminal and check `git --version` again.

### 2. Download the local edition

```sh
mkdir -p ~/Projects
cd ~/Projects
git clone --branch local https://github.com/vulpes922/agent-arena.git
cd agent-arena
```

If GitHub rejects the clone, check that you accepted your repository invitation and that Git is authenticated to that account. Alternatively, use the [ZIP download route](#download-without-git).

### 3. Install and start

```sh
npm ci
npm run local
```

The first command installs dependencies from the lockfile. Include development and optional dependencies: the app needs them to run locally.

The launcher checks your Codex login and starts sign-in if needed. Complete the official browser sign-in with **your own ChatGPT account**. Return to Terminal and open the URL it prints, normally:

```text
http://127.0.0.1:5173
```

Keep Terminal running while you use the app. See [sign-in help](#sign-in-and-account-selection) if the browser flow does not finish.

### 4. Start it again later

```sh
cd ~/Projects/agent-arena
npm run local
```

After the first dependency installation, you can also double-click `start-local.command` in Finder. If macOS prevents the launcher from opening, use the Terminal command above. The double-click launcher still requires a usable Node installation and installed project dependencies.

Press **Ctrl+C** in the server terminal to stop the app.

## Windows: WSL 2 + Ubuntu

Use the Linux environment inside WSL for Node, Git, dependencies, and the app. Installing Node only on Windows is not sufficient for this route.

### 1. Install WSL

On Windows 11, or supported Windows 10 version 2004/build 19041 or later, open **PowerShell as Administrator** and run:

```powershell
wsl --install -d Ubuntu
```

Restart Windows if prompted. Open **Ubuntu** from the Start menu and finish creating its Linux username and password. In PowerShell, you can check the installation with:

```powershell
wsl --list --verbose
```

Ubuntu should show version **2**. For prerequisites, existing installations, or installation errors, use [Microsoft's WSL installation guide](https://learn.microsoft.com/en-us/windows/wsl/install).

### 2. Install tools inside Ubuntu

**Run all commands below in the Ubuntu terminal, not PowerShell.**

```sh
sudo apt update
sudo apt install -y git curl ca-certificates
```

Install nvm using the installer in the [official nvm installation instructions](https://github.com/nvm-sh/nvm#installing-and-updating). Reopen Ubuntu after installing nvm, then run:

```sh
nvm install 24
nvm use 24
nvm alias default 24
node --version
npm --version
node -p "process.platform"
```

The platform check must print **`linux`**. If it prints `win32`, your terminal is finding a Windows Node installation; correct your Ubuntu Node/nvm setup before continuing.

### 3. Download and start Agent Arena

Keep the project in your Linux home folder, as shown below. Do not reuse `node_modules` from a Windows or Mac installation.

```sh
mkdir -p ~/projects
cd ~/projects
git clone --branch local https://github.com/vulpes922/agent-arena.git
cd agent-arena
npm ci
npm run local
```

Authenticate Git to your invited GitHub account if the private clone fails, or use the ZIP option below. Complete Codex sign-in when prompted. A login completed in a Windows Codex installation may not be available to the separate Ubuntu environment.

Open the printed local URL in your **Windows browser**, normally `http://127.0.0.1:5173`. Windows normally forwards localhost connections to WSL applications; see [Microsoft's WSL networking guide](https://learn.microsoft.com/en-us/windows/wsl/networking) if it does not connect. Keep the Ubuntu terminal open. Do not expose the development server publicly to work around a connection problem.

### 4. Restart later

Open Ubuntu:

```sh
cd ~/projects/agent-arena
npm run local
```

Stop with **Ctrl+C** in Ubuntu. Native Windows/PowerShell app execution is not currently validated: the provider launches the Codex executable using Unix-style process assumptions. Use WSL for the live prototype.

## Download without Git

1. Sign into GitHub with your invited account.
2. Open the [local branch](https://github.com/vulpes922/agent-arena/tree/local).
3. Choose **Code → Download ZIP** and extract it.
4. Open a terminal in the extracted folder containing `package.json`.
5. Run `npm ci`, then `npm run local`.

On Windows, use Ubuntu for these commands and extract/copy the source into your Linux home directory before installing dependencies. A ZIP from the default `main` branch contains the original baseline, so explicitly select `local`. ZIP checkouts cannot use `git pull`; download a fresh local-branch ZIP to update.

## Sign-in and account selection

The launcher reuses the CLI's existing login. Check it from the project directory:

```sh
npx codex login status
npm run doctor
```

For ChatGPT-plan usage, use **ChatGPT sign-in**, not API-key authentication. An existing API-key login is a different billing route. To deliberately switch the shared CLI account:

```sh
npx codex logout
npx codex login
```

Logging out also affects other Codex CLI use in that environment. Agent Arena never logs you out automatically.

If the browser does not open, follow the URL printed by Codex. If the browser callback cannot complete, try:

```sh
npx codex login --device-auth
```

Device sign-in availability depends on your account/workspace settings. Follow the official instructions displayed by Codex. Never paste credentials into the app, commit them to Git, or share them with another tester. See [OpenAI's CLI authentication guide](https://learn.chatgpt.com/docs/auth?surface=cli).

## Try the interface without live AI

After `npm ci`, run:

```sh
npm run dev
```

Open the local URL and select **Try a sample**. The sample is authored, uses no model calls, and does not adapt its replies to your notes. `npm run local` performs login checks; `npm run dev` skips that onboarding step.

## Update an existing checkout

Stop the server with Ctrl+C. From your `local` checkout:

```sh
git status
git branch --show-current
git pull --ff-only origin local
npm ci
npm run local
```

The branch check should print `local`. If you have uncommitted edits or Git reports divergent history, preserve your work before resolving the update. Do not reset your checkout just to follow this guide.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `node` or `npm` not found | Install Node 24 LTS; reopen the terminal. On WSL, install it inside Ubuntu. |
| Unsupported Node version | Check `node --version`; minimum is 22.13. Use Node 24 LTS for the documented setup. |
| `Repository not found` / clone denied | Accept the repository invitation and authenticate Git as that GitHub user, or download the local-branch ZIP while signed in. |
| Missing CLI/platform package or framework | Run a normal `npm ci` in this OS/environment. Do not omit dev/optional packages or copy `node_modules` between systems. |
| Signed out / live start unavailable | Run `npm run doctor`, then `npx codex login` if needed. Restart the server after signing in. |
| Login callback fails in WSL | Open the printed sign-in link in the Windows browser; use the documented device-auth fallback if needed. |
| Unknown or unavailable model | Pause, open Agent settings, and clear that model override or choose an available model. IDs and access depend on your account. |
| Usage limit or rate limit | Wait for account usage to become available or use the sample. Repeated Continue attempts do not bypass a plan limit. |
| Reply takes a long time | Replies appear only when a model call finishes. Requests time out after 150 seconds; completed messages remain available. |
| Browser cannot connect | Keep the server terminal running and use its exact printed URL/port. In WSL, consult the networking guide above. |
| Production preview cannot generate | Use `npm run local` on `local`. `npm start` serves the production preview without the local inference middleware. |
| Online says approval required | Expected: the online edition is sample-only until hosted access is approved and implemented. |
| Conversations seem missing | Use the same browser profile and exact origin (host and port). History is local browser storage; there is no cloud sync. |

When reporting a problem, include your OS, whether you use WSL, branch, Node version, `npm run doctor` result, and the error message. Remove account details or credentials from logs before sharing.
