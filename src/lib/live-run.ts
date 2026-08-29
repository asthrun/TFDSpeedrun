export const LIVE_RUN_STORAGE_PREFIX = "tfd-live-run:";

export type LiveSplit = {
  sectionId: string;
  timeMs: number;
} | null;

export type LiveRunState = {
  runId: string | null;
  categoryId: string;
  startedAt: number;
  status: "running" | "stopped";
  currentSectionIndex: number;
  splits: LiveSplit[];
};

export function liveRunStorageKey(categoryId: string) {
  return `${LIVE_RUN_STORAGE_PREFIX}${categoryId}`;
}

export function readLiveRun(categoryId: string): LiveRunState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(liveRunStorageKey(categoryId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LiveRunState;
    if (parsed.categoryId !== categoryId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLiveRun(state: LiveRunState) {
  localStorage.setItem(liveRunStorageKey(state.categoryId), JSON.stringify(state));
}

export function clearLiveRun(categoryId: string) {
  localStorage.removeItem(liveRunStorageKey(categoryId));
}

export function isRunValid(splits: LiveSplit[], sectionCount: number) {
  if (splits.length !== sectionCount) return false;
  return splits.every((split) => split !== null);
}
