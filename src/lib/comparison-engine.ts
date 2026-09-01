import type {
  RunSplit,
  Section,
} from "@/lib/database.types";
import type { RunWithSplits } from "@/lib/analytics";

import {
  getTimerSegments,
  type TimerState,
} from "@/lib/timer-engine";



export type ComparisonMode =
  | "personal_best"
  | "custom_target"
  | "latest_run"
  | "worst_run";

export type ComparisonPosition =
  | "ahead"
  | "behind"
  | "even";

export type ComparisonTrend =
  | "gaining"
  | "losing"
  | "even";

export type ComparisonSource = {
  mode: ComparisonMode;
  totalTimeMs: number | null;
  splits: Record<string, number>;
};

export type ComparisonResult = {
  sectionId: string;
  comparisonTimeMs: number | null;
  actualTimeMs: number | null;
  deltaMs: number | null;
  position: ComparisonPosition | null;
  trend: ComparisonTrend | null;
  isBestSegment: boolean;
};

export type CustomTargetSplit = {
  section_id: string;
  time_ms: number;
};

export function compareTimerProgress(
  state: TimerState,
  sections: Section[],
  source: ComparisonSource,
  bestSegments: Record<string, number>,
): ComparisonResult[] {
  const segments = getTimerSegments(state);

  const progressBySection = new Map(
    state.progress.map((entry) => [
      entry.sectionId,
      entry,
    ]),
  );

  const segmentBySection = new Map(
    segments.map((segment) => [
      segment.sectionId,
      segment,
    ]),
  );

  const results: ComparisonResult[] = [];

  let previousDeltaMs: number | null = null;

  for (const section of sections) {
    const progress =
      progressBySection.get(section.id);

    const segment =
      segmentBySection.get(section.id);

    const actualTimeMs =
      progress?.type === "split"
        ? progress.timeMs
        : null;

    const historicalBestSegment =
      bestSegments[section.id];

    const isBestSegment =
      segment?.type === "split" &&
      historicalBestSegment !== undefined &&
      segment.timeMs <= historicalBestSegment;

    const result = compareSection(
      section.id,
      actualTimeMs,
      previousDeltaMs,
      source,
      isBestSegment,
    );

    results.push(result);

    if (result.deltaMs !== null) {
      previousDeltaMs = result.deltaMs;
    }
  }

  return results;
}

export function getCustomTargetSource(
  targetSplits: CustomTargetSplit[],
  sections: Section[],
): ComparisonSource {
  const targetBySection = new Map(
    targetSplits.map((split) => [
      split.section_id,
      split.time_ms,
    ]),
  );

  const splits: Record<string, number> = {};

  let totalTimeMs: number | null = null;

  for (const section of sections) {
    const targetTimeMs =
      targetBySection.get(section.id);

    if (
      targetTimeMs === undefined ||
      !Number.isFinite(targetTimeMs) ||
      targetTimeMs < 0
    ) {
      continue;
    }

    splits[section.id] = targetTimeMs;
    totalTimeMs = targetTimeMs;
  }

  return {
    mode: "custom_target",
    totalTimeMs,
    splits,
  };
}

function getCompleteValidRuns(
  runs: RunWithSplits[],
  sections: Section[],
): RunWithSplits[] {
  const sectionIds = new Set(
    sections.map((section) => section.id),
  );

  return runs.filter((run) => {
    if (!run.is_valid) {
      return false;
    }

    if (run.splits.length !== sections.length) {
      return false;
    }

    const splitSectionIds = new Set(
      run.splits.map((split) => split.section_id),
    );

    if (splitSectionIds.size !== sections.length) {
      return false;
    }

    return sections.every((section) =>
      splitSectionIds.has(section.id),
    );
  });
}

export function getValidRunCount(
  runs: RunWithSplits[],
  sections: Section[],
): number {
  return getCompleteValidRuns(
    runs,
    sections,
  ).length;
}

function getRunTotalMs(
  run: RunWithSplits,
): number {
  return run.splits.reduce(
    (total, split) => total + split.time_ms,
    0,
  );
}

function getCumulativeRunSplits(
  run: RunWithSplits,
  sections: Section[],
): Record<string, number> {
  const splitBySection = new Map(
    run.splits.map((split) => [
      split.section_id,
      split,
    ]),
  );

  const result: Record<string, number> = {};
  let cumulativeMs = 0;

  for (const section of sections) {
    const split = splitBySection.get(section.id);

    if (!split) {
      continue;
    }

    cumulativeMs += split.time_ms;
    result[section.id] = cumulativeMs;
  }

  return result;
}

function createRunComparisonSource(
  mode: ComparisonMode,
  run: RunWithSplits | null,
  sections: Section[],
): ComparisonSource {
  if (!run) {
    return {
      mode,
      totalTimeMs: null,
      splits: {},
    };
  }

  return {
    mode,
    totalTimeMs: getRunTotalMs(run),
    splits: getCumulativeRunSplits(
      run,
      sections,
    ),
  };
}

export function getPersonalBestSource(
  runs: RunWithSplits[],
  sections: Section[],
): ComparisonSource {
  const validRuns = getCompleteValidRuns(
    runs,
    sections,
  );

  const personalBest =
    validRuns.length === 0
      ? null
      : validRuns.reduce((best, run) =>
          getRunTotalMs(run) <
          getRunTotalMs(best)
            ? run
            : best,
        );

  return createRunComparisonSource(
    "personal_best",
    personalBest,
    sections,
  );
}

export function getLatestRunSource(
  runs: RunWithSplits[],
  sections: Section[],
): ComparisonSource {
  const validRuns = getCompleteValidRuns(
    runs,
    sections,
    ).filter((run) => run.completed_at !== null);

  const latest =
    validRuns.length === 0
      ? null
      : validRuns.reduce((current, run) => {
          const currentTime =
            current.completed_at
              ? new Date(
                  current.completed_at,
                ).getTime()
              : 0;

          const runTime =
            run.completed_at
              ? new Date(
                  run.completed_at,
                ).getTime()
              : 0;

          return runTime > currentTime
            ? run
            : current;
        });

  return createRunComparisonSource(
    "latest_run",
    latest,
    sections,
  );
}

export function getWorstRunSource(
  runs: RunWithSplits[],
  sections: Section[],
): ComparisonSource {
  const validRuns = getCompleteValidRuns(
    runs,
    sections,
  );

  const worst =
    validRuns.length === 0
      ? null
      : validRuns.reduce((current, run) =>
          getRunTotalMs(run) >
          getRunTotalMs(current)
            ? run
            : current,
        );

  return createRunComparisonSource(
    "worst_run",
    worst,
    sections,
  );
}

export function getBestSegments(
  runs: RunWithSplits[],
  sections: Section[],
): Record<string, number> {
  const validRuns = getCompleteValidRuns(
    runs,
    sections,
  );

  const best: Record<string, number> = {};

  for (const run of validRuns) {
    for (const split of run.splits) {
      const current = best[split.section_id];

      if (
        current === undefined ||
        split.time_ms < current
      ) {
        best[split.section_id] =
          split.time_ms;
      }
    }
  }

  return best;
}

export function getSumOfBest(
  bestSegments: Record<string, number>,
  sections: Section[],
): number | null {
  if (sections.length === 0) {
    return null;
  }

  let total = 0;

  for (const section of sections) {
    const best = bestSegments[section.id];

    if (best === undefined) {
      return null;
    }

    total += best;
  }

  return total;
}

export function getPosition(
  deltaMs: number,
): ComparisonPosition {
  if (deltaMs < 0) {
    return "ahead";
  }

  if (deltaMs > 0) {
    return "behind";
  }

  return "even";
}

export function getTrend(
  deltaMs: number,
  previousDeltaMs: number | null,
): ComparisonTrend | null {
  if (previousDeltaMs === null) {
    return null;
  }

  if (deltaMs < previousDeltaMs) {
    return "gaining";
  }

  if (deltaMs > previousDeltaMs) {
    return "losing";
  }

  return "even";
}

export function compareSection(
  sectionId: string,
  actualTimeMs: number | null,
  previousDeltaMs: number | null,
  source: ComparisonSource,
  isBestSegment: boolean,
): ComparisonResult {
  const comparisonTimeMs =
    source.splits[sectionId] ?? null;

  if (
    actualTimeMs === null ||
    comparisonTimeMs === null
  ) {
    return {
      sectionId,
      comparisonTimeMs,
      actualTimeMs,
      deltaMs: null,
      position: null,
      trend: null,
      isBestSegment,
    };
  }

  const deltaMs =
    actualTimeMs - comparisonTimeMs;

  const position = getPosition(deltaMs);

  // Exact gelijk is altijd neutraal.
  const trend =
    position === "even"
      ? "even"
      : getTrend(
          deltaMs,
          previousDeltaMs,
        );

  return {
    sectionId,
    comparisonTimeMs,
    actualTimeMs,
    deltaMs,
    position,
    trend,
    isBestSegment,
  };
}