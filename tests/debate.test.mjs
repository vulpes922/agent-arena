import test from "node:test";
import assert from "node:assert/strict";
import { mergeHistories } from "../lib/history.mjs";
test('a stale tab cannot overwrite newer rounds or remove another arena', () => {
  const older = {id:'live',updatedAt:10,phase:'opening'};
  const newer = {...older,updatedAt:30,phase:'blueprint'};
  const sample = {id:'sample',updatedAt:20,phase:'blueprint'};
  assert.deepEqual(mergeHistories([older,sample],[newer]),[newer,sample]);
  assert.deepEqual(mergeHistories([], [newer]), [newer]);
});
import {
  buildPrompt,
  validateRequest,
  matchesSchema,
  schemas,
} from "../lib/debate-contract.mjs";

const proposal = (team) => ({
  title: `${team} proposal`,
  summary: "A concrete proposal",
  claims: [
    { id: `${team}-1`, title: "A claim", detail: "Supporting reasoning" },
  ],
  assumption: "Untested assumption",
});
const session = () => ({
  prompt: "Build a playful neighborhood lending app.",
  constraints: "No payments",
  roles: { spark: "Visionary", anchor: "Pragmatist" },
  interventions: [],
  pinned: [],
  plan: {
    title: "Lend",
    goal: "Make asking easier",
    sections: ["Experience", "Trust", "Scope"],
    criteria: ["Clear", "Useful", "Buildable"],
    deliverable: "MVP brief",
  },
  openings: { spark: proposal("spark"), anchor: proposal("anchor") },
  critiques: {},
  revisions: {},
});
const data = (prompt) =>
  JSON.parse(prompt.split("DEBATE DATA:\n")[1].split("\n\nReturn JSON")[0]);

test("opening proposals cannot see the other team’s answer", () => {
  const s = session();
  s.openings.anchor.summary = "SECRET OPPONENT IDEA";
  const prompt = buildPrompt({ stage: "opening", team: "spark", session: s });
  assert.ok(!prompt.includes("SECRET OPPONENT IDEA"));
  assert.equal(data(prompt).openings, undefined);
  assert.match(prompt, /Visionary/);
});
test("crossfire gets both proposals and must reference the opposing claim", () => {
  const prompt = buildPrompt({
    stage: "crossfire",
    team: "spark",
    session: session(),
  });
  assert.equal(data(prompt).openings.anchor.claims[0].id, "anchor-1");
  assert.match(prompt, /Copy the exact opponent claim ID and title/);
});
test("human direction and pins propagate into the next round", () => {
  const s = session();
  s.interventions = [{ text: "No accounts required", phase: "opening" }];
  s.pinned = ["spark-1"];
  const context = data(
    buildPrompt({ stage: "crossfire", team: "anchor", session: s }),
  );
  assert.deepEqual(context.directorNotes, ["No accounts required"]);
  assert.deepEqual(context.pinnedClaims, ["spark-1"]);
});
test("a final blueprint requires both revisions, not just a convincing opening", () => {
  assert.throws(
    () => validateRequest({ stage: "blueprint", session: session() }),
    /Both rebuttals/,
  );
  const s = session();
  const c = { headline: "Concern", challenges: [], commonGround: "Agreement" };
  s.critiques = { spark: c, anchor: c };
  assert.throws(
    () => validateRequest({ stage: "blueprint", session: s }),
    /Both revised proposals/,
  );
});
test("rejects oversized missions and command-like model IDs", () => {
  const s = session();
  assert.throws(
    () =>
      validateRequest({
        stage: "plan",
        session: { ...s, prompt: "x".repeat(4001) },
      }),
    /mission/,
  );
  assert.throws(
    () =>
      validateRequest({
        stage: "plan",
        session: s,
        model: "model; touch /tmp/x",
      }),
    /model ID/,
  );
});
test("rejects missing fields and unexpected output properties", () => {
  const p = session().plan;
  assert.ok(matchesSchema(p, schemas.plan));
  assert.ok(!matchesSchema({ ...p, execute: "a command" }, schemas.plan));
  assert.ok(!matchesSchema({ title: "Incomplete" }, schemas.plan));
  assert.ok(!matchesSchema({ ...p, sections: [12] }, schemas.plan));
});
test("requires two completed openings before crossfire", () => {
  const s = session();
  delete s.openings.anchor;
  assert.throws(
    () => validateRequest({ stage: "crossfire", team: "spark", session: s }),
    /Both opening proposals/,
  );
});
test("plan generation does not inherit an obsolete brief or old arguments", () => {
  const context = data(buildPrompt({ stage: "plan", session: session() }));
  assert.equal(context.brief, undefined);
  assert.equal(context.openings, undefined);
  assert.equal(context.constraints, "No payments");
});
