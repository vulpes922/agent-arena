import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error("Agent Arena needs Node.js 22.13 or later.");
  process.exit(1);
}
const codex = path.join(root, "node_modules/@openai/codex/bin/codex.js");
if (!existsSync(codex) || !existsSync(path.join(root, "node_modules/vinext"))) {
  console.error("Run npm ci first, then npm run local.");
  process.exit(1);
}
// Always use this project's pinned CLI, including on Windows.
process.env.PATH = [path.dirname(process.execPath), path.join(root, "node_modules/.bin"), process.env.PATH || ""].join(path.delimiter);
const status = spawnSync(process.execPath, [codex, "login", "status"], { stdio: "ignore", timeout: 10000 });
if (process.argv.includes("--check")) {
  console.log(`Node ${process.versions.node}; project dependencies installed; Codex ${status.status === 0 ? "signed in" : "sign-in needed"}.`);
  process.exit(status.status === 0 ? 0 : 1);
}
if (status.status !== 0) {
  console.log("Sign in to your own ChatGPT account in the browser opened by Codex. Agent Arena never asks for your password or an API key.");
  const login = spawnSync(process.execPath, [codex, "login"], { stdio: "inherit" });
  if (login.status !== 0) {
    console.error("Sign-in was not completed. Retry npm run local, or use npm run dev for the sample.");
    process.exit(1);
  }
}
console.log("Starting Agent Arena with this computer's Codex account. Live debates consume that account's allowance.");
process.argv = [process.execPath, fileURLToPath(new URL("./run-framework.mjs", import.meta.url)), "dev", ...process.argv.slice(2)];
await import("./run-framework.mjs");
