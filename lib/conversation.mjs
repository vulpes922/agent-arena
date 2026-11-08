export const rolesForConversation = [
  "Visionary",
  "Pragmatist",
  "User advocate",
  "Contrarian",
  "Strategist",
  "Craftsperson",
];
export function nextSpeaker(messages) {
  const last = [...messages]
    .reverse()
    .find((m) => m.speaker === "spark" || m.speaker === "anchor");
  return last?.speaker === "spark" ? "anchor" : "spark";
}
export function conversationMarkdown(session) {
  return (
    `# Agent Arena\n\n${session.prompt}\n\n${session.mode === "sample" ? "*Authored sample, not live AI.*\n\n" : ""}` +
    session.messages
      .map(
        (m) =>
          `## ${{ spark: "Spark", anchor: "Anchor", user: "You", moderator: "Orbit" }[m.speaker]}${m.model ? ` · ${m.model}` : ""}\n\n${m.text}`,
      )
      .join("\n\n")
  );
}

// Each request receives the preceding answer. Abort never schedules another turn.
export async function runConversation({
  session,
  turns,
  signal,
  generate,
  onMessage,
}) {
  let current = session;
  for (let i = 0; i < turns && !signal.aborted; i++) {
    const speaker = nextSpeaker(current.messages);
    const model = current.models[speaker];
    const result = await generate(
      { stage: "conversation", team: speaker, model, session: current },
      signal,
    );
    if (signal.aborted) break;
    const message = {
      id: crypto.randomUUID(),
      speaker,
      text: result.text,
      model: result.model || model || "Codex default",
      at: Date.now(),
    };
    current = {
      ...current,
      updatedAt: Date.now(),
      messages: [...current.messages, message],
    };
    onMessage(current);
  }
  return current;
}
