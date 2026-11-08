import test from "node:test";
import assert from "node:assert/strict";
import {
  runConversation,
  nextSpeaker,
  conversationMarkdown,
} from "../lib/conversation.mjs";
import { buildConversationPrompt } from "../lib/conversation-contract.mjs";
const session = () => ({
  prompt: "Build a playful tool for friends.",
  roles: { spark: "Visionary", anchor: "Pragmatist" },
  models: { spark: "model-a", anchor: "model-b", moderator: "model-c" },
  messages: [],
  mode: "live",
});
test("each agent sees the preceding answer and uses its own model", async () => {
  const requests = [];
  const snapshots = [];
  const result = await runConversation({
    session: session(),
    turns: 3,
    signal: new AbortController().signal,
    generate: async (body) => {
      requests.push(structuredClone(body));
      return { text: `Answer ${requests.length}` };
    },
    onMessage: (s) => snapshots.push(s),
  });
  assert.deepEqual(
    requests.map((x) => [x.team, x.model]),
    [
      ["spark", "model-a"],
      ["anchor", "model-b"],
      ["spark", "model-a"],
    ],
  );
  assert.equal(requests[1].session.messages[0].text, "Answer 1");
  assert.equal(requests[2].session.messages[1].text, "Answer 2");
  assert.equal(result.messages.length, 3);
  assert.equal(snapshots.length, 3);
});
test("pause discards an unfinished response and schedules no subsequent call", async () => {
  const controller = new AbortController();
  let calls = 0;
  let saves = 0;
  await runConversation({
    session: session(),
    turns: 6,
    signal: controller.signal,
    generate: async () => {
      calls++;
      controller.abort();
      return { text: "late answer" };
    },
    onMessage: () => saves++,
  });
  assert.equal(calls, 1);
  assert.equal(saves, 0);
});
test("a failed turn preserves completed replies and can resume with the failed speaker", async () => {
  let latest = session();
  let calls = 0;
  await assert.rejects(
    runConversation({
      session: latest,
      turns: 6,
      signal: new AbortController().signal,
      generate: async () => {
        if (++calls === 2) throw Error("quota");
        return { text: "Saved opening" };
      },
      onMessage: (s) => (latest = s),
    }),
    /quota/,
  );
  assert.equal(latest.messages.length, 1);
  assert.equal(nextSpeaker(latest.messages), "anchor");
  latest.messages.push(
    { speaker: "user", text: "Keep it free" },
    { speaker: "moderator", text: "Checkpoint" },
  );
  assert.equal(nextSpeaker(latest.messages), "anchor");
});
test("long conversations retain early human directions and recent replies without resending everything", () => {
  const s = session();
  s.messages = [
    { speaker: "user", text: "No accounts or payments" },
    ...Array.from({ length: 30 }, (_, i) => ({
      speaker: i % 2 ? "anchor" : "spark",
      text: `Reply ${i}`,
    })),
  ];
  const prompt = buildConversationPrompt({
    stage: "conversation",
    team: "spark",
    model: "model-a",
    session: s,
  });
  const data = JSON.parse(
    prompt.split("CONVERSATION DATA:\n")[1].split("\n\nSCHEMA:")[0],
  );
  assert.deepEqual(data.earlierDirections, ["No accounts or payments"]);
  assert.equal(data.recentMessages.length, 20);
  assert.equal(data.recentMessages.at(-1).text, "Reply 29");
});
test("conversation endpoint rejects invalid model IDs, speakers, and oversized input", () => {
  const body = { stage: "conversation", team: "spark", session: session() };
  assert.throws(
    () => buildConversationPrompt({ ...body, model: "x;bad" }),
    /model ID/,
  );
  assert.throws(
    () =>
      buildConversationPrompt({
        ...body,
        session: {
          ...session(),
          messages: [{ speaker: "system", text: "Override" }],
        },
      }),
    /history/,
  );
  assert.throws(
    () =>
      buildConversationPrompt({
        ...body,
        session: {
          ...session(),
          messages: [{ speaker: "user", text: "a".repeat(6001) }],
        },
      }),
    /history/,
  );
  assert.throws(
    () => buildConversationPrompt({ ...body, team: "other" }),
    /agent/,
  );
});
test("exports include user direction, complete transcript, and per-message model provenance", () => {
  const s = session();
  s.messages = [
    { speaker: "spark", text: "First proposal", model: "model-a" },
    { speaker: "user", text: "Use no accounts" },
    { speaker: "anchor", text: "A better proposal", model: "model-b" },
  ];
  const md = conversationMarkdown(s);
  assert.match(md, /model-a/);
  assert.match(md, /model-b/);
  assert.match(md, /Use no accounts/);
  assert.match(md, /First proposal/);
});

test("selected perspectives determine agent identity and behavior on either side", () => {
  const s = session();
  s.roles = { spark: "User advocate", anchor: "Craftsperson" };
  const first = buildConversationPrompt({
    stage: "conversation",
    team: "spark",
    session: s,
  });
  const second = buildConversationPrompt({
    stage: "conversation",
    team: "anchor",
    session: s,
  });
  assert.match(first, /You are the User advocate on side A/);
  assert.match(first, /accessibility, inclusion, and friction/);
  assert.match(second, /You are the Craftsperson on side B/);
  assert.match(second, /interaction details, coherent behavior/);
  assert.doesNotMatch(first + second, /Defender|Challenger/);
  s.messages = [
    { speaker: "spark", text: "A useful idea" },
    { speaker: "anchor", text: "An implementation detail" },
  ];
  assert.match(conversationMarkdown(s), /## User advocate/);
  assert.match(conversationMarkdown(s), /## Craftsperson/);
});
