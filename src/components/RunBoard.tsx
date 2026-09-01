"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type RunWithSplits,
} from "@/lib/analytics";
import { fontCss } from "@/lib/fonts";
import {
  formatSignedDelta,
  formatTime,
  formatTimeParts,
} from "@/lib/format-time";
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
  saveIncompleteTimerRun,
} from "@/app/actions/runs";
import { updateSettings } from "@/app/actions/settings";
import type { Category, Section, UserSettings } from "@/lib/database.types";
import {
  compareTimerProgress,
  getBestSegments,
  getCustomTargetSource,
  getLatestRunSource,
  getPersonalBestSource,
  getSumOfBest,
  getWorstRunSource,
  getValidRunCount,
  type ComparisonSource,
} from "@/lib/comparison-engine";
import { getVisibleSplits } from "@/lib/split-window";
import {
  getComparisonTone,
  getSemanticColor,
  getSplitBackgroundStyle,
  getTextStyle,
  getTimerBackgroundStyle,
  getTimerTextStyle,
} from "@/lib/appearance";

type Props = {
  category: Category;
  profileName: string;
  sections: Section[];
  settings: UserSettings;
  history: RunWithSplits[];
  customTargetSplits: {
    section_id: string;
    time_ms: number;
  }[];
  overlay?: boolean;
};

export function RunBoard({
  category,
  profileName,
  sections,
  settings,
  history,
  customTargetSplits,
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
  const lastKeyboardActionAt = useRef<
    Record<string, number>
  >({});

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

  const totalTimeParts = formatTimeParts(elapsedMs);

  const timerSegments = useMemo(
    () => (timer ? getTimerSegments(timer) : []),
    [timer],
  );

  const currentSectionIndex = timer?.progress.length ?? 0;

  const visibleSplitCount =
      settingsState.visible_split_count;

  const visibleSplits = useMemo(
    () =>
      getVisibleSplits(
        sections,
        currentSectionIndex,
        visibleSplitCount,
      ),
    [
      sections,
      currentSectionIndex,
      visibleSplitCount,
    ],
  );

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
  () => getBestSegments(history, sections),
  [history, sections],
  );

  const sob = useMemo(
    () => getSumOfBest(best, sections),
    [best, sections],
  );

   const personalBestSource = useMemo(
    () => getPersonalBestSource(history, sections),
    [history, sections],
  );

  const latestRunSource = useMemo(
    () => getLatestRunSource(history, sections),
    [history, sections],
  );

  const worstRunSource = useMemo(
    () => getWorstRunSource(history, sections),
    [history, sections],
  );

  const customTargetSource = useMemo(
    () =>
      getCustomTargetSource(
        customTargetSplits,
        sections,
      ),
    [customTargetSplits, sections],
  );

  const activeComparisonSource = useMemo<ComparisonSource>(() => {
    switch (category.compare_mode) {
      case "custom_target":
        return customTargetSource;

      case "latest_run":
        return latestRunSource;

      case "worst_run":
        return worstRunSource;

      case "personal_best":
      default:
        return personalBestSource;
    }
  }, [
    category.compare_mode,
    customTargetSource,
    latestRunSource,
    worstRunSource,
    personalBestSource,
  ]);

    const comparisonResults = useMemo(
    () =>
      timer
        ? compareTimerProgress(
            timer,
            sections,
            activeComparisonSource,
            best,
          )
        : [],
    [
      timer,
      sections,
      activeComparisonSource,
      best,
    ],
  );

  const currentComparison =
  currentSectionIndex > 0
    ? comparisonResults[
        currentSectionIndex - 1
      ] ?? null
    : null;

  const currentDeltaMs =
    currentComparison?.deltaMs ?? null;

const currentDeltaTone = getComparisonTone(
  currentComparison?.position ?? null,
  currentComparison?.trend ?? null,
  currentComparison?.isBestSegment ?? false,
);

const totalTimerTone = getComparisonTone(
  currentComparison?.position ?? null,
  currentComparison?.trend ?? null,
  false,
);

  const validRunCount = useMemo(
      () => getValidRunCount(history, sections),
      [history, sections],
  );

  const compareModeLabel = useMemo(() => {
      switch (category.compare_mode) {
        case "custom_target":
          return "Custom Target";

        case "latest_run":
          return "Latest Run";

        case "worst_run":
          return "Worst Run";

        case "personal_best":
        default:
          return "Personal Best";
      }
    }, [category.compare_mode]);

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

    /*
    * A finished run is complete, not incomplete.
    * Reset finalizes it immediately instead of
    * waiting for the normal 10-second window.
    */
    if (timer.status === "finished") {
      if (timer.startedAt === null) {
        return;
      }

      finalizingStartedAt.current =
        timer.startedAt;

      setSaveStatus("saving");
      setSaveError(null);

      void (async () => {
        try {
          const result =
            await finalizeTimerRun(
              category.id,
              timer,
            );

          if (result.error) {
            finalizingStartedAt.current =
              null;

            setSaveStatus("error");
            setSaveError(result.error);

            return;
          }

          saveLiveState(null);

          setSaveStatus("saved");
          setSaveError(null);
        } catch (error) {
          console.error(
            "Unexpected error while finalizing run on reset:",
            error,
          );

          finalizingStartedAt.current =
            null;

          setSaveStatus("error");
          setSaveError(
            "Your run could not be saved. Please try again.",
          );
        }
      })();

      return;
    }

    /*
    * Running/paused runs are incomplete.
    */
    finalizingStartedAt.current = null;

    if (!settingsState.save_incomplete_runs) {
      saveLiveState(null);

      setSaveStatus("idle");
      setSaveError(null);

      return;
    }

    setSaveStatus("saving");
    setSaveError(null);

    void (async () => {
      try {
        const result =
          await saveIncompleteTimerRun(
            category.id,
            timer,
          );

        if (result.error) {
          setSaveStatus("error");
          setSaveError(result.error);
          return;
        }

        saveLiveState(null);

        setSaveStatus("saved");
        setSaveError(null);
      } catch (error) {
        console.error(
          "Unexpected error while saving incomplete run:",
          error,
        );

        setSaveStatus("error");
        setSaveError(
          "Your incomplete run could not be saved. Please try again.",
        );
      }
    })();
  }, [
    category.id,
    live,
    saveLiveState,
    settingsState.save_incomplete_runs,
    timer,
  ]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target =
        event.target as HTMLElement | null;

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

      const actions: Record<
        string,
        {
          id: string;
          run: () => void;
        }
      > = {};

      if (settingsState.shortcut_start_split) {
        actions[
          settingsState.shortcut_start_split
        ] = {
          id: "start_split",
          run:
            timer?.status === "running"
              ? split
              : start,
        };
      }

      if (settingsState.shortcut_pause) {
        actions[
          settingsState.shortcut_pause
        ] = {
          id: "pause",
          run: pauseResume,
        };
      }

      if (settingsState.shortcut_undo) {
        actions[
          settingsState.shortcut_undo
        ] = {
          id: "undo",
          run: undo,
        };
      }

      if (settingsState.shortcut_skip) {
        actions[
          settingsState.shortcut_skip
        ] = {
          id: "skip",
          run: skip,
        };
      }

      if (settingsState.shortcut_reset) {
        actions[
          settingsState.shortcut_reset
        ] = {
          id: "reset",
          run: reset,
        };
      }

      const action = actions[event.code];

      if (!action) return;

      event.preventDefault();

      if (event.repeat) {
        return;
      }

      const delay = Math.max(
        0,
        Number(
          settingsState.double_tap_delay_ms,
        ) || 0,
      );

      const actionNow = Date.now();

      const previousActionAt =
        lastKeyboardActionAt.current[
          action.id
        ] ?? 0;

      if (
        delay > 0 &&
        actionNow - previousActionAt < delay
      ) {
        return;
      }

      lastKeyboardActionAt.current[
        action.id
      ] = actionNow;

      action.run();
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener(
        "keydown",
        onKey,
      );
    };
  }, [
    pauseResume,
    reset,
    settingsState,
    skip,
    split,
    start,
    timer?.status,
    undo,
  ]);

      function toggleSetting(
      key: "show_compare_delta",
      value: boolean,
    ) {
      const previous = settingsState;

      const next = {
        ...settingsState,
        [key]: value,
      } as UserSettings;

      setSettingsState(next);

      void (async () => {
        try {
          const result = await updateSettings({
            show_compare_delta: value,
          });

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
  
  return (
    <div
      className={overlay ? "min-h-screen p-4" : "rounded-xl border border-zinc-800 bg-zinc-950 p-4"}
      style={{
        ...getTimerBackgroundStyle(settingsState),
        fontFamily: fontCss(settingsState.font_family),
        fontSize: `${Number(settingsState.font_scale) * 16}px`,
      }}
    >
      <div className={overlay ? "max-w-xl" : ""}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div
                    className="truncate text-sm"
                    style={getTextStyle(settingsState, "primary")}
                  >
                    {profileName}
                  </div>

                  <div
                    className="truncate text-xl font-semibold"
                    style={getTextStyle(settingsState, "primary")}
                  >
                    {category.name}
                  </div>

                  <div
                    className="mt-1 text-sm"
                    style={getTextStyle(settingsState, "secondary")}
                  >
                    Compare To: {compareModeLabel}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Valid / Attempts
                  </div>

                  <div className="text-lg font-semibold text-zinc-100">
                    {validRunCount} / {category.attempt_count}
                  </div>
                </div>
              </div>
          </div>
          <div className="min-w-56 text-right">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Section
          </div>

          <div
            className="text-lg tabular-nums"
            style={getTextStyle(settingsState, "primary")}
          >
            {timer &&
            (timer.status === "running" ||
              timer.status === "paused")
              ? formatTime(currentSegmentMs)
              : "—"}
          </div>

          <div
            className="mt-2 text-xs uppercase tracking-wide"
            style={getTextStyle(settingsState, "secondary")}
          >
            Total
          </div>

          <div
            className="text-[2.2em] font-semibold tabular-nums leading-none"
            style={getTimerTextStyle(settingsState, totalTimerTone)}
          >
            <span>{totalTimeParts.main}</span>
            <span className="text-[0.5em]">
              .{totalTimeParts.milliseconds}
            </span>
          </div>

          <div className="mt-2 text-xs uppercase tracking-wide text-zinc-500">
            Delta
          </div>

          <div
            className="font-mono text-lg tabular-nums"
            style={getTextStyle(
              settingsState,
              currentDeltaMs == null
                ? "secondary"
                : currentDeltaTone,
            )}
          >
            {currentDeltaMs == null
              ? "—"
              : formatSignedDelta(currentDeltaMs)}
          </div>

          <div
            className="mt-2 text-[0.7em]"
            style={getTextStyle(
              settingsState,
              timer?.status === "paused"
                ? "paused"
                : "secondary",
            )}
          >
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
        
          <div className="mt-3 flex items-center gap-6 text-[0.85em] text-zinc-300">
            <div>
              <span className="text-zinc-500">
                Sum of Best:
              </span>{" "}
              {sob == null
                ? "—"
                : formatTime(sob)}
            </div>

            <div>
              <span className="text-zinc-500">
                Personal Best:
              </span>{" "}
              {personalBestSource.totalTimeMs == null
                ? "—"
                : formatTime(
                    personalBestSource.totalTimeMs,
                  )}
            </div>
          </div>        

        <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-4 border-b border-zinc-800 px-2 pb-1 text-xs uppercase tracking-wide text-zinc-500">
          <div>Section</div>
          <div className="text-right">Delta</div>
          <div className="min-w-24 text-right">Time</div>
        </div>

        <ol className="mt-3 space-y-1">
          {visibleSplits.map(({ item: section, index }) => {
            const recorded = timerSegments[index] ?? null;
            const comparison = comparisonResults[index] ?? null;
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

            const tone = getComparisonTone(
              comparison?.position ?? null,
              comparison?.trend ?? null,
              comparison?.isBestSegment ?? false,
            );      


            const delta = comparison?.deltaMs ?? null;
            
            return (
              <li
                key={section.id}
                className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded px-2 py-1 ${
                  isCurrent
                    ? "ring-1 ring-inset ring-white/30"
                    : ""
                }`}
                style={getSplitBackgroundStyle(
                  settingsState,
                  index,
                )}
              >
                  <span className="min-w-0 truncate">
                    {index + 1}. {section.name}
                  </span>

                 <span
                  className="min-w-24 text-right font-mono text-[0.85em] tabular-nums"
                  style={{
                    color: getSemanticColor(settingsState, tone),
                  }}
                >
                    {settingsState.show_compare_delta &&
                    delta != null
                      ? formatSignedDelta(delta)
                      : "—"}
                  </span>

                  <span
                    className="min-w-24 text-right font-mono tabular-nums"
                    style={{
                      color: getSemanticColor(settingsState, tone),
                    }}
                  >
                    {comparison?.actualTimeMs != null
                      ? formatTime(
                          comparison.actualTimeMs,
                        )
                      : comparison?.comparisonTimeMs !=
                          null
                        ? formatTime(
                            comparison.comparisonTimeMs,
                          )
                        : "—"}
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
                  checked={settingsState.show_compare_delta}
                  onChange={(e) => toggleSetting("show_compare_delta", e.target.checked)}
                />
                Delta vs compare
              </label>
              </div>
          </>
        )}
      </div>
    </div>
  );
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

 