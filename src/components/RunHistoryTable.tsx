"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DeleteRunForm from "@/components/DeleteRunForm";
import { formatTime } from "@/lib/format-time";

type Section = {
  id: string;
};

type Split = {
  section_id: string;
  time_ms: number;
};

type Run = {
  id: string;
  started_at: string;
  is_valid: boolean;
  splits: Split[];
};

type RunHistoryTableProps = {
  runs: Run[];
  sections: Section[];
  categoryId: string;
  highlightRunId?: string;
};

export default function RunHistoryTable({
  runs,
  sections,
  categoryId,
  highlightRunId,
}: RunHistoryTableProps) {
  const [highlightActive, setHighlightActive] = useState(
    Boolean(highlightRunId)
  );

  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (!highlightRunId) return;

    highlightedRowRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    const timer = window.setTimeout(() => {
      setHighlightActive(false);
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [highlightRunId]);

  const rows = useMemo(() => {
    return runs.map((run) => {
      const sectionTimes: number[] = [];

      let cumulative = 0;

      for (const section of sections) {
        const split = run.splits.find(
          (item) => item.section_id === section.id
        );

        if (split) {
          cumulative += split.time_ms;
          sectionTimes.push(cumulative);
        } else {
          sectionTimes.push(-1);
        }
      }

      const total = run.splits.reduce(
        (sum, split) => sum + split.time_ms,
        0
      );

      return {
        ...run,
        total,
        sectionTimes,
      };
    });
  }, [runs, sections]);

  if (rows.length === 0) {
    return (
      <p className="mt-6 text-zinc-500">
        No runs yet.
      </p>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <th className="px-3 py-2" aria-label="Status and actions" />

            <th className="px-3 py-2 font-medium">
              Total Time
            </th>

            <th className="px-3 py-2 font-medium">
              Date
            </th>

            {sections.map((section, index) => (
              <th
                key={section.id}
                className="px-3 py-2 font-medium"
              >
                Section {index + 1}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((run) => {
            const highlighted =
              highlightActive &&
              run.id === highlightRunId;

            return (
              <tr
                key={run.id}
                ref={
                  run.id === highlightRunId
                    ? highlightedRowRef
                    : undefined
                }
                className={[
                  "border-b border-zinc-800 transition-colors duration-1000",
                  highlighted
                    ? "bg-red-950/40"
                    : "bg-transparent",
                ].join(" ")}
              >
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="flex items-center gap-2">
                    {highlighted && (
                      <span
                        aria-label="Run requires attention"
                        title="Run requires attention"
                        className="text-amber-400"
                      >
                        ⚠
                      </span>
                    )}

                    <span
                      aria-label={
                        run.is_valid
                          ? "Valid run"
                          : "Invalid run"
                      }
                      title={
                        run.is_valid
                          ? "Valid run"
                          : "Invalid run"
                      }
                      className={
                        run.is_valid
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      ●
                    </span>

                    <DeleteRunForm
                      runId={run.id}
                      categoryId={categoryId}
                    />
                  </div>
                </td>

                <td className="whitespace-nowrap px-3 py-3 font-mono">
                  {formatTime(run.total)}
                </td>

                <td className="whitespace-nowrap px-3 py-3 text-zinc-400">
                  {new Date(run.started_at).toLocaleString()}
                </td>

                {run.sectionTimes.map((time, index) => (
                  <td
                    key={sections[index].id}
                    className="whitespace-nowrap px-3 py-3 font-mono text-zinc-300"
                  >
                    {time >= 0
                      ? formatTime(time)
                      : "—"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}