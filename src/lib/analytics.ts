import type { Run, RunSplit, Section } from "@/lib/database.types";

export type RunWithSplits = Run & { splits: RunSplit[] };

export function personalBests(
  runs: RunWithSplits[],
  sections: Section[],
): Record<string, number> {
  const best: Record<string, number> = {};
  for (const run of runs) {
    if (!run.is_valid) continue;
    for (const split of run.splits) {
      const current = best[split.section_id];
      if (current === undefined || split.time_ms < current) {
        best[split.section_id] = split.time_ms;
      }
    }
  }
  for (const section of sections) {
    if (best[section.id] === undefined) continue;
  }
  return best;
}

export function sumOfBest(best: Record<string, number>, sections: Section[]): number | null {
  if (sections.length === 0) return null;
  let total = 0;
  for (const section of sections) {
    const value = best[section.id];
    if (value === undefined) return null;
    total += value;
  }
  return total;
}

export function evenSplitTarget(targetTimeMs: number | null, sectionCount: number): number | null {
  if (targetTimeMs == null || sectionCount <= 0) return null;
  return Math.round(targetTimeMs / sectionCount);
}
