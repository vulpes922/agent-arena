import { spawn } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import path from "node:path";
import {
  schemas,
  matchesSchema,
  buildPrompt,
} from "../lib/debate-contract.mjs";

const active = new Set();
let pending = 0;
async function configuredModel() {
  try {
    const config = await readFile(
      path.join(
        process.env.CODEX_HOME || path.join(homedir(), ".codex"),
        "config.toml",
      ),
      "utf8",
    );
    // Read only the top-level model preference; keep the rest of the user's config isolated.
    return config
      .split(/^\s*\[/m)[0]
      .match(/^model\s*=\s*["']([a-zA-Z0-9._-]+)["']/m)?.[1];
  } catch {
    return undefined;
  }
}
export function stopCodexRuns() {
  for (const child of active) child.kill("SIGKILL");
}
export async function codexStatus() {
  return new Promise((resolve) => {
    const child = spawn(
      process.env.ARENA_CODEX_BIN || "codex",
      ["login", "status"],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let output = "";
    const timer = setTimeout(() => child.kill(), 5000);
    child.stdout.on("data", (x) => (output += x));
    child.stderr.on("data", (x) => (output += x));
    child.on("error", () => {
      clearTimeout(timer);
      resolve({
        available: false,
        reason: "Install Codex CLI, then run codex login.",
      });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        available: code === 0,
        reason:
          code === 0
            ? "Connected to your local Codex account."
            : "Run codex login in your terminal to connect your subscription.",
      });
    });
  });
}
export async function generateWithCodex(body, signal) {
  const prompt = buildPrompt(body);
  if (pending >= 2)
    throw new Error(
      "Both agents are busy. Wait for the current round to finish.",
    );
  pending++;
  let dir;
  try {
    dir = await mkdtemp(path.join(tmpdir(), "agent-arena-"));
    const schema = path.join(dir, "schema.json"),
      output = path.join(dir, "result.json");
    await writeFile(schema, JSON.stringify(schemas[body.stage]));
    const args = [
      "exec",
      "--ignore-user-config",
      "--skip-git-repo-check",
      "--ephemeral",
      "--sandbox",
      "read-only",
      "-c",
      'approval_policy="never"',
      "-c",
      "features.shell_tool=false",
      "-c",
      "features.multi_agent=false",
      "-c",
      "features.plugins=false",
      "-c",
      "features.apps=false",
      "-c",
      "features.browser_use=false",
      "-c",
      "features.computer_use=false",
      "-c",
      "features.hooks=false",
      "-c",
      'web_search="disabled"',
      "-c",
      'model_reasoning_effort="low"',
      "--cd",
      dir,
      "--output-schema",
      schema,
      "--output-last-message",
      output,
      "--color",
      "never",
    ];
    const model =
      body.model ||
      (["plan", "blueprint"].includes(body.stage)
        ? process.env.ARENA_MODERATOR_MODEL
        : process.env.ARENA_TEAM_MODEL) ||
      (await configuredModel());
    if (model) args.push("--model", model);
    args.push("-");
    await new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new Error("Debate stopped."));
      const child = spawn(process.env.ARENA_CODEX_BIN || "codex", args, {
        stdio: ["pipe", "ignore", "pipe"],
      });
      active.add(child);
      let errorText = "",
        timedOut = false;
      const abort = () => child.kill("SIGKILL");
      signal?.addEventListener("abort", abort, { once: true });
      const timeout = setTimeout(() => {
        timedOut = true;
        abort();
      }, 150000);
      child.stderr.on("data", (x) => {
        errorText = (errorText + x.toString()).slice(-12000);
      });
      child.stdin.on("error", () => {});
      child.stdin.end(prompt);
      const cleanup = () => {
        clearTimeout(timeout);
        active.delete(child);
        signal?.removeEventListener("abort", abort);
      };
      child.on("error", () => {
        cleanup();
        reject(
          new Error(
            "Codex CLI could not start. Check ARENA_CODEX_BIN or install Codex.",
          ),
        );
      });
      child.on("close", (code) => {
        cleanup();
        if (signal?.aborted) return reject(new Error("Debate stopped."));
        if (timedOut)
          return reject(
            new Error(
              "This agent exceeded the 150-second limit. Retry or choose a faster model in Connection settings.",
            ),
          );
        if (code !== 0) {
          const reason = /requires a newer version/i.test(errorText)
            ? "Update the project’s Codex CLI with npm install -D @openai/codex@latest, then restart the server."
            : /usage limit|rate limit|quota/i.test(errorText)
              ? "Your Codex account reached a usage limit. Try again later."
              : /model.*not|unsupported.*model/i.test(errorText)
                ? "That model is not available to this Codex account. Choose an available model in Connection settings."
                : "Codex could not complete this turn. Check codex login status and retry. Your previous work is saved.";
          return reject(new Error(reason));
        }
        resolve();
      });
    });
    const result = JSON.parse(await readFile(output, "utf8"));
    if (!matchesSchema(result, schemas[body.stage]))
      throw new Error(
        "The agent returned an incomplete response. Retry this round.",
      );
    if (body.stage === "crossfire") {
      const opposite = body.team === "spark" ? "anchor" : "spark";
      if (
        result.challenges.some(
          (c) =>
            !body.session.openings[opposite].claims.some(
              (x) => x.id === c.claimId && x.title === c.quote,
            ),
        )
      )
        throw new Error(
          "A rebuttal did not reference an actual opposing claim. Retry the round.",
        );
    }
    return result;
  } finally {
    pending--;
    if (dir) await rm(dir, { recursive: true, force: true });
  }
}
