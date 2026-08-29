"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { evenSplitTarget, personalBests, sumOfBest, type RunWithSplits } from "@/lib/analytics";
import { fontCss } from "@/lib/fonts";
import { formatSignedDelta, formatTime } from "@/lib/format-time";
import {
  clearLiveRun,
  isRunValid,
  readLiveRun,
  writeLiveRun,
  type LiveRunState,
} from "@/lib/live-run";
import { abandonRun, persistLiveRun } from "@/app/actions/runs";
import { updateSettings } from "@/app/actions/settings";
import type { Category, Section, UserSettings } from "@/lib/database.types";

type Props = {
  category: Category;
  profileName: string;
  sections: Section[];
  settings: UserSettings;
  history: RunWithSplits[];
  overlay?: boolean;
};

type DeltaTone = "gold" | "green" | "red" | "neutral";

export function RunBoard({
  category,
  profileName,
  sections,
  settings,
  history,
  overlay = false,
}: Props) {
  const [live, setLive] = useState<LiveRunState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [settingsState, setSettingsState] = useState(settings);
  const [saveStatus, setSaveStatus] = useState<
  "idle" | "saving" | "saved" | "error"
>("idle");

  const [saveError, setSaveError] = useState<string | null>(null);

  const [failedAbandonRunId, setFailedAbandonRunId] = useState<string | null>(
    null
  );
  const undoStack = useRef<(LiveRunState | null)[]>([]);
  const persistTimer = useRef<number | null>(null);

  useEffect(() => {
    setLive(readLiveRun(category.id));
  }, [category.id]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setNow(Date.now());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const persistRun = useCallback(
  async (state: LiveRunState) => {
    setSaveStatus("saving");
    setSaveError(null);

    try {
      const result = await persistLiveRun(state, sections.length);

      if (result.error) {
        setSaveStatus("error");
        setSaveError(result.error);
        return result;
      }

      setSaveStatus("saved");
      setSaveError(null);

      return result;
    } catch (error) {
      console.error("Unexpected error while saving run:", error);

      const message = "Your run could not be saved. Please try again.";

      setSaveStatus("error");
      setSaveError(message);

      return {
        error: message,
        runId: state.runId,
      };
    }
  },
  [sections.length]
);

  const queuePersist = useCallback(
  (state: LiveRunState) => {
    writeLiveRun(state);

    if (persistTimer.current) {
      window.clearTimeout(persistTimer.current);
    }

    persistTimer.current = window.setTimeout(() => {
      void persistRun(state).then((result) => {
        if (result.runId && result.runId !== state.runId) {
          const next = {
            ...state,
            runId: result.runId,
          };

          writeLiveRun(next);

          setLive((current) =>
            current && current.startedAt === state.startedAt
              ? next
              : current
          );
        }
      });
    }, 250);
  },
  [persistRun]
);

  const abandonSavedRun = useCallback(
    async (runId: string) => {
      try {
        const result = await abandonRun(runId, category.id);

        if (result.error) {
          setSaveStatus("error");
          setSaveError(result.error);
          setFailedAbandonRunId(runId);

          return false;
        }

        setFailedAbandonRunId(null);

        return true;
      } catch (error) {
        console.error("Unexpected error while abandoning run:", error);

        setSaveStatus("error");
        setSaveError(
          "The timer was reset, but the saved run could not be removed."
        );
        setFailedAbandonRunId(runId);

        return false;
      }
    },
    [category.id]
  );

  const commit = useCallback(
      (next: LiveRunState | null, previous: LiveRunState | null) => {
      undoStack.current.push(previous ? structuredClone(previous) : null);

      setLive(next);

      if (next) {
        queuePersist(next);
      } else {
        clearLiveRun(category.id);

        if (previous?.runId) {
          void abandonSavedRun(previous.runId);
        }
      }

      },
      [abandonSavedRun, category.id, queuePersist],
      );

  const elapsedMs = live
    ? live.status === "running"
      ? Math.max(0, now - live.startedAt)
      : live.splits.reduce((sum, split) => sum + (split?.timeMs ?? 0), 0)
    : 0;

  const currentSegmentMs = useMemo(() => {
    if (!live || live.status !== "running") return 0;
    const previous = live.splits.reduce((sum, split) => sum + (split?.timeMs ?? 0), 0);
    return Math.max(0, elapsedMs - previous);
  }, [elapsedMs, live]);

  const best = useMemo(() => personalBests(history, sections), [history, sections]);
  const sob = useMemo(() => sumOfBest(best, sections), [best, sections]);
  const targetSegment = evenSplitTarget(category.target_time_ms, sections.length);

  const start = useCallback(() => {
    if (sections.length === 0) return;
    if (live) {
      void persistRun({ ...live, status: "stopped" });
    }
    const next: LiveRunState = {
      runId: null,
      categoryId: category.id,
      startedAt: Date.now(),
      status: "running",
      currentSectionIndex: 0,
      splits: Array(sections.length).fill(null),
    };
    commit(next, live);
  }, [category.id, commit, live, sections.length]);

  const split = useCallback(() => {
    if (!live || live.status !== "running") return;
    if (live.currentSectionIndex >= sections.length) return;
    const section = sections[live.currentSectionIndex];
    const nextSplits = [...live.splits];
    nextSplits[live.currentSectionIndex] = { sectionId: section.id, timeMs: currentSegmentMs };
    const nextIndex = live.currentSectionIndex + 1;
    const done = nextIndex >= sections.length;
    const next: LiveRunState = {
      ...live,
      splits: nextSplits,
      currentSectionIndex: Math.min(nextIndex, sections.length),
      status: done ? "stopped" : "running",
    };
    commit(next, live);
    if (done) {
      void persistRun(next);
    }
  }, [commit, currentSegmentMs, live, sections]);

  const stop = useCallback(() => {
    if (!live || live.status !== "running") return;
    commit({ ...live, status: "stopped" }, live);
  }, [commit, live]);

  const reset = useCallback(() => {
    if (!live) return;
    commit(null, live);
  }, [commit, live]);

  const nextSection = useCallback(() => {
    if (!live || live.status !== "running") return;
    if (live.currentSectionIndex >= sections.length - 1) return;
    commit(
      {
        ...live,
        currentSectionIndex: live.currentSectionIndex + 1,
      },
      live,
    );
  }, [commit, live, sections.length]);

  const undo = useCallback(() => {
    const previous = undoStack.current.pop();

    if (previous === undefined) return;

    const discarded = live;

    setLive(previous);

    if (previous) {
    queuePersist(previous);
    } else {
    clearLiveRun(category.id);
    }

    if (discarded?.runId && discarded.runId !== previous?.runId) { void abandonSavedRun(discarded.runId); } }, [abandonSavedRun, category.id, live, queuePersist]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const map: Record<string, () => void> = {};
      if (settingsState.shortcut_start) map[settingsState.shortcut_start] = start;
      if (settingsState.shortcut_stop) map[settingsState.shortcut_stop] = stop;
      if (settingsState.shortcut_split) map[settingsState.shortcut_split] = split;
      if (settingsState.shortcut_reset) map[settingsState.shortcut_reset] = reset;
      if (settingsState.shortcut_undo) map[settingsState.shortcut_undo] = undo;
      if (settingsState.shortcut_next_section) {
        map[settingsState.shortcut_next_section] = nextSection;
      }
      const action = map[event.code];
      if (!action) return;
      event.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextSection, reset, settingsState, split, start, stop, undo]);

  function toggleSetting(
    key: "show_best_of" | "show_sum_of_best" | "show_pb_delta" | "show_section_delta" | "compare_mode",
    value: boolean | "pb" | "target",
  ) {
    const next = { ...settingsState, [key]: value } as UserSettings;
    setSettingsState(next);
    void updateSettings({ [key]: value });
  }

  const valid = live ? isRunValid(live.splits, sections.length) && live.status === "stopped" : false;
  const background = overlay
    ? settingsState.transparent_background
      ? "transparent"
      : settingsState.chroma_hex
    : undefined;

  return (
    <div
      className={overlay ? "min-h-screen p-4" : "rounded-xl border border-zinc-800 bg-zinc-950 p-4"}
      style={{
        background,
        fontFamily: fontCss(settingsState.font_family),
        fontSize: `${Number(settingsState.font_scale) * 16}px`,
      }}
    >
      <div className={overlay ? "max-w-xl" : ""}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[0.7em] uppercase tracking-wide text-zinc-400">{profileName}</div>
            <div className="text-[1.1em] font-semibold">{category.name}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[1.8em] tabular-nums leading-none">{formatTime(elapsedMs)}</div>
            <div className="text-[0.7em] text-zinc-400">
              {live?.status === "running"
                ? "Running"
                : live?.status === "stopped"
                  ? valid
                    ? "Valid"
                    : "Invalid"
                  : "Idle"}
            </div>
          </div>
        </div>
          {!overlay && saveStatus !== "idle" && (
                    <div className="mt-2 text-right text-xs">
                      {saveStatus === "saving" && (
                        <span className="text-zinc-400">Saving...</span>
                      )}

                      {saveStatus === "saved" && (
                        <span className="text-zinc-400">Saved</span>
                      )}

                      {saveStatus === "error" && (
                      <div role="alert" className="space-y-2 text-red-400">
                        <p>
                          {saveError ?? "Your run could not be saved."}
                        </p>

                        {failedAbandonRunId && (
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                void abandonSavedRun(failedAbandonRunId);
                              }}
                              className="underline underline-offset-2 hover:text-red-300"
                            >
                              Retry
                            </button>

                            <a
                              href={`/categories/${category.id}/history?highlight=${failedAbandonRunId}`}
                              className="underline underline-offset-2 hover:text-red-300"
                            >
                              Open Run History
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    </div>
          )}
        {settingsState.show_sum_of_best && (
          <div className="mt-2 text-[0.85em] text-zinc-300">
            Sum of Best: {sob == null ? "—" : formatTime(sob)}
            {category.target_time_ms != null && (
              <span className="ml-3 text-zinc-500">Target: {formatTime(category.target_time_ms)}</span>
            )}
          </div>
        )}

        <ol className="mt-3 space-y-1">
          {sections.map((section, index) => {
            const recorded = live?.splits[index] ?? null;
            const isCurrent = live?.status === "running" && live.currentSectionIndex === index;
            const segment = recorded?.timeMs ?? (isCurrent ? currentSegmentMs : null);
            const compareMs =
              settingsState.compare_mode === "target" ? targetSegment : best[section.id];
            const pb = best[section.id];
            let tone: DeltaTone = "neutral";
            let delta: number | null = null;
            if (segment != null && compareMs != null) {
              delta = segment - compareMs;
              if (pb != null && segment <= pb) tone = "gold";
              else if (delta < 0) tone = "green";
              else if (delta > 0) tone = "red";
            }
            const prevSegment = index > 0 ? (live?.splits[index - 1]?.timeMs ?? null) : null;
            const sectionDelta =
              settingsState.show_section_delta && segment != null && prevSegment != null
                ? segment - prevSegment
                : null;

            return (
              <li
                key={section.id}
                className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded px-2 py-1 ${
                  isCurrent ? "bg-white/10" : ""
                }`}
              >
                <span className="truncate">
                  {index + 1}. {section.name}
                </span>
                {settingsState.show_best_of && (
                  <span className="font-mono text-[0.85em] text-zinc-400 tabular-nums">
                    {pb == null ? "—" : formatTime(pb)}
                  </span>
                )}
                <span className={`font-mono tabular-nums ${toneClass(tone)}`}>
                  {segment == null ? "—" : formatTime(segment)}
                </span>
                <span className={`w-28 text-right font-mono text-[0.85em] tabular-nums ${toneClass(tone)}`}>
                  {settingsState.show_pb_delta && delta != null ? formatSignedDelta(delta) : ""}
                  {sectionDelta != null && (
                    <div className="text-zinc-400">{formatSignedDelta(sectionDelta)}</div>
                  )}
                </span>
              </li>
            );
          })}
        </ol>

        {!overlay && (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <TimerButton onClick={start}>Start</TimerButton>
              <TimerButton onClick={split} disabled={!live || live.status !== "running"}>
                Split
              </TimerButton>
              <TimerButton onClick={stop} disabled={!live || live.status !== "running"}>
                Stop
              </TimerButton>
              <TimerButton onClick={nextSection} disabled={!live || live.status !== "running"}>
                Next section
              </TimerButton>
              <TimerButton onClick={reset} disabled={!live}>
                Reset
              </TimerButton>
              <TimerButton onClick={undo}>Undo</TimerButton>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settingsState.show_best_of}
                  onChange={(e) => toggleSetting("show_best_of", e.target.checked)}
                />
                Best of
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settingsState.show_sum_of_best}
                  onChange={(e) => toggleSetting("show_sum_of_best", e.target.checked)}
                />
                Sum of Best
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settingsState.show_pb_delta}
                  onChange={(e) => toggleSetting("show_pb_delta", e.target.checked)}
                />
                Delta vs compare
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settingsState.show_section_delta}
                  onChange={(e) => toggleSetting("show_section_delta", e.target.checked)}
                />
                Delta between sections
              </label>
              <label className="flex items-center gap-2 sm:col-span-2">
                Compare to
                <select
                  className="rounded bg-zinc-900 px-2 py-1"
                  value={settingsState.compare_mode}
                  onChange={(e) => toggleSetting("compare_mode", e.target.value as "pb" | "target")}
                >
                  <option value="pb">Personal best</option>
                  <option value="target">Custom target (even splits)</option>
                </select>
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function toneClass(tone: DeltaTone) {
  if (tone === "gold") return "text-amber-300";
  if (tone === "green") return "text-emerald-400";
  if (tone === "red") return "text-red-400";
  return "text-zinc-100";
}

function TimerButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
