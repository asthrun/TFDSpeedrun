export type TimerStatus =
  | "idle"
  | "running"
  | "paused"
  | "finished";

export type SectionProgress =
  | {
      sectionId: string;
      type: "split";
      timeMs: number;
    }
  | {
      sectionId: string;
      type: "skip";
      timeMs: number;
    };

export type TimerState = {
  status: TimerStatus;

  startedAt: number | null;
  pausedAt: number | null;
  totalPausedMs: number;

  progress: SectionProgress[];

  finishedAt: number | null;
  finalizeAt: number | null;
};

export type TimerSection = {
  id: string;
};

export function createInitialTimerState(): TimerState {
  return {
    status: "idle",

    startedAt: null,
    pausedAt: null,
    totalPausedMs: 0,

    progress: [],

    finishedAt: null,
    finalizeAt: null,
  };
}

export function isTimerValid(state: TimerState): boolean {
  return !state.progress.some((entry) => entry.type === "skip");
}

export function getElapsedMs(
  state: TimerState,
  now: number,
): number {
  if (state.startedAt === null) {
    return 0;
  }

  const endTime =
    state.status === "paused" && state.pausedAt !== null
      ? state.pausedAt
      : state.status === "finished" && state.finishedAt !== null
        ? state.finishedAt
        : now;

  return Math.max(
    0,
    endTime - state.startedAt - state.totalPausedMs,
  );
}

export function startTimer(
  state: TimerState,
  now: number,
): TimerState {
  if (state.status !== "idle") {
    return state;
  }

  return {
    status: "running",

    startedAt: now,
    pausedAt: null,
    totalPausedMs: 0,

    progress: [],

    finishedAt: null,
    finalizeAt: null,
  };
}

export function pauseTimer(
  state: TimerState,
  now: number,
): TimerState {
  if (state.status !== "running") {
    return state;
  }

  return {
    ...state,
    status: "paused",
    pausedAt: now,
  };
}

export function resumeTimer(
  state: TimerState,
  now: number,
): TimerState {
  if (state.status !== "paused" || state.pausedAt === null) {
    return state;
  }

  return {
    ...state,
    status: "running",
    totalPausedMs:
      state.totalPausedMs + Math.max(0, now - state.pausedAt),
    pausedAt: null,
  };
}

export function splitTimer(
  state: TimerState,
  sections: TimerSection[],
  now: number,
    ): TimerState {
    if (state.status !== "running") {
        return state;
    }

    const currentSection = sections[state.progress.length];

    if (!currentSection) {
        return state;
    }

    const elapsedMs = getElapsedMs(state, now);

    const nextProgress: SectionProgress[] = [
    ...state.progress,
    {
        sectionId: currentSection.id,
        type: "split",
        timeMs: elapsedMs,
    },
    ];

    const isLastSection = nextProgress.length === sections.length;

    if (isLastSection) {
    return {
        ...state,
        status: "finished",
        progress: nextProgress,
        finishedAt: now,
        finalizeAt: now + 10_000,
    };
    }

    return {
    ...state,
    progress: nextProgress,
    };
}

export function skipTimer(
  state: TimerState,
  sections: TimerSection[],
  now: number,
): TimerState {
  if (state.status !== "running") {
    return state;
  }

  const currentSection = sections[state.progress.length];

  if (!currentSection) {
    return state;
  }

  const nextProgress: SectionProgress[] = [
    ...state.progress,
    {
    sectionId: currentSection.id,
    type: "skip",
    timeMs: getElapsedMs(state, now),
    },
  ];

  const isLastSection = nextProgress.length === sections.length;

  if (isLastSection) {
    return {
      ...state,
      status: "finished",
      progress: nextProgress,
      finishedAt: now,
      finalizeAt: now + 10_000,
    };
  }

  return {
    ...state,
    progress: nextProgress,
  };
}

export function undoTimer(
  state: TimerState,
  now: number,
): TimerState {
  const canUndoFromRunningOrPaused =
    state.status === "running" || state.status === "paused";

  const canUndoFromFinished =
    state.status === "finished" &&
    state.finalizeAt !== null &&
    now < state.finalizeAt;

  if (!canUndoFromRunningOrPaused && !canUndoFromFinished) {
    return state;
  }

  if (state.progress.length === 0) {
    return state;
  }

  const nextProgress = state.progress.slice(0, -1);

  if (state.status === "finished") {
    return {
      ...state,
      status: "running",
      progress: nextProgress,
      finishedAt: null,
      finalizeAt: null,
    };
  }

  return {
    ...state,
    progress: nextProgress,
  };
}

export function resetTimer(
  state: TimerState,
): TimerState {
  if (state.status === "idle") {
    return state;
  }

  return createInitialTimerState();
}

export function canUndo(
  state: TimerState,
  now: number,
): boolean {
  if (state.progress.length === 0) {
    return false;
  }

  if (state.status === "running" || state.status === "paused") {
    return true;
  }

  return (
    state.status === "finished" &&
    state.finalizeAt !== null &&
    now < state.finalizeAt
  );
}

export function isFinalizable(
  state: TimerState,
  now: number,
): boolean {
  return (
    state.status === "finished" &&
    state.finalizeAt !== null &&
    now >= state.finalizeAt
  );
}

export type TimerSegment = {
  sectionId: string;
  type: "split" | "skip";
  timeMs: number;
};

export function getTimerSegments(
  state: TimerState,
): TimerSegment[] {
  let previousTimeMs = 0;

  return state.progress.map((entry) => {
    const segmentTimeMs = Math.max(
      0,
      entry.timeMs - previousTimeMs,
    );

    previousTimeMs = entry.timeMs;

    return {
      sectionId: entry.sectionId,
      type: entry.type,
      timeMs: segmentTimeMs,
    };
  });
}