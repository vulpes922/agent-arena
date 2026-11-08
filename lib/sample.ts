import type {
  Plan,
  Argument,
  Critique,
  Revision,
  Blueprint,
  Session,
  Team,
} from "./arena";
// An authored, illustrative debate. Never passed off as model inference.
export const samplePlan: Plan = {
  title: "Turn “we should hang out” into an actual plan",
  goal: sampleGoal(),
  sections: [
    "The reason group plans stall",
    "A delightful decision-making loop",
    "The smallest useful prototype",
  ],
  criteria: [
    "A group can decide in under 2 minutes",
    "One friend can start without everyone installing an app",
    "The result is a real plan, not another poll",
  ],
  deliverable:
    "A product concept, core user journey, and a buildable MVP brief",
};
function sampleGoal() {
  return "Help a group of friends agree on an activity without the endless group-chat spiral.";
}
export const sampleOpenings: Record<Team, Argument> = {
  spark: {
    title: "Make the decision a tiny adventure.",
    summary:
      "Meet Sidequest: a playful invitation that turns everyone’s mood into three surprising things to do. Friends swipe together, then reveal their next adventure.",
    claims: [
      {
        id: "spark-1",
        title: "Start with a mood, not a search",
        detail:
          "Each friend picks a mood—cozy, adventurous, or spontaneous. Mix their moods into three activity cards.",
      },
      {
        id: "spark-2",
        title: "A shared reveal beats another poll",
        detail:
          "Let everyone react privately, then reveal the group’s best match together. Make deciding part of the fun.",
      },
      {
        id: "spark-3",
        title: "Give every group a home",
        detail:
          "Save a group profile so preferences and past adventures make the next suggestion better.",
      },
    ],
    assumption:
      "Friends will participate in a short, playful activity if it makes organizing easier.",
  },
  anchor: {
    title: "The best plan is the one that happens.",
    summary:
      "Start with the organizer. They set a time, budget, and meeting area, then share a link. Friends respond in seconds; the group gets one clear, feasible recommendation.",
    claims: [
      {
        id: "anchor-1",
        title: "Constraints come before inspiration",
        detail:
          "A great suggestion is useless if someone cannot afford it or get there. Set time, budget, and location first.",
      },
      {
        id: "anchor-2",
        title: "An invitation should be a link",
        detail:
          "Skip accounts and installations for invited friends. Open a link, react, and get on with your day.",
      },
      {
        id: "anchor-3",
        title: "A decision needs a deadline",
        detail:
          "Close responses at a visible time. Show a suggested plan and let the organizer confirm it.",
      },
    ],
    assumption:
      "One person is willing to make the final decision when the group cannot agree.",
  },
};
export const sampleCritiques: Record<Team, Critique> = {
  spark: {
    headline: "Keep the speed. Leave room for surprise.",
    challenges: [
      {
        claimId: "anchor-1",
        quote: "Constraints come before inspiration",
        concern:
          "A form about budgets and locations might feel like scheduling a meeting. Where is the emotional reason to join?",
        alternative:
          "Use three playful activity cards, with practical constraints tucked into a quick organizer setup.",
      },
      {
        claimId: "anchor-3",
        quote: "A decision needs a deadline",
        concern:
          "An automatic cutoff could exclude a quieter friend. A fast decision is not always a shared decision.",
        alternative:
          "Show who has responded and let the organizer extend or confirm the decision.",
      },
    ],
    commonGround:
      "A shareable link is stronger than asking the entire group to install another app.",
  },
  anchor: {
    headline: "Delight cannot depend on everyone showing up.",
    challenges: [
      {
        claimId: "spark-2",
        quote: "A shared reveal beats another poll",
        concern:
          "A simultaneous reveal asks busy friends to be online at the same time—the coordination problem we are trying to solve.",
        alternative:
          "Collect reactions asynchronously. Save the reveal for when a plan is confirmed.",
      },
      {
        claimId: "spark-3",
        quote: "Give every group a home",
        concern:
          "Profiles and history create account friction before the group has received any value.",
        alternative:
          "Make the first plan work with a link. Test repeat use before adding accounts.",
      },
    ],
    commonGround:
      "Mood-based cards make choosing more appealing than an empty group-chat question.",
  },
};
export function sampleRevision(team: Team, s: Session): Revision {
  const direction = s.interventions.at(-1)?.text;
  const base: Revision =
    team === "spark"
      ? {
          title: "A little adventure. A lot less friction.",
          summary:
            "Keep the playful cards, but make the experience asynchronous and available through a link.",
          changes: [
            {
              response: "Concede",
              decision: "Drop mandatory group accounts",
              detail:
                "Friends can join and react without signing up. Save profiles for a later version.",
            },
            {
              response: "Revise",
              decision: "Make the reveal asynchronous",
              detail:
                "Collect preferences privately; show the shared celebration only after the organizer confirms.",
            },
            {
              response: "Defend",
              decision: "Keep the mood-based cards",
              detail:
                "The cards provide the emotional hook that makes the invitation worth opening.",
            },
          ],
          remainingRisk:
            "The activity suggestions still need to be relevant enough to inspire a real outing.",
        }
      : {
          title: "Make the practical path feel playful.",
          summary:
            "Add Spark’s emotional hook to a fast, constraint-aware flow. Keep a human in charge of the final plan.",
          changes: [
            {
              response: "Adopt",
              decision: "Use three visual activity cards",
              detail:
                "Present concrete options, rather than asking the group to brainstorm from scratch.",
            },
            {
              response: "Revise",
              decision: "Treat the deadline as a checkpoint",
              detail:
                "The organizer sees missing responses and decides whether to extend or confirm.",
            },
            {
              response: "Defend",
              decision: "Filter by real constraints",
              detail:
                "Budget, time, and travel distance still determine which options are feasible.",
            },
          ],
          remainingRisk:
            "One organizer still carries responsibility for making the final decision.",
        };
  if (direction)
    base.changes.push({
      response: "Your direction",
      decision: "Carry your note into the brief",
      detail: direction,
    });
  return base;
}
export function sampleBlueprint(s: Session): Blueprint {
  return {
    title: "Sidequest",
    tagline: "Less “we should.” More “let’s go.”",
    summary:
      "A lightweight, playful way for friends to turn an open-ended group chat into a confirmed outing. One person shares three feasible activity cards; friends react through a link, and the organizer confirms the plan.",
    audience:
      "The friend who always ends up organizing—and the friends who want to join without doing the planning.",
    features: [
      "A quick organizer setup: time, budget, and meeting area.",
      "Three mood-led activity cards with clear practical details.",
      "An account-free invitation link with private reactions.",
      "A response checkpoint and human-confirmed final plan.",
    ],
    journey: [
      "The organizer sets the basics and picks three activity cards.",
      "Friends open a link and react in their own time.",
      "The organizer sees the best match and any missing responses.",
      "The organizer confirms; everyone receives the same final plan.",
    ],
    decisions: [
      "Keep Spark’s playful activity cards.",
      "Adopt Anchor’s account-free, asynchronous flow.",
      "Let a person confirm the result; do not auto-book anything.",
      ...s.interventions.map((x) => `User direction to validate: ${x.text}`),
    ],
    questions: [
      "Will friends respond faster than they do in a group chat?",
      "Who supplies useful, current activity suggestions?",
      "What should happen when the group has no clear preference?",
    ],
    nextSteps: [
      "Prototype one organizer flow and a shared response page.",
      "Use a curated set of activity cards for the first test.",
      "Test with three friend groups and observe time to a confirmed plan.",
    ],
  };
}
