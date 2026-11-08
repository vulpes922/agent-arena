"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Pause,
  Play,
  Download,
  Settings2,
  X,
  Check,
  Loader2,
} from "lucide-react";
import {
  runConversation,
  conversationMarkdown,
  rolesForConversation,
} from "@/lib/conversation.mjs";
import { sampleMission, sampleReplies } from "@/lib/conversation-sample";
import "./conversation.css";

type Speaker = "spark" | "anchor" | "user" | "moderator";
type Message = {
  id: string;
  speaker: Speaker;
  text: string;
  model?: string;
  at: number;
};
type Chat = {
  id: string;
  prompt: string;
  mode: "live" | "sample";
  roles: { spark: string; anchor: string };
  models: { spark: string; anchor: string; moderator: string };
  messages: Message[];
  updatedAt: number;
};
type Status = {
  available: boolean;
  reason: string;
  defaultModel?: string;
  models?: { id: string; name: string }[];
};
const KEY = "agent-arena.conversations.v1";
const names = {
  spark: "Spark",
  anchor: "Anchor",
  user: "You",
  moderator: "Orbit",
};
const defaults = { spark: "", anchor: "", moderator: "" };

export default function Conversation() {
  const [chat, setChat] = useState<Chat | null>(null);
  const [history, setHistory] = useState<Chat[]>([]);
  const [draft, setDraft] = useState("");
  const [models, setModels] = useState(defaults);
  const [roles, setRoles] = useState({
    spark: "Visionary",
    anchor: "Pragmatist",
  });
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<Speaker | null>(null);
  const [settings, setSettings] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(true);
  const current = useRef<Chat | null>(null);
  const running = useRef<AbortController | null>(null);
  const tail = useRef<HTMLDivElement>(null);
  const settingsPanel = useRef<HTMLElement>(null);
  const follow = useRef(true);

  async function refreshStatus() {
    try {
      const res = await fetch("/api/arena/status");
      if (!res.ok) throw Error();
      setStatus(await res.json());
    } catch {
      setStatus({
        available: false,
        reason:
          "Local server unavailable. Start npm run local in your terminal.",
      });
    }
  }
  useEffect(() => {
    void refreshStatus();
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(stored))
        setHistory(
          stored
            .filter(
              (s) => s && typeof s.id === "string" && Array.isArray(s.messages),
            )
            .slice(0, 12),
        );
      const prefs = JSON.parse(localStorage.getItem(KEY + ".models") || "null");
      if (
        prefs &&
        ["spark", "anchor", "moderator"].every(
          (k) => typeof prefs[k] === "string",
        )
      )
        setModels(prefs);
    } catch {
      setNotice(
        "Saved conversations could not be read. You can still start a new one.",
      );
    }
    const scroll = () => {
      follow.current =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 180;
      setFollowing(follow.current);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      running.current?.abort();
      window.removeEventListener("scroll", scroll);
    };
  }, []);
  useEffect(() => {
    if (follow.current)
      tail.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat?.messages.length, busy]);
  useEffect(() => {
    if (!settings) return;
    const previous = document.activeElement as HTMLElement | null;
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettings(false);
      if (e.key !== "Tab") return;
      const items = Array.from(
        settingsPanel.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], summary",
        ) || [],
      ).filter((el) => el.getClientRects().length > 0);
      const first = items[0],
        last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [settings]);

  function save(s: Chat) {
    current.current = s;
    setChat(s);
    try {
      const disk = JSON.parse(localStorage.getItem(KEY) || "[]");
      const merged = new Map<string, Chat>();
      for (const item of [
        ...history,
        ...(Array.isArray(disk) ? disk : []),
        s,
      ]) {
        if (
          item?.id &&
          Array.isArray(item.messages) &&
          (!merged.has(item.id) ||
            item.updatedAt >= merged.get(item.id)!.updatedAt)
        )
          merged.set(item.id, item);
      }
      const all = [...merged.values()]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 12);
      localStorage.setItem(KEY, JSON.stringify(all));
      setHistory(all);
    } catch {
      setNotice(
        "Browser storage is full or unavailable. Export this conversation to keep it.",
      );
    }
  }
  function pause() {
    running.current?.abort();
    running.current = null;
    setBusy(null);
    setNotice("Paused. Continue whenever you’re ready.");
  }
  async function generate(
    body: { stage: string; team?: string; model?: string; session: Chat },
    signal: AbortSignal,
  ) {
    setBusy(body.stage === "summary" ? "moderator" : (body.team as Speaker));
    if (body.session.mode === "sample") {
      await new Promise<void>((resolve, reject) => {
        const abort = () => {
          clearTimeout(timer);
          reject(new DOMException("Stopped", "AbortError"));
        };
        const timer = setTimeout(() => {
          signal.removeEventListener("abort", abort);
          resolve();
        }, 850);
        signal.addEventListener("abort", abort, { once: true });
        if (signal.aborted) abort();
      });
      if (body.stage === "summary")
        return {
          text: "A shared link lets friends choose between two activity cards. A deadline ends the vote; the winning card becomes an invitation. Keep the surprise optional and practical details visible.\n\nStart with organizer-written plans and one real group. Test whether mystery helps people commit or simply adds friction.",
          model: "Authored sample",
        };
      const index = body.session.messages.filter(
        (m) => m.speaker === "spark" || m.speaker === "anchor",
      ).length;
      return { text: sampleReplies[index], model: "Authored sample" };
    }
    // Context is bounded without removing anything from the visible/exported transcript.
    const recent = body.session.messages.slice(-20);
    const earlier = body.session.messages
      .slice(0, -20)
      .filter((m) => m.speaker === "user");
    const res = await fetch("/api/arena/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        ...body,
        session: { ...body.session, messages: [...earlier, ...recent] },
      }),
    });
    const data = (await res.json()) as {
      error?: string;
      result: { text: string; model?: string };
    };
    if (!res.ok)
      throw Error(
        data.error ||
          "This reply failed. You can continue from the last completed message.",
      );
    return data.result;
  }
  async function continueChat(s = current.current) {
    if (!s || running.current) return;
    if (s.mode === "live" && !status?.available) {
      setError(status?.reason || "Check your local connection.");
      setSettings(true);
      return;
    }
    const count = s.messages.filter(
      (m) => m.speaker === "spark" || m.speaker === "anchor",
    ).length;
    if (s.mode === "sample" && count >= sampleReplies.length) {
      setNotice(
        "Sample complete. Start a new live conversation with your own idea.",
      );
      return;
    }
    const controller = new AbortController();
    running.current = controller;
    setError("");
    setNotice("");
    follow.current = true;
    try {
      await runConversation({
        session: s,
        turns:
          s.mode === "sample" ? Math.min(6, sampleReplies.length - count) : 6,
        signal: controller.signal,
        generate,
        onMessage: (next: Chat) => save(next),
      });
      if (!controller.signal.aborted)
        setNotice(
          s.mode === "sample"
            ? "Sample complete. This was an authored conversation."
            : "Six replies complete. Continue the conversation or add your direction.",
        );
    } catch (e) {
      if (!controller.signal.aborted)
        setError(
          e instanceof Error ? e.message : "Reply failed. Try Continue.",
        );
    } finally {
      if (running.current === controller) {
        running.current = null;
        setBusy(null);
      }
    }
  }
  function start(sample = false) {
    if (running.current) return;
    if (!sample && draft.trim().length < 10) {
      setError("Describe your idea in at least 10 characters.");
      return;
    }
    const s: Chat = {
      id: crypto.randomUUID(),
      prompt: sample ? sampleMission : draft.trim(),
      mode: sample ? "sample" : "live",
      roles: { ...roles },
      models: { ...models },
      messages: [],
      updatedAt: Date.now(),
    };
    save(s);
    setDraft("");
    void continueChat(s);
  }
  function direct() {
    if (!draft.trim() || !current.current) return;
    pause();
    const s = current.current;
    if (s.messages.filter((m) => m.speaker === "user").length >= 30) {
      setError(
        "This conversation has 30 directions. Start a new one with your latest brief.",
      );
      return;
    }
    save({
      ...s,
      updatedAt: Date.now(),
      messages: [
        ...s.messages,
        {
          id: crypto.randomUUID(),
          speaker: "user",
          text: draft.trim(),
          at: Date.now(),
        },
      ],
    });
    setDraft("");
    setNotice("Direction added. Continue to let the agents respond.");
    setError("");
    follow.current = true;
  }
  async function summarize() {
    const s = current.current;
    if (!s || running.current) return;
    const controller = new AbortController();
    running.current = controller;
    setError("");
    setNotice("");
    try {
      const result = await generate(
        { stage: "summary", model: s.models.moderator, session: s },
        controller.signal,
      );
      if (!controller.signal.aborted) {
        save({
          ...s,
          updatedAt: Date.now(),
          messages: [
            ...s.messages,
            {
              id: crypto.randomUUID(),
              speaker: "moderator",
              text: result.text,
              model: result.model,
              at: Date.now(),
            },
          ],
        });
        setNotice("Summary added. You can keep the conversation going.");
      }
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "Summary failed.");
    } finally {
      if (running.current === controller) {
        running.current = null;
        setBusy(null);
      }
    }
  }
  function changeModel(who: keyof typeof models, value: string) {
    const next = { ...models, [who]: value };
    setModels(next);
    try {
      localStorage.setItem(KEY + ".models", JSON.stringify(next));
    } catch {}
    if (current.current)
      save({ ...current.current, models: next, updatedAt: Date.now() });
  }
  function exportChat() {
    if (!chat) return;
    const url = URL.createObjectURL(
      new Blob([conversationMarkdown(chat)], { type: "text/markdown" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "agent-arena-conversation.md";
    a.click();
    URL.revokeObjectURL(url);
  }
  const activeRoles = chat?.roles || roles;
  const activeModels = chat?.models || models;
  const sampleDone =
    chat?.mode === "sample" &&
    chat.messages.filter((m) => m.speaker === "spark" || m.speaker === "anchor")
      .length >= sampleReplies.length;
  const participants = (
    <nav className="debate-participants" aria-label="Debate participants">
      <button
        className={`participant spark ${busy === "spark" ? "speaking" : ""}`}
        onClick={() => setSettings(true)}
        aria-label="Spark, side A. Open agent settings"
      >
        <span className="participant-symbol" aria-hidden="true">
          ✳
        </span>
        <strong>Spark</strong>
        <span className="participant-role">Side A · {activeRoles.spark}</span>
      </button>
      <div className="debate-middle">
        <span className="debate-versus" aria-hidden="true">
          vs
        </span>
        <button
          className={`participant orbit ${busy === "moderator" ? "speaking" : ""}`}
          onClick={() => setSettings(true)}
          aria-label="Orbit, moderator. Open agent settings"
        >
          <span className="orbit-name">
            <span aria-hidden="true">○</span> Orbit
          </span>
          <span className="participant-role">Moderator</span>
        </button>
      </div>
      <button
        className={`participant anchor ${busy === "anchor" ? "speaking" : ""}`}
        onClick={() => setSettings(true)}
        aria-label="Anchor, side B. Open agent settings"
      >
        <span className="participant-symbol" aria-hidden="true">
          ✦
        </span>
        <strong>Anchor</strong>
        <span className="participant-role">Side B · {activeRoles.anchor}</span>
      </button>
    </nav>
  );
  return (
    <div className="conversation-app">
      <header className="chat-header">
        <a href="/" className="chat-brand">
          arena<span>↗</span>
        </a>
        <div className="header-actions">
          <span className="connection-label">
            <i className={status?.available ? "online" : ""} />
            {chat?.mode === "sample"
              ? "Sample"
              : status?.available
                ? "Local · connected"
                : "Local · offline"}
          </span>
          <button
            aria-label="Agent settings"
            title="Agent settings"
            onClick={() => setSettings(!settings)}
          >
            <Settings2 size={17} />
          </button>
          <button
            aria-label="New conversation"
            title="New conversation"
            disabled={!!busy}
            onClick={() => {
              current.current = null;
              setChat(null);
              setDraft("");
              setNotice("");
              setError("");
            }}
          >
            <Plus size={20} />
          </button>
        </div>
      </header>
      {chat && <div className="debate-roster">{participants}</div>}
      <main className="chat-main">
        {!chat ? (
          <section className="empty-chat">
            {participants}
            <p className="chat-eyebrow">TWO SIDES. ONE MODERATOR.</p>
            <h1>
              Let the ideas
              <br />
              talk it out.
            </h1>
            <p>
              Spark and Anchor debate your idea.
              <br />
              Ask Orbit to bring the strongest points together.
            </p>
          </section>
        ) : (
          <section className="transcript" aria-label="Conversation">
            <div className="mission-message">
              <span className="message-name">
                You <span className="message-detail">set the idea</span>
              </span>
              <h1>{chat.prompt}</h1>
              {chat.mode === "sample" && (
                <p className="sample-label">
                  Authored sample · no live AI · directions do not change these
                  replies
                </p>
              )}
            </div>
            {chat.messages.map((m) => (
              <article className={`chat-message ${m.speaker}`} key={m.id}>
                <div className={`message-avatar ${m.speaker}`}>
                  {m.speaker === "spark"
                    ? "✳"
                    : m.speaker === "anchor"
                      ? "✦"
                      : m.speaker === "moderator"
                        ? "○"
                        : "↗"}
                </div>
                <div className="message-body">
                  <div className="message-meta">
                    <strong>{names[m.speaker]}</strong>
                    <span>
                      {m.speaker === "spark" || m.speaker === "anchor"
                        ? `${m.speaker === "spark" ? "Side A" : "Side B"} · ${activeRoles[m.speaker]}`
                        : m.speaker === "moderator"
                          ? "Moderator · recap"
                          : "Direction"}
                    </span>
                    {m.model && (
                      <span className="message-model">{m.model}</span>
                    )}
                  </div>
                  <div className="message-text">
                    {m.text.split(/\n\s*\n/).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </div>
              </article>
            ))}
            {busy && (
              <div className={`chat-message ${busy}`} role="status">
                <div className={`message-avatar ${busy}`}>
                  {busy === "spark" ? "✳" : busy === "anchor" ? "✦" : "○"}
                </div>
                <div className="message-body">
                  <div className="message-meta">
                    <strong>{names[busy]}</strong>
                    <span>
                      {busy === "moderator"
                        ? "Moderator · finding common ground"
                        : `${busy === "spark" ? "Side A" : "Side B"} · preparing a reply`}
                    </span>
                  </div>
                  <div className="thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
        {error && (
          <div className="chat-error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <p className="chat-notice" role="status">
            {notice}
          </p>
        )}
        <div ref={tail} style={{ scrollMarginBottom: 280 }} />
      </main>
      <footer className="composer-dock">
        <div className="composer-inner">
          {chat && (
            <div className="conversation-controls">
              <div>
                {busy ? (
                  <button className="pause-button" onClick={pause}>
                    <Pause size={14} /> Pause
                  </button>
                ) : (
                  <button
                    className="continue-button"
                    onClick={() => void continueChat()}
                    disabled={sampleDone}
                  >
                    <Play size={14} /> Continue
                  </button>
                )}
                <button
                  disabled={
                    !!busy || !chat.messages.some((m) => m.speaker === "anchor")
                  }
                  onClick={() => void summarize()}
                  title="Ask the moderator to summarize both sides"
                >
                  <span aria-hidden="true">○</span> Ask Orbit
                </button>
              </div>
              <div>
                {!following && (
                  <button
                    aria-label="Jump to latest reply"
                    onClick={() => {
                      follow.current = true;
                      setFollowing(true);
                      tail.current?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <ArrowDown size={15} />
                  </button>
                )}
                <button
                  aria-label="Export conversation"
                  title="Export conversation"
                  onClick={exportChat}
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          )}
          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              chat ? direct() : start();
            }}
          >
            <textarea
              aria-label={chat ? "Your direction" : "What do you want to make?"}
              placeholder={
                chat ? "Jump in with a direction…" : "What do you want to make?"
              }
              value={draft}
              maxLength={chat ? 1500 : 4000}
              rows={2}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  if (draft.trim()) chat ? direct() : start();
                }
              }}
            />
            <button
              type="submit"
              className="send-button"
              aria-label={
                chat ? "Add direction and pause" : "Start live conversation"
              }
              disabled={
                !draft.trim() || (!chat && (!status?.available || !!busy))
              }
            >
              <ArrowUp size={19} />
            </button>
          </form>
          <div className="composer-caption">
            <span>
              {chat
                ? busy
                  ? "Replies appear as each agent finishes. Your direction pauses the debate."
                  : chat.mode === "sample"
                    ? "Sample conversation · no model usage"
                    : "Up to 6 replies per run · uses your Codex allowance"
                : "You set the direction. They debate it."}
            </span>
            {!chat && (
              <button onClick={() => start(true)}>Try a sample ↗</button>
            )}
          </div>
          {!chat && history.length > 0 && (
            <details className="chat-history">
              <summary>
                Recent conversations <span>{history.length}</span>
              </summary>
              {history.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    current.current = s;
                    setChat(s);
                    setModels(s.models);
                    setDraft("");
                    setNotice("Restored. Continue when you’re ready.");
                  }}
                >
                  {s.prompt}
                  <small>
                    {s.mode === "sample" ? "Sample" : "Live"} ·{" "}
                    {s.messages.length} messages
                  </small>
                </button>
              ))}
            </details>
          )}
        </div>
      </footer>
      {settings && (
        <div className="settings-shade" onClick={() => setSettings(false)}>
          <section
            ref={settingsPanel}
            className="chat-settings"
            role="dialog"
            aria-modal="true"
            aria-label="Agent settings"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSettings(false);
            }}
          >
            <header>
              <h2>Your debate team</h2>
              <button
                aria-label="Close settings"
                onClick={() => setSettings(false)}
                autoFocus
              >
                <X size={19} />
              </button>
            </header>
            <p>
              Two debating agents, with Orbit as moderator. Choose their models
              and perspectives.
            </p>
            {(["spark", "anchor"] as const).map((who) => (
              <div className="agent-preferences" key={who}>
                <div className={`pref-name ${who}`}>
                  <span>{who === "spark" ? "✳" : "✦"}</span>
                  <strong>{names[who]}</strong>
                </div>
                <label>
                  Perspective
                  <select
                    aria-label={`${names[who]} perspective`}
                    disabled={!!chat}
                    value={activeRoles[who]}
                    onChange={(e) =>
                      setRoles({ ...roles, [who]: e.target.value })
                    }
                  >
                    {rolesForConversation.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Model
                  <input
                    aria-label={`${names[who]} model`}
                    list="available-models"
                    value={activeModels[who]}
                    disabled={!!busy}
                    maxLength={80}
                    placeholder={status?.defaultModel || "Codex default"}
                    onChange={(e) => changeModel(who, e.target.value)}
                  />
                </label>
              </div>
            ))}
            <details>
              <summary>Orbit · moderator model</summary>
              <label>
                Orbit · used only when you summarize
                <input
                  list="available-models"
                  disabled={!!busy}
                  value={activeModels.moderator}
                  maxLength={80}
                  placeholder={status?.defaultModel || "Codex default"}
                  onChange={(e) => changeModel("moderator", e.target.value)}
                />
              </label>
            </details>
            <datalist id="available-models">
              {status?.models?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </datalist>
            <p className="settings-help">
              Suggestions come from your local Codex model cache. Availability
              depends on your account. Leave blank to use{" "}
              {status?.defaultModel || "the Codex default"}. Pause to change
              models; previous replies keep their model labels.
            </p>
            <div className="settings-connection">
              <span>
                {status?.available ? (
                  <Check size={14} />
                ) : (
                  <Loader2 size={14} />
                )}{" "}
                {status?.reason || "Checking your account…"}
              </span>
              <button onClick={() => void refreshStatus()}>Refresh</button>
            </div>
            {!status?.available && (
              <code>
                npm ci
                <br />
                npm run local
              </code>
            )}
            <a className="classic-link" href="/classic">
              Open the original staged prototype ↗
            </a>
          </section>
        </div>
      )}
    </div>
  );
}
