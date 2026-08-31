"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { evenSplitTarget, personalBests, sumOfBest, type RunWithSplits } from "@/lib/analytics";
import { fontCss } from "@/lib/fonts";
import { formatSignedDelta, formatTime } from "@/lib/format-time";
import {
  clearLiveRun,
  readTimerLiveRun,
  writeTimerLiveRun,
  type TimerLiveRunState,
} from "@/lib/live-run";
import {
  canUndo,
  getElapsedMs,
  getTimerSegments,
  isFinalizable,
  isTimerValid,
  pauseTimer,
  resetTimer,
  resumeTimer,
  skipTimer,
  splitTimer,
  startTimer,
  undoTimer,
} from "@/lib/timer-engine";
import {
  finalizeTimerRun,
  incrementAttemptCount,
} from "@/app/actions/runs";
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
    const [live, setLive] = useState<TimerLiveRunState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [settingsState, setSettingsState] = useState(settings);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const finalizingStartedAt = useRef<number | null>(null);

  useEffect(() => {
    setLive(readTimerLiveRun(category.id));
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

  const saveLiveState = useCallback(
    (next: TimerLiveRunState | null) => {
      setLive(next);

      if (next) {
        writeTimerLiveRun(next);
      } else {
        clearLiveRun(category.id);
      }
    },
    [category.id],
  );

  const timer = live?.timer ?? null;

  const elapsedMs = timer
    ? getElapsedMs(timer, now)
    : 0;

  const timerSegments = useMemo(
    () => (timer ? getTimerSegments(timer) : []),
    [timer],
  );

  const currentSectionIndex = timer?.progress.length ?? 0;

  const currentSegmentMs = useMemo(() => {
    if (
      !timer ||
      (timer.status !== "running" && timer.status !== "paused")
    ) {
      return 0;
    }

    const previousBoundaryMs =
      timer.progress.length > 0
        ? timer.progress[timer.progress.length - 1].timeMs
        : 0;

    return Math.max(0, elapsedMs - previousBoundaryMs);
  }, [elapsedMs, timer]);

  const best = useMemo(
    () => personalBests(history, sections),
    [history, sections],
  );

  const sob = useMemo(
    () => sumOfBest(best, sections),
    [best, sections],
  );

  const targetSegment = evenSplitTarget(
    category.target_time_ms,
    sections.length,
  );

  const start = useCallback(() => {
    if (sections.length === 0) return;

    const now = Date.now();

    const nextTimer = startTimer(
      timer ?? {
        status: "idle",
        startedAt: null,
        pausedAt: null,
        totalPausedMs: 0,
        progress: [],
        finishedAt: null,
        finalizeAt: null,
      },
      now,
    );

    if (nextTimer === timer) return;

    finalizingStartedAt.current = null;

    saveLiveState({
      runId: null,
      categoryId: category.id,
      timer: nextTimer,
    });

    setSaveStatus("idle");
    setSaveError(null);

    void (async () => {
      try {
        const result = await incrementAttemptCount(category.id);

        if (result.error) {
          setSaveStatus("error");
          setSaveError(result.error);
        }
      } catch (error) {
        console.error(
          "Unexpected error while counting attempt:",
          error,
        );

        setSaveStatus("error");
        setSaveError(
          "Your attempt could not be counted.",
        );
      }
    })();
  }, [
    category.id,
    saveLiveState,
    sections.length,
    timer,
  ]);

  const split = useCallback(() => {
    if (!live || !timer) return;

    const nextTimer = splitTimer(
      timer,
      sections,
      Date.now(),
    );

    if (nextTimer === timer) return;

    finalizingStartedAt.current = null;

    saveLiveState({
      ...live,
      timer: nextTimer,
    });
  }, [live, saveLiveState, sections, timer]);

  const skip = useCallback(() => {
    if (!live || !timer) return;

    const nextTimer = skipTimer(
      timer,
      sections,
      Date.now(),
    );

    if (nextTimer === timer) return;

    finalizingStartedAt.current = null;

    saveLiveState({
      ...live,
      timer: nextTimer,
    });
  }, [live, saveLiveState, sections, timer]);

  const pauseResume = useCallback(() => {
    if (!live || !timer) return;

    const now = Date.now();

    const nextTimer =
      timer.status === "running"
        ? pauseTimer(timer, now)
        : timer.status === "paused"
          ? resumeTimer(timer, now)
          : timer;

    if (nextTimer === timer) return;

    saveLiveState({
      ...live,
      timer: nextTimer,
    });
  }, [live, saveLiveState, timer]);

  const undo = useCallback(() => {
    if (!live || !timer) return;

    const nextTimer = undoTimer(
      timer,
      Date.now(),
    );

    if (nextTimer === timer) return;

    finalizingStartedAt.current = null;

    saveLiveState({
      ...live,
      runId: null,
      timer: nextTimer,
    });

    setSaveStatus("idle");
    setSaveError(null);
  }, [live, saveLiveState, timer]);

  const reset = useCallback(() => {
    if (!live || !timer) return;

    const nextTimer = resetTimer(timer);

    if (nextTimer === timer) return;

    finalizingStartedAt.current = null;

    saveLiveState(null);

    setSaveStatus("idle");
    setSaveError(null);
  }, [live, saveLiveState, timer]);

  useEffect(() => {
    if (
      !live ||
      !timer ||
      !isFinalizable(timer, now) ||
      timer.startedAt === null
    ) {
      return;
    }

    if (finalizingStartedAt.current === timer.startedAt) {
      return;
    }

    finalizingStartedAt.current = timer.startedAt;

    setSaveStatus("saving");
    setSaveError(null);

    void (async () => {
      try {
        const result = await finalizeTimerRun(
          category.id,
          timer,
        );

        if (result.error) {
          finalizingStartedAt.current = null;
          setSaveStatus("error");
          setSaveError(result.error);
          return;
        }

        setSaveStatus("saved");
        setSaveError(null);

        clearLiveRun(category.id);

        setLive((current) => {
          if (
            current?.timer.startedAt !== timer.startedAt
          ) {
            return current;
          }

          return null;
        });
      } catch (error) {
        console.error(
          "Unexpected error while finalizing run:",
          error,
        );

        finalizingStartedAt.current = null;
        setSaveStatus("error");
        setSaveError(
          "Your run could not be saved. Please try again.",
        );
      }
    })();
  }, [category.id, live, now, timer]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target &&
        (
          ["INPUT", "TEXTAREA", "SELECT"].includes(
            target.tagName,
          ) ||
          target.isContentEditable
        )
      ) {
        return;
      }

      const map: Record<string, () => void> = {};

      // Temporary compatibility with the existing settings model.
      if (settingsState.shortcut_start) {
        map[settingsState.shortcut_start] =
          timer?.status === "running"
            ? split
            : start;
      }

      if (settingsState.shortcut_split) {
        map[settingsState.shortcut_split] = split;
      }

      if (settingsState.shortcut_reset) {
        map[settingsState.shortcut_reset] = reset;
      }

      if (settingsState.shortcut_undo) {
        map[settingsState.shortcut_undo] = undo;
      }

      if (settingsState.shortcut_next_section) {
        map[settingsState.shortcut_next_section] = skip;
      }

      const action = map[event.code];

      if (!action) return;

      event.preventDefault();
      action();
    };

    window.addEventListener("keydown", onKey);

    return () =>
      window.removeEventListener("keydown", onKey);
  }, [
    reset,
    settingsState,
    skip,
    split,
    start,
    timer?.status,
    undo,
  ]);

  function toggleSetting(
      key:
        | "show_best_of"
        | "show_sum_of_best"
        | "show_pb_delta"
        | "show_section_delta"
        | "compare_mode",
      value: boolean | "pb" | "target",
    ) {
      const previous = settingsState;
      const next = { ...settingsState, [key]: value } as UserSettings;

      setSettingsState(next);

      void (async () => {
        try {
          const result = await updateSettings({ [key]: value });

          if (result.error) {
            setSettingsState(previous);
            setSaveStatus("error");
            setSaveError(result.error);
          }
        } catch (error) {
          console.error("Unexpected error while updating timer setting:", error);

          setSettingsState(previous);
          setSaveStatus("error");
          setSaveError(
            "We couldn't save your settings. Please try again."
          );
        }
      })();
    }

  const valid =
  timer?.status === "finished"
    ? isTimerValid(timer)
    : false;
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
              {timer?.status === "running"
                ? "Running"
                : timer?.status === "paused"
                  ? "Paused"
                  : timer?.status === "finished"
                    ? valid
                      ? "Finished"
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
                        <div role="alert" className="text-red-400">
                          {saveError ?? "Your run could not be saved."}
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
            const recorded = timerSegments[index] ?? null;

            const isCurrent =
              (timer?.status === "running" ||
                timer?.status === "paused") &&
              currentSectionIndex === index;

            const segment =
              recorded?.type === "split"
                ? recorded.timeMs
                : recorded?.type === "skip"
                  ? null
                  : isCurrent
                    ? currentSegmentMs
                    : null;
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
            const previousRecorded =
              index > 0
                ? timerSegments[index - 1] ?? null
                : null;

            const prevSegment =
              previousRecorded?.type === "split"
                ? previousRecorded.timeMs
                : null;
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
              <TimerButton
                onClick={
                  timer?.status === "running"
                    ? split
                    : start
                }
                disabled={
                  timer?.status === "paused" ||
                  timer?.status === "finished"
                }
              >
                {timer?.status === "running"
                  ? currentSectionIndex === sections.length - 1
                    ? "Finish"
                    : "Split"
                  : "Start"}
              </TimerButton>

              <TimerButton
                onClick={pauseResume}
                disabled={
                  !timer ||
                  (
                    timer.status !== "running" &&
                    timer.status !== "paused"
                  )
                }
              >
                {timer?.status === "paused"
                  ? "Resume"
                  : "Pause"}
              </TimerButton>

              <TimerButton
                onClick={skip}
                disabled={
                  !timer ||
                  timer.status !== "running"
                }
              >
                Skip
              </TimerButton>

              <TimerButton
                onClick={undo}
                disabled={
                  !timer ||
                  !canUndo(timer, now)
                }
              >
                Undo
              </TimerButton>

              <TimerButton
                onClick={reset}
                disabled={!timer}
              >
                Reset
              </TimerButton>
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
