export type Phase =
  "setup" | "briefing" | "opening" | "crossfire" | "refinement" | "blueprint";
export type Team = "spark" | "anchor";
export type Mode = "sample" | "live";
export type Role =
  | "Visionary"
  | "Pragmatist"
  | "User advocate"
  | "Contrarian"
  | "Strategist"
  | "Craftsperson";
export type Plan = {
  title: string;
  goal: string;
  sections: string[];
  criteria: string[];
  deliverable: string;
};
export type Argument = {
  title: string;
  summary: string;
  claims: { id: string; title: string; detail: string }[];
  assumption: string;
};
export type Critique = {
  headline: string;
  challenges: {
    claimId: string;
    quote: string;
    concern: string;
    alternative: string;
  }[];
  commonGround: string;
};
export type Revision = {
  title: string;
  summary: string;
  changes: { response: string; decision: string; detail: string }[];
  remainingRisk: string;
};
export type Blueprint = {
  title: string;
  tagline: string;
  summary: string;
  audience: string;
  features: string[];
  journey: string[];
  decisions: string[];
  questions: string[];
  nextSteps: string[];
};
export type Session = {
  id: string;
  createdAt: number;
  updatedAt: number;
  prompt: string;
  constraints: string;
  mode: Mode;
  roles: Record<Team, Role>;
  phase: Phase;
  plan?: Plan;
  openings: Partial<Record<Team, Argument>>;
  critiques: Partial<Record<Team, Critique>>;
  revisions: Partial<Record<Team, Revision>>;
  blueprint?: Blueprint;
  interventions: { text: string; phase: Phase; at: number }[];
  pinned: string[];
};
export const roles: Role[] = [
  "Visionary",
  "Pragmatist",
  "User advocate",
  "Contrarian",
  "Strategist",
  "Craftsperson",
];
export const phases: { id: Phase; label: string; short: string }[] = [
  { id: "briefing", label: "The brief", short: "Brief" },
  { id: "opening", label: "Opening ideas", short: "Ideas" },
  { id: "crossfire", label: "Crossfire", short: "Debate" },
  { id: "refinement", label: "Refine", short: "Refine" },
  { id: "blueprint", label: "The blueprint", short: "Result" },
];
export const samplePrompt =
  "Design a fun app that helps friends actually decide what to do together.";
export function normalizeRevisionChange(change: Revision["changes"][number]) {
  const labels = ["adopt", "revise", "defend", "concede"];
  return labels.includes(change.decision.toLowerCase()) &&
    !labels.includes(change.response.toLowerCase())
    ? { ...change, response: change.decision, decision: change.response }
    : change;
}
export function createSession(
  prompt: string,
  constraints: string,
  mode: Mode,
  teamRoles: Record<Team, Role>,
): Session {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    prompt,
    constraints,
    mode,
    roles: teamRoles,
    phase: "setup",
    openings: {},
    critiques: {},
    revisions: {},
    interventions: [],
    pinned: [],
  };
}
export function toMarkdown(s: Session): string {
  const b = s.blueprint;
  if (!b) return `# ${s.plan?.title || "Agent Arena"}\n\n${s.prompt}`;
  const list = (items: string[]) => items.map((x) => `- ${x}`).join("\n");
  return `# ${b.title}\n\n> ${b.tagline}\n\n${b.summary}\n\n## Audience\n${b.audience}\n\n## Core features\n${list(b.features)}\n\n## User journey\n${b.journey.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\n## Decisions\n${list(b.decisions)}\n\n## Open questions & assumptions\n${list(b.questions)}\n\n## Next steps\n${list(b.nextSteps)}\n\n## Your direction\n${list(s.interventions.map((x) => x.text)) || "- No additional direction."}\n\n---\nCreated in Agent Arena · ${s.mode === "live" ? "Live Codex debate" : "Illustrative sample debate (not live AI)"}\nOriginal mission: ${s.prompt}\nConstraints: ${s.constraints || "None specified"}\n`;
}
