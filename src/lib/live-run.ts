import type { TimerState } from "@/lib/timer-engine";

export type TimerLiveRunState = {
  runId: string | null;
  categoryId: string;
  timer: TimerState;
};

export const LIVE_RUN_STORAGE_PREFIX = "tfd-live-run:";

export function liveRunStorageKey(categoryId: string) {
  return `${LIVE_RUN_STORAGE_PREFIX}${categoryId}`;
}

export function readTimerLiveRun(
  categoryId: string,
): TimerLiveRunState | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(liveRunStorageKey(categoryId));

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as TimerLiveRunState;

    if (parsed.categoryId !== categoryId) {
      return null;
    }

    if (!parsed.timer) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}


export function writeTimerLiveRun(
  state: TimerLiveRunState,
) {
  localStorage.setItem(
    liveRunStorageKey(state.categoryId),
    JSON.stringify(state),
  );
}

export function clearLiveRun(categoryId: string) {
  localStorage.removeItem(liveRunStorageKey(categoryId));
}


