"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Swords,
  Sparkles,
  Shield,
  LayoutTemplate,
  BookOpen,
  Settings2,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Play,
  Pause,
  MessageSquare,
  FileText,
  Download,
  Copy,
  Pin,
  RotateCcw,
  Zap,
  CircleHelp,
  Menu,
  CheckCheck,
  Lightbulb,
  Flag,
  Loader2,
  Pencil,
  AlertCircle,
  Radio,
  Clock3,
  Send,
} from "lucide-react";
import { AgentAvatar } from "@/components/agent-avatar";
import { mergeHistories } from "@/lib/history.mjs";
import {
  createSession,
  normalizeRevisionChange,
  phases,
  roles,
  samplePrompt,
  toMarkdown,
  type Session,
  type Phase,
  type Mode,
  type Team,
  type Role,
  type Plan,
  type Argument,
  type Critique,
  type Revision,
  type Blueprint,
} from "@/lib/arena";
import {
  samplePlan,
  sampleOpenings,
  sampleCritiques,
  sampleRevision,
  sampleBlueprint,
} from "@/lib/sample";

const STORAGE = "agent-arena.sessions.v1";
const names = { spark: "Spark", anchor: "Anchor" };
const roleDescriptions: Record<Role, string> = {
  Visionary: "Find the unexpected possibility.",
  Pragmatist: "Make the idea hold up in reality.",
  "User advocate": "Put real people at the center.",
  Contrarian: "Question the obvious answer.",
  Strategist: "Connect the idea to its impact.",
  Craftsperson: "Make every detail count.",
};
type Stage = "plan" | "opening" | "crossfire" | "refinement" | "blueprint";

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export default function Arena() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<Phase>("setup");
  const [prompt, setPrompt] = useState("");
  const [constraints, setConstraints] = useState("");
  const [showConstraints, setShowConstraints] = useState(false);
  const [teamRoles, setTeamRoles] = useState<Record<Team, Role>>({
    spark: "Visionary",
    anchor: "Pragmatist",
  });
  const [mode, setMode] = useState<Mode>("sample");
  const [connection, setConnection] = useState<{
    available: boolean;
    reason: string;
  } | null>(null);
  const [models, setModels] = useState({ team: "", moderator: "" });
  const [modal, setModal] = useState<"settings" | "guide" | "missions" | null>(
    null,
  );
  const [busy, setBusy] = useState<Stage | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [note, setNote] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const modeTouched = useRef(false);
  const hydrated = useRef(false);

  const checkConnection = useCallback(async () => {
    try {
      const res = await fetch("/api/arena/status");
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { available: boolean; reason: string };
      setConnection(data);
      if (data.available && !modeTouched.current) setMode("live");
    } catch {
      setConnection({
        available: false,
        reason:
          "Live AI is unavailable here. Run the project locally with Codex signed in.",
      });
    }
  }, []);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || "[]");
      if (Array.isArray(saved))
        setSessions(
          saved
            .filter(
              (x: Session) =>
                x &&
                typeof x.id === "string" &&
                typeof x.prompt === "string" &&
                Array.isArray(x.interventions) &&
                Array.isArray(x.pinned) &&
                x.openings &&
                x.critiques &&
                x.revisions,
            )
            .slice(0, 12),
        );
      const settings = JSON.parse(
        localStorage.getItem("agent-arena.models") || "null",
      );
      if (
        settings &&
        typeof settings.team === "string" &&
        typeof settings.moderator === "string"
      )
        setModels(settings);
    } catch {
      setToast("Saved data could not be read. You can start a new arena.");
    }
    hydrated.current = true;
    void checkConnection();
    return () => controller.current?.abort();
  }, [checkConnection]);
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      const previous = localStorage.getItem(STORAGE) || "[]";
      const merged = JSON.stringify(mergeHistories(sessions, JSON.parse(previous)));
      if (merged !== previous) localStorage.setItem(STORAGE, merged);
    } catch {
      setToast(
        "Browser storage is full. Export your blueprint to keep a copy.",
      );
    }
  }, [sessions]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE || !event.newValue) return;
      try {
        const incoming = JSON.parse(event.newValue);
        setSessions(previous => mergeHistories(previous, incoming));
      } catch { /* An invalid external snapshot must not replace valid work. */ }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);
  const save = useCallback((s: Session) => {
    const next = { ...s, updatedAt: Date.now() };
    setSession(next);
    setSessions((prev) =>
      [next, ...prev.filter((x) => x.id !== s.id)].slice(0, 12),
    );
  }, []);
  function newArena() {
    if (busy) return;
    setSession(null);
    setView("setup");
    setError("");
    setNote("");
    setMobileNav(false);
  }
  function selectSession(s: Session) {
    if (busy) return;
    setSession(s);
    setView(s.phase);
    setNote("");
    setError("");
    setMobileNav(false);
  }
  async function generate(stage: Stage, s: Session, team?: Team) {
    if (s.mode === "sample") {
      await new Promise<void>((resolve, reject) => {
        const signal = controller.current?.signal;
        if (signal?.aborted)
          return reject(new DOMException("Canceled", "AbortError"));
        const abort = () => {
          clearTimeout(t);
          reject(new DOMException("Canceled", "AbortError"));
        };
        const t = setTimeout(() => {
          signal?.removeEventListener("abort", abort);
          resolve();
        }, 650);
        signal?.addEventListener("abort", abort, { once: true });
      });
      if (stage === "plan") return structuredClone(samplePlan);
      if (stage === "opening") return structuredClone(sampleOpenings[team!]);
      if (stage === "crossfire") return structuredClone(sampleCritiques[team!]);
      if (stage === "refinement") return sampleRevision(team!, s);
      return sampleBlueprint(s);
    }
    const response = await fetch("/api/arena/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage,
        team,
        session: s,
        model: ["plan", "blueprint"].includes(stage)
          ? models.moderator
          : models.team,
      }),
      signal: controller.current?.signal,
    });
    let result: { error?: string; result: any };
    try {
      result = (await response.json()) as typeof result;
    } catch {
      throw new Error(
        "Live debates require the local development server. Open Connection for setup instructions.",
      );
    }
    if (!response.ok)
      throw new Error(
        result.error || "The agent could not complete this turn.",
      );
    return result.result;
  }
  async function run(stage: Stage, s: Session) {
    if (busy) return;
    controller.current = new AbortController();
    setBusy(stage);
    setError("");
    try {
      let updated = { ...s };
      if (stage === "plan") {
        updated = {
          ...s,
          plan: (await generate(stage, s)) as Plan,
          phase: "briefing",
        };
      } else if (stage === "blueprint") {
        updated = {
          ...s,
          blueprint: (await generate(stage, s)) as Blueprint,
          phase: "blueprint",
        };
      } else {
        const [spark, anchor] = await Promise.all([
          generate(stage, s, "spark"),
          generate(stage, s, "anchor"),
        ]);
        if (stage === "opening")
          updated = { ...s, openings: { spark, anchor }, phase: "opening" };
        if (stage === "crossfire")
          updated = { ...s, critiques: { spark, anchor }, phase: "crossfire" };
        if (stage === "refinement")
          updated = { ...s, revisions: { spark, anchor }, phase: "refinement" };
      }
      save(updated);
      setView(updated.phase);
    } catch (e) {
      controller.current?.abort();
      if (e instanceof DOMException && e.name === "AbortError")
        setToast("Round stopped. Completed rounds are saved.");
      else
        setError(
          e instanceof Error
            ? e.message
            : "Something went wrong. Please retry.",
        );
    } finally {
      setBusy(null);
      controller.current = null;
    }
  }
  function start(sample = false) {
    const chosen = sample ? "sample" : mode;
    if (sample) {
      modeTouched.current = true;
      setMode("sample");
    }
    if (chosen === "live" && prompt.trim().length < 10) {
      setError("Give your agents a mission of at least 10 characters.");
      return;
    }
    const s = createSession(
      chosen === "sample" ? samplePrompt : prompt.trim(),
      chosen === "sample"
        ? "Build a browser prototype in five days. Avoid paid integrations."
        : constraints,
      chosen,
      chosen === "sample"
        ? { spark: "Visionary", anchor: "Pragmatist" }
        : teamRoles,
    );
    save(s);
    void run("plan", s);
  }
  function addNote(text = note) {
    if (!session || busy || !text.trim()) return;
    if (session.interventions.length >= 30) {
      setError("This arena has reached its 30-note limit.");
      return;
    }
    save({
      ...session,
      interventions: [
        ...session.interventions,
        { text: text.trim(), phase: session.phase, at: Date.now() },
      ],
    });
    setNote("");
    setToast(
      session.mode === "sample"
        ? "Note saved to the sample brief. Live AI adapts its arguments to your direction."
        : "Direction saved. Both agents will use it in the next round.",
    );
  }
  function pin(id: string) {
    if (!session || busy) return;
    save({
      ...session,
      pinned: session.pinned.includes(id)
        ? session.pinned.filter((x) => x !== id)
        : [...session.pinned, id],
    });
  }
  function exportBrief() {
    if (!session) return;
    const url = URL.createObjectURL(
      new Blob([toMarkdown(session)], { type: "text/markdown" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.blueprint?.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "agent-arena"}-blueprint.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast("Blueprint exported as Markdown.");
  }
  async function copyBrief() {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(toMarkdown(session));
      setToast("Blueprint copied.");
    } catch {
      setToast("Clipboard unavailable. Use Export instead.");
    }
  }
  const completed = session
    ? phases.findIndex((p) => p.id === session.phase)
    : -1;
  const isSetup = !session || view === "setup";
  const activeMode = session?.mode || mode;
  const nextAction =
    session?.phase === "briefing"
      ? { stage: "opening" as Stage, label: "Let the ideas fly" }
      : session?.phase === "opening"
        ? { stage: "crossfire" as Stage, label: "Start the crossfire" }
        : session?.phase === "crossfire"
          ? { stage: "refinement" as Stage, label: "Refine the ideas" }
          : session?.phase === "refinement"
            ? { stage: "blueprint" as Stage, label: "Build the blueprint" }
            : null;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <button className="brand" onClick={newArena} disabled={!!busy}>
          <span className="brand-mark">
            <Swords size={20} />
          </span>
          <span>
            agent<span className="brand-light">arena</span>
            <span className="brand-dot">.</span>
          </span>
        </button>
        <button className="new-button" onClick={newArena} disabled={!!busy}>
          <Plus size={17} /> New arena <span>↗</span>
        </button>
        <div className="nav-label">WORKSPACE</div>
        <button
          className={`nav-item ${isSetup ? "active" : ""}`}
          onClick={newArena}
          disabled={!!busy}
        >
          <Swords size={17} /> The arena
        </button>
        <button className="nav-item" onClick={() => setModal("missions")}>
          <LayoutTemplate size={17} /> Mission starters{" "}
          <span className="tiny-badge">3</span>
        </button>
        <button className="nav-item" onClick={() => setModal("guide")}>
          <BookOpen size={17} /> How it works <ArrowUpRight size={13} />
        </button>
        <div className="nav-label sessions-label">
          RECENT ARENAS{" "}
          <span>{sessions.length.toString().padStart(2, "0")}</span>
        </div>
        <div className="session-list">
          {sessions.length === 0 ? (
            <div className="empty-history">
              <MessageSquare size={20} />
              <p>
                Your next great idea
                <br />
                starts right here.
              </p>
            </div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                disabled={!!busy}
                onClick={() => selectSession(s)}
                className={`session-item ${session?.id === s.id ? "selected" : ""}`}
              >
                <span
                  className={`session-dot ${s.phase === "blueprint" ? "done" : ""}`}
                />
                <span>
                  {s.plan?.title || s.prompt}
                  <small>
                    {s.mode === "sample" ? "Sample" : "Live"} ·{" "}
                    {s.phase === "blueprint"
                      ? "Complete"
                      : s.phase === "setup"
                        ? "New"
                        : phases.find((p) => p.id === s.phase)?.short}
                  </small>
                </span>
              </button>
            ))
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="director-card">
            <div className="director-orbit">✳</div>
            <strong>You’re in the director’s seat.</strong>
            <p>
              Great ideas need a little
              <br />
              healthy disagreement.
            </p>
            <button onClick={() => setModal("guide")}>
              Meet the process <ArrowRight size={14} />
            </button>
          </div>
          <button
            className="nav-item connection-nav"
            onClick={() => setModal("settings")}
          >
            <Settings2 size={17} /> Connection{" "}
            <span
              className={`connection-dot ${connection?.available ? "connected" : ""}`}
            />
          </button>
          <div className="local-note">
            <Shield size={12} /> Arenas saved in this browser
          </div>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="nav-scrim"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileNav(!mobileNav)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <span className="crumb-icon">
              <Swords size={15} />
            </span>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{session?.plan?.title ? "Your arena" : "New arena"}</strong>
          </div>
          <div className="topbar-right">
            <button
              className={`mode-badge ${activeMode}`}
              onClick={() => setModal("settings")}
            >
              <span
                className={`connection-dot ${activeMode === "live" ? "connected" : ""}`}
              />
              {activeMode === "live" ? "Local Codex" : "Sample mode"}
              <ChevronDown size={12} />
            </button>
            <span className="prototype-badge">PROTOTYPE</span>
            <button
              className="user-avatar"
              onClick={() => setModal("guide")}
              aria-label="Your role as director"
            >
              YOU
            </button>
          </div>
        </header>
        <main>
          {isSetup ? (
            <>
              <section className="welcome-heading">
                <div className="eyebrow">
                  <span /> TWO PERSPECTIVES. ONE BETTER IDEA.
                </div>
                <h1>
                  Good ideas deserve
                  <br />a worthy <span>opponent.</span>
                  <svg viewBox="0 0 210 17" aria-hidden="true">
                    <path
                      d="M4 11Q100-2 205 8M40 15Q120 8 181 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </h1>
                <p>
                  Give your AI team a mission. Let them challenge each other.
                  <br className="desktop-break" /> Shape what comes next.
                </p>
              </section>
              <section className="launch-grid">
                <div className="mission-panel">
                  <div className="panel-title">
                    <span className="step-number">01</span>
                    <h2>What are we making?</h2>
                    <span className="panel-caption">YOU SET THE CHALLENGE</span>
                  </div>
                  <label className="sr-only" htmlFor="mission">
                    Your mission
                  </label>
                  <textarea
                    id="mission"
                    className="mission-input"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    maxLength={4000}
                    placeholder="An app idea. A bold proposal. A better way to do something. What’s on your mind?"
                    disabled={!!busy}
                  />
                  <div className="prompt-tools">
                    <button
                      className={`text-button ${showConstraints ? "blue-text" : ""}`}
                      onClick={() => setShowConstraints(!showConstraints)}
                    >
                      <Plus size={14} /> Add constraints
                    </button>
                    <span>{prompt.length}/4,000</span>
                  </div>
                  {showConstraints && (
                    <textarea
                      aria-label="Constraints"
                      className="constraints-input"
                      value={constraints}
                      onChange={(e) => setConstraints(e.target.value)}
                      maxLength={2000}
                      placeholder="Time, budget, audience, must-haves…"
                      disabled={!!busy}
                    />
                  )}
                  <div className="mission-divider" />
                  <div className="panel-title">
                    <span className="step-number">02</span>
                    <h2>Choose your perspectives</h2>
                  </div>
                  <div className="role-pickers">
                    {(["spark", "anchor"] as Team[]).map((team) => (
                      <div key={team} className={`role-picker ${team}`}>
                        <div className="role-picker-top">
                          <AgentAvatar team={team} size={42} />
                          <div>
                            <small>TEAM {team === "spark" ? "01" : "02"}</small>
                            <strong>{names[team]}</strong>
                          </div>
                          <span className="role-symbol">
                            {team === "spark" ? (
                              <Zap size={15} />
                            ) : (
                              <Shield size={15} />
                            )}
                          </span>
                        </div>
                        <label className="sr-only" htmlFor={`role-${team}`}>
                          {names[team]} role
                        </label>
                        <div className="select-wrap">
                          <select
                            id={`role-${team}`}
                            value={teamRoles[team]}
                            onChange={(e) =>
                              setTeamRoles({
                                ...teamRoles,
                                [team]: e.target.value as Role,
                              })
                            }
                            disabled={!!busy}
                          >
                            {roles.map((r) => (
                              <option key={r}>{r}</option>
                            ))}
                          </select>
                          <ChevronDown size={13} />
                        </div>
                        <p>{roleDescriptions[teamRoles[team]]}</p>
                      </div>
                    ))}
                  </div>
                  <div className="moderator-line">
                    <AgentAvatar team="moderator" size={28} />
                    <span>
                      <strong>Orbit</strong> keeps the debate on track.
                    </span>
                    <span className="auto-tag">MODERATOR</span>
                  </div>
                  <div className="launch-footer">
                    <button
                      className="primary-button launch-button"
                      disabled={
                        !!busy || (mode === "live" && !connection?.available)
                      }
                      onClick={() => start()}
                    >
                      {busy ? (
                        <Loader2 size={17} className="spin" />
                      ) : (
                        <Swords size={17} />
                      )}{" "}
                      {busy
                        ? "Preparing your arena…"
                        : mode === "live"
                          ? "Enter the arena"
                          : "Explore sample arena"}
                      <ArrowRight size={17} />
                    </button>
                    <p>
                      {mode === "live" ? (
                        <>
                          <Radio size={12} /> Powered by your local Codex
                          subscription
                        </>
                      ) : (
                        <>
                          Sample mode uses an authored debate about planning
                          with friends.
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="showcase-panel">
                  <div className="showcase-top">
                    <span className="small-pill">
                      <span /> A LITTLE CREATIVE FRICTION
                    </span>
                    <span className="sparkle-decoration">✧</span>
                  </div>
                  <div className="character-stage">
                    <div className="stage-ring ring-one" />
                    <div className="stage-ring ring-two" />
                    <div className="speech speech-spark">
                      “What if we tried
                      <br />
                      <strong>something different?</strong>”
                    </div>
                    <div className="speech speech-anchor">
                      “Love the ambition.
                      <br />
                      <strong>Let’s make it work.</strong>”
                    </div>
                    <div className="hero-character spark-character">
                      <AgentAvatar team="spark" size={156} />
                      <span>
                        Spark <Zap size={10} />
                      </span>
                    </div>
                    <div className="versus">×</div>
                    <div className="hero-character anchor-character">
                      <AgentAvatar team="anchor" size={153} />
                      <span>
                        Anchor <Shield size={10} />
                      </span>
                    </div>
                    <div className="stage-platform" />
                    <div className="floating-star star-one">✳</div>
                    <div className="floating-star star-two">✧</div>
                    <div className="tiny-orbit">
                      <AgentAvatar team="moderator" size={43} />
                    </div>
                  </div>
                  <div className="showcase-copy">
                    <h2>
                      Not an echo chamber.
                      <br />
                      An idea engine.
                    </h2>
                    <p>
                      Different instincts. Constructive challenges.
                      <br />A stronger result that’s still yours.
                    </p>
                  </div>
                  <div className="process-mini">
                    <span>
                      <Lightbulb size={14} /> Propose
                    </span>
                    <ArrowRight size={12} />
                    <span>
                      <Swords size={14} /> Challenge
                    </span>
                    <ArrowRight size={12} />
                    <span>
                      <Sparkles size={14} /> Evolve
                    </span>
                  </div>
                </div>
              </section>
              <section className="starters-section">
                <div className="section-heading">
                  <h3>A spark to get you started</h3>
                  <span>Big ideas welcome. Rough ideas encouraged.</span>
                </div>
                <div className="starter-grid">
                  <button
                    className="starter-card"
                    disabled={!!busy}
                    onClick={() => {
                      if (connection?.available) {
                        modeTouched.current = true;
                        setMode("live");
                        setPrompt(samplePrompt);
                      } else start(true);
                    }}
                  >
                    <span className="starter-icon lime">
                      <Lightbulb size={20} />
                    </span>
                    <div>
                      <strong>Build the next big thing</strong>
                      <p>An app that gets friends out of the group chat.</p>
                    </div>
                    <ArrowUpRight size={17} />
                  </button>
                  <button
                    className="starter-card"
                    disabled={!!busy}
                    onClick={() => {
                      setPrompt(
                        "Design a playful way for a neighborhood to share useful things instead of buying them.",
                      );
                      if (connection?.available) {
                        modeTouched.current = true;
                        setMode("live");
                      } else
                        setToast(
                          "Mission added. Connect local Codex to debate your own prompt.",
                        );
                    }}
                  >
                    <span className="starter-icon lavender">
                      <Sparkles size={20} />
                    </span>
                    <div>
                      <strong>Rethink the everyday</strong>
                      <p>Make sharing with neighbors feel effortless.</p>
                    </div>
                    <ArrowUpRight size={17} />
                  </button>
                  <button
                    className="starter-card sample-card"
                    disabled={!!busy}
                    onClick={() => start(true)}
                  >
                    <span className="starter-icon blue">
                      <Play size={20} />
                    </span>
                    <div>
                      <strong>Watch an idea evolve</strong>
                      <p>Try a sample debate. No setup needed.</p>
                    </div>
                    <ArrowUpRight size={17} />
                  </button>
                </div>
              </section>
              {busy && (
                <div className="loading-banner" role="status">
                  <AgentAvatar team="moderator" size={38} thinking />
                  <div>
                    <strong>Orbit is setting the stage…</strong>
                    <p>
                      Turning your mission into focused questions and a clear
                      finish line.
                    </p>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => controller.current?.abort()}
                  >
                    <Pause size={14} /> Stop
                  </button>
                </div>
              )}
            </>
          ) : (
            session && (
              <>
                <section className="arena-heading">
                  <div>
                    <div className="eyebrow">
                      <span />{" "}
                      {session.mode === "live"
                        ? "LIVE DEBATE"
                        : "ILLUSTRATIVE SAMPLE"}{" "}
                      <span className="eyebrow-separator">/</span> YOU’RE THE
                      DIRECTOR
                    </div>
                    <h1>{session.plan?.title || "Your next great idea"}</h1>
                    <p>{session.prompt}</p>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => setModal("guide")}
                    aria-label="How the debate works"
                  >
                    <CircleHelp size={20} />
                  </button>
                </section>
                {session.mode === "sample" && (
                  <div className="sample-notice">
                    <Play size={13} />
                    <span>
                      This is an authored sample. Your notes are saved, but
                      these agents aren’t calling a live model.
                    </span>
                    <button onClick={() => setModal("settings")}>
                      Connect live AI <ArrowUpRight size={12} />
                    </button>
                  </div>
                )}
                <nav className="phase-nav" aria-label="Debate stages">
                  {phases.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setView(p.id)}
                      disabled={i > completed || !!busy}
                      className={`${view === p.id ? "current" : ""} ${i < completed ? "complete" : ""}`}
                    >
                      <span>
                        {i < completed ? (
                          <Check size={13} />
                        ) : (
                          String(i + 1).padStart(2, "0")
                        )}
                      </span>
                      <b>{p.label}</b>
                      <small>{p.short}</small>
                    </button>
                  ))}
                </nav>
                {view === "briefing" && session.plan && (
                  <div className="brief-grid">
                    <section className="brief-card">
                      <div className="card-eyebrow">
                        <AgentAvatar team="moderator" size={36} />
                        <div>
                          <strong>Orbit’s game plan</strong>
                          <span>
                            Review the brief before the debate begins.
                          </span>
                        </div>
                        <span className="outline-tag">MODERATOR</span>
                      </div>
                      <label className="field-label" htmlFor="brief-goal">
                        THE MISSION
                      </label>
                      <textarea
                        id="brief-goal"
                        className="brief-goal"
                        value={session.plan.goal}
                        disabled={!!busy || completed > 0}
                        onChange={(e) =>
                          save({
                            ...session,
                            plan: { ...session.plan!, goal: e.target.value },
                          })
                        }
                        maxLength={2000}
                      />
                      <div className="field-label">
                        QUESTIONS WORTH DEBATING
                      </div>
                      <div className="question-list">
                        {session.plan.sections.map((q, i) => (
                          <label key={i}>
                            <span>{String(i + 1).padStart(2, "0")}</span>
                            <input
                              aria-label={`Debate question ${i + 1}`}
                              value={q}
                              disabled={!!busy || completed > 0}
                              maxLength={300}
                              onChange={(e) =>
                                save({
                                  ...session,
                                  plan: {
                                    ...session.plan!,
                                    sections: session.plan!.sections.map(
                                      (v, j) => (i === j ? e.target.value : v),
                                    ),
                                  },
                                })
                              }
                            />
                            <MessageSquare size={16} />
                          </label>
                        ))}
                      </div>
                      <div className="deliverable-box">
                        <FileText size={20} />
                        <div>
                          <small>WHAT YOU’LL WALK AWAY WITH</small>
                          <p>{session.plan.deliverable}</p>
                        </div>
                      </div>
                    </section>
                    <section className="success-card">
                      <span className="target-mark">
                        <Flag size={22} />
                      </span>
                      <h2>What does good look like?</h2>
                      <p>A shared finish line keeps the debate useful.</p>
                      {session.plan.criteria.map((c, i) => (
                        <div className="criterion" key={i}>
                          <Check size={15} />
                          <span>{c}</span>
                        </div>
                      ))}
                      {session.constraints && (
                        <div className="constraint-summary">
                          <strong>Your constraints</strong>
                          <p>{session.constraints}</p>
                        </div>
                      )}
                      <div className="human-note">
                        <span>✳</span>
                        <p>
                          You have the final say.
                          <br />
                          Edit the brief, then let them loose.
                        </p>
                      </div>
                    </section>
                  </div>
                )}
                {["opening", "crossfire", "refinement"].includes(view) && (
                  <div className="debate-grid">
                    {(["spark", "anchor"] as Team[]).map((team) => (
                      <section key={team} className={`agent-card ${team}`}>
                        <div className="agent-card-header">
                          <AgentAvatar team={team} size={62} />
                          <div>
                            <small>TEAM {team === "spark" ? "01" : "02"}</small>
                            <h2>
                              {names[team]} <span>{session.roles[team]}</span>
                            </h2>
                          </div>
                          <span className="agent-state">
                            <span />{" "}
                            {view === "opening"
                              ? "PROPOSING"
                              : view === "crossfire"
                                ? "CHALLENGING"
                                : "EVOLVING"}
                          </span>
                        </div>
                        {view === "opening" && session.openings[team] && (
                          <div className="agent-card-body">
                            <h3>{session.openings[team]!.title}</h3>
                            <p className="agent-summary">
                              {session.openings[team]!.summary}
                            </p>
                            <div className="claim-list">
                              {session.openings[team]!.claims.map(
                                (claim, i) => (
                                  <article
                                    className={`claim ${session.pinned.includes(claim.id) ? "pinned" : ""}`}
                                    key={claim.id}
                                  >
                                    <div className="claim-heading">
                                      <span>
                                        {String(i + 1).padStart(2, "0")}
                                      </span>
                                      <h4>{claim.title}</h4>
                                      <button
                                        className="icon-button pin-button"
                                        disabled={!!busy}
                                        onClick={() => pin(claim.id)}
                                        aria-label={`${session.pinned.includes(claim.id) ? "Unpin" : "Pin"} ${claim.title}`}
                                        aria-pressed={session.pinned.includes(
                                          claim.id,
                                        )}
                                      >
                                        <Pin size={14} />
                                      </button>
                                    </div>
                                    <p>{claim.detail}</p>
                                  </article>
                                ),
                              )}
                            </div>
                            <div className="assumption">
                              <Lightbulb size={15} />
                              <p>
                                <strong>Assumption to test</strong>
                                {session.openings[team]!.assumption}
                              </p>
                            </div>
                          </div>
                        )}
                        {view === "crossfire" && session.critiques[team] && (
                          <div className="agent-card-body">
                            <h3>{session.critiques[team]!.headline}</h3>
                            <p className="round-label">
                              RESPONDING TO{" "}
                              {names[
                                team === "spark" ? "anchor" : "spark"
                              ].toUpperCase()}
                            </p>
                            {session.critiques[team]!.challenges.map((c, i) => (
                              <article className="challenge" key={i}>
                                <blockquote>
                                  <span>THE CLAIM · {c.claimId}</span>“{c.quote}
                                  ”
                                </blockquote>
                                <div className="challenge-concern">
                                  <Swords size={15} />
                                  <p>{c.concern}</p>
                                </div>
                                <div className="alternative">
                                  <ArrowUpRight size={15} />
                                  <p>
                                    <strong>A better direction</strong>
                                    {c.alternative}
                                  </p>
                                </div>
                              </article>
                            ))}
                            <div className="common-ground">
                              <CheckCheck size={17} />
                              <p>
                                <strong>Common ground</strong>
                                {session.critiques[team]!.commonGround}
                              </p>
                            </div>
                          </div>
                        )}
                        {view === "refinement" && session.revisions[team] && (
                          <div className="agent-card-body">
                            <h3>{session.revisions[team]!.title}</h3>
                            <p className="agent-summary">
                              {session.revisions[team]!.summary}
                            </p>
                            {session.revisions[team]!.changes.map(
                              normalizeRevisionChange,
                            ).map((c, i) => (
                              <article className="revision" key={i}>
                                <span
                                  className={`revision-tag ${c.response.toLowerCase() === "concede" ? "concede" : ""}`}
                                >
                                  {c.response}
                                </span>
                                <h4>{c.decision}</h4>
                                <p>{c.detail}</p>
                              </article>
                            ))}
                            <div className="assumption">
                              <AlertCircle size={15} />
                              <p>
                                <strong>Still worth investigating</strong>
                                {session.revisions[team]!.remainingRisk}
                              </p>
                            </div>
                          </div>
                        )}
                      </section>
                    ))}
                  </div>
                )}
                {view === "blueprint" && session.blueprint && (
                  <BlueprintView
                    blueprint={session.blueprint}
                    onChange={(b) => save({ ...session, blueprint: b })}
                    onExport={exportBrief}
                    onCopy={copyBrief}
                  />
                )}
                {busy && (
                  <div className="loading-banner" role="status">
                    <Loader2 size={22} className="spin" />
                    <div>
                      <strong>
                        {busy === "blueprint"
                          ? "Orbit is connecting the strongest ideas…"
                          : busy === "opening"
                            ? "Two independent perspectives are taking shape…"
                            : busy === "crossfire"
                              ? "The agents are challenging specific claims…"
                              : "Your agents are revisiting their positions…"}
                      </strong>
                      <p>
                        {session.mode === "live"
                          ? "Running through your local Codex account. This may take a minute."
                          : "Playing the illustrative sample."}
                      </p>
                    </div>
                    <button
                      className="secondary-button"
                      onClick={() => controller.current?.abort()}
                    >
                      <Pause size={14} /> Stop
                    </button>
                  </div>
                )}
                {session.phase !== "blueprint" && (
                  <section className="director-panel">
                    <div className="director-title">
                      <span className="director-mini">✳</span>
                      <div>
                        <h3>Your arena. Your direction.</h3>
                        <p>
                          Add a constraint, challenge an assumption, or back an
                          idea.
                        </p>
                      </div>
                      <span className="outline-tag">HUMAN IN THE LOOP</span>
                    </div>
                    <form
                      className="direction-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        addNote();
                      }}
                    >
                      <input
                        aria-label="Your direction for the next round"
                        placeholder="Try: Keep it playful, but no one should need an account…"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={1500}
                        disabled={!!busy}
                      />
                      <button
                        className="secondary-button"
                        disabled={!note.trim() || !!busy}
                        type="submit"
                      >
                        <Send size={14} /> Add direction
                      </button>
                    </form>
                    <div className="quick-directions">
                      <span>QUICK NUDGES</span>
                      {[
                        "Make it simpler",
                        "Challenge the main assumption",
                        "Keep the most original idea",
                      ].map((x) => (
                        <button
                          key={x}
                          disabled={!!busy}
                          onClick={() => addNote(x)}
                        >
                          {x}
                          <Plus size={11} />
                        </button>
                      ))}
                    </div>
                    {session.interventions.length > 0 && (
                      <div className="saved-notes">
                        {session.interventions.map((n, i) => (
                          <div key={i}>
                            <Check size={13} />
                            <span>{n.text}</span>
                            <small>YOUR DIRECTION</small>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
                {nextAction && (
                  <div className="round-footer">
                    <div>
                      <span className="pause-indicator">
                        <Pause size={12} />
                      </span>
                      <p>
                        <strong>
                          {busy
                            ? "The round is in progress"
                            : "Paused for your perspective"}
                        </strong>
                        <span>
                          {busy
                            ? "Your direction is locked while this round runs."
                            : "Nothing moves forward until you say so."}
                        </span>
                      </p>
                    </div>
                    <button
                      className="primary-button"
                      disabled={!!busy || !!note.trim()}
                      title={
                        note.trim()
                          ? "Add or clear your draft direction first"
                          : undefined
                      }
                      onClick={() => void run(nextAction.stage, session)}
                    >
                      {busy ? (
                        <Loader2 className="spin" size={16} />
                      ) : (
                        <Play size={15} />
                      )}{" "}
                      {nextAction.label}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
                {session.phase === "blueprint" && view === "blueprint" && (
                  <div className="finished-note">
                    <CheckCheck size={17} />
                    <span>
                      A stronger starting point—not a verified answer. Test the
                      open assumptions with real people.
                    </span>
                    <button onClick={newArena}>
                      Start another arena <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )
          )}
          {error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={19} />
              <div>
                <strong>Let’s get this back on track.</strong>
                <p>{error}</p>
              </div>
              <button
                className="icon-button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <footer className="page-footer">
            <span>IDEAS ENTER. BETTER IDEAS LEAVE.</span>
            <span>
              Built for a little healthy disagreement{" "}
              <span className="footer-star">✳</span>
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      {modal === "settings" && (
        <Modal title="Your AI connection" onClose={() => setModal(null)}>
          <div
            className={`connection-status ${connection?.available ? "ready" : ""}`}
          >
            <Radio size={20} />
            <div>
              <strong>
                {connection?.available
                  ? "Local Codex is connected"
                  : "Sample experience available"}
              </strong>
              <p>{connection?.reason || "Checking your local connection…"}</p>
            </div>
          </div>
          <p className="modal-description">
            Live debates use the Codex CLI signed in on your computer. Your
            ChatGPT credentials never enter the browser or the GitHub
            repository.
          </p>
          <div className="mode-options">
            <button
              disabled={!!session || !!busy || !connection?.available}
              className={mode === "live" ? "chosen" : ""}
              onClick={() => {
                modeTouched.current = true;
                setMode("live");
              }}
            >
              <Radio size={17} />
              <strong>Live Codex</strong>
              <small>Your prompt, real agent responses</small>
              {mode === "live" && <Check size={16} />}
            </button>
            <button
              disabled={!!session || !!busy}
              className={mode === "sample" ? "chosen" : ""}
              onClick={() => {
                modeTouched.current = true;
                setMode("sample");
              }}
            >
              <Play size={17} />
              <strong>Sample debate</strong>
              <small>An authored walkthrough, no usage</small>
              {mode === "sample" && <Check size={16} />}
            </button>
          </div>
          {session && (
            <p className="help-text">
              Start a new arena to change its connection mode.
            </p>
          )}
          <details className="model-settings">
            <summary>
              Model preferences <ChevronDown size={14} />
            </summary>
            <p className="help-text">
              Optional Codex model IDs. Leave blank to use your configured Codex
              model. You can choose a lighter moderator model available to your
              account.
            </p>
            <label>
              Team agents
              <input
                value={models.team}
                onChange={(e) => setModels({ ...models, team: e.target.value })}
                placeholder="Codex default"
                maxLength={80}
              />
            </label>
            <label>
              Moderator
              <input
                value={models.moderator}
                onChange={(e) =>
                  setModels({ ...models, moderator: e.target.value })
                }
                placeholder="Codex default"
                maxLength={80}
              />
            </label>
          </details>
          <div className="setup-instructions">
            <strong>Run live on your computer</strong>
            <code>
              npm ci
              <br />
              npm run local
            </code>
            <p>
              Open the local URL printed in your terminal. Live debates consume
              your existing Codex allowance. The hosted preview runs sample mode
              only.
            </p>
          </div>
          <div className="modal-actions">
            <button
              className="secondary-button"
              onClick={() => void checkConnection()}
            >
              <RotateCcw size={14} /> Check connection
            </button>
            <button
              className="primary-button"
              onClick={() => {
                try {
                  localStorage.setItem(
                    "agent-arena.models",
                    JSON.stringify(models),
                  );
                  setToast("Connection preferences saved.");
                } catch {
                  setToast("Settings could not be saved in this browser.");
                }
                setModal(null);
              }}
            >
              Done <Check size={14} />
            </button>
          </div>
        </Modal>
      )}
      {modal === "guide" && (
        <Modal
          title="A little friction goes a long way."
          onClose={() => setModal(null)}
        >
          <p className="modal-description">
            Agent Arena turns a rough prompt into a stronger product concept.
            Two independent perspectives, one moderator, and you in charge.
          </p>
          <div className="guide-steps">
            {[
              [
                "Set the mission",
                "Tell the agents what you want to make. Review Orbit’s questions and success criteria.",
              ],
              [
                "Let two perspectives collide",
                "Spark and Anchor propose independently, then challenge specific claims with constructive alternatives.",
              ],
              [
                "Put your perspective in the mix",
                "Pin useful ideas and add direction between rounds. Nothing continues without your say-so.",
              ],
              [
                "Leave with a blueprint",
                "The agents revise. Orbit assembles a brief you can edit, copy, or export.",
              ],
            ].map(([title, body], i) => (
              <div key={title}>
                <span>{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="guide-note">
            <Lightbulb size={20} />
            <p>
              Agent personalities are perspectives, not separate model brands.
              Debate can expose assumptions; it cannot verify facts by agreement
              alone.
            </p>
          </div>
          <button
            className="primary-button full-width"
            onClick={() => setModal(null)}
          >
            Got it. Let’s make something. <ArrowRight size={16} />
          </button>
        </Modal>
      )}
      {modal === "missions" && (
        <Modal title="Pick a starting point." onClose={() => setModal(null)}>
          <p className="modal-description">
            Use one of these missions, then make it your own. Custom missions
            require the local Codex connection.
          </p>
          {[
            samplePrompt,
            "Design a playful way for a neighborhood to share useful things instead of buying them.",
            "Create an interactive museum experience that makes a complex scientific idea understandable to children.",
          ].map((x, i) => (
            <button
              className="mission-template"
              disabled={!!busy}
              key={x}
              onClick={() => {
                newArena();
                setPrompt(x);
                if (connection?.available) {
                  modeTouched.current = true;
                  setMode("live");
                }
                setModal(null);
              }}
            >
              <span>0{i + 1}</span>
              <strong>{x}</strong>
              <ArrowUpRight size={18} />
            </button>
          ))}
          <button
            className="secondary-button full-width"
            disabled={!!busy}
            onClick={() => {
              setModal(null);
              start(true);
            }}
          >
            <Play size={15} /> Explore the authored sample instead
          </button>
        </Modal>
      )}
    </div>
  );
}

function BlueprintView({
  blueprint: b,
  onChange,
  onExport,
  onCopy,
}: {
  blueprint: Blueprint;
  onChange: (b: Blueprint) => void;
  onExport: () => void;
  onCopy: () => void;
}) {
  const [editing, setEditing] = useState(false);
  function section(
    key: "features" | "journey" | "decisions" | "questions" | "nextSteps",
    title: string,
    icon: ReactNode,
  ) {
    return (
      <section className={`blueprint-section ${key}`}>
        <h3>
          {icon}
          {title}
        </h3>
        {editing ? (
          <textarea
            aria-label={title}
            value={b[key].join("\n")}
            onChange={(e) =>
              onChange({ ...b, [key]: e.target.value.split("\n").slice(0, 20) })
            }
            rows={Math.max(3, b[key].length + 1)}
          />
        ) : (
          <ul>
            {b[key].map((item, i) => (
              <li key={i}>
                {key === "journey" ? (
                  <span className="journey-number">{i + 1}</span>
                ) : (
                  <span className="list-dot" />
                )}
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }
  return (
    <article className="blueprint">
      <div className="blueprint-toolbar">
        <span>
          <FileText size={15} /> THE SHARED BLUEPRINT{" "}
          <span className="draft-tag">DRAFT</span>
        </span>
        <div>
          <button className="text-button" onClick={() => setEditing(!editing)}>
            {editing ? <Check size={14} /> : <Pencil size={14} />}{" "}
            {editing ? "Done editing" : "Edit"}
          </button>
          <button className="text-button" onClick={onCopy}>
            <Copy size={14} /> Copy
          </button>
          <button className="secondary-button" onClick={onExport}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>
      <div className="blueprint-content">
        <div className="blueprint-kicker">
          <span>✳</span> TWO PERSPECTIVES. A NEW POSSIBILITY.
        </div>
        {editing ? (
          <>
            <input
              className="blueprint-title-input"
              aria-label="Blueprint title"
              value={b.title}
              onChange={(e) => onChange({ ...b, title: e.target.value })}
            />
            <input
              aria-label="Blueprint tagline"
              value={b.tagline}
              onChange={(e) => onChange({ ...b, tagline: e.target.value })}
            />
            <textarea
              aria-label="Blueprint summary"
              value={b.summary}
              onChange={(e) => onChange({ ...b, summary: e.target.value })}
            />
          </>
        ) : (
          <>
            <h2>{b.title}</h2>
            <p className="blueprint-tagline">{b.tagline}</p>
            <p className="blueprint-summary">{b.summary}</p>
          </>
        )}
        <div className="audience-box">
          <small>WHO IT’S FOR</small>
          {editing ? (
            <textarea
              aria-label="Target audience"
              value={b.audience}
              onChange={(e) => onChange({ ...b, audience: e.target.value })}
            />
          ) : (
            <p>{b.audience}</p>
          )}
        </div>
        <div className="blueprint-columns">
          {section("features", "The core experience", <Sparkles size={17} />)}
          {section("journey", "How it works", <ArrowRight size={17} />)}
        </div>
        {section("decisions", "What the debate changed", <Swords size={17} />)}
        <div className="blueprint-columns">
          {section("questions", "Still worth asking", <CircleHelp size={17} />)}
          {section("nextSteps", "Make it real", <Flag size={17} />)}
        </div>
        <div className="blueprint-signature">
          <div>
            <AgentAvatar team="spark" size={29} />
            <AgentAvatar team="anchor" size={29} />
            <AgentAvatar team="moderator" size={25} />
          </div>
          <span>
            Challenged by Spark & Anchor. Connected by Orbit. Directed by you.
          </span>
        </div>
      </div>
    </article>
  );
}
