"use client";

import { useActionState } from "react";
import { updateCustomTarget } from "@/app/actions/catalog";
import { initialActionState } from "@/lib/action-state";

type Props = {
  categoryId: string;
  sections: {
    id: string;
    name: string;
  }[];
  currentTargets: {
    section_id: string;
    time_ms: number;
  }[];
};

function formatTargetInput(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;

  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(
    milliseconds
  ).padStart(3, "0")}`;
}

export default function CustomTargetForm({
  categoryId,
  sections,
  currentTargets,
}: Props) {
  const updateCustomTargetForCategory =
    updateCustomTarget.bind(null, categoryId);

  const [state, formAction, isPending] = useActionState(
    updateCustomTargetForCategory,
    initialActionState
  );

  const targetMap = new Map(
    currentTargets.map((target) => [
      target.section_id,
      target.time_ms,
    ])
  );

  return (
    <section className="mt-8">
      <h2 className="text-lg font-medium">
        Custom Target
      </h2>

      <p className="mt-1 text-sm text-zinc-400">
        Enter a cumulative target time for every Section,
        or enter only the final target time.
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        {sections.map((section, index) => {
          const target = targetMap.get(section.id);

          return (
            <label
              key={section.id}
              className="grid gap-1 sm:grid-cols-[1fr_10rem] sm:items-center sm:gap-4"
            >
              <span className="text-sm text-zinc-300">
                {index + 1}. {section.name}
              </span>

              <input
                type="text"
                name={`target_${section.id}`}
                defaultValue={
                  target == null
                    ? ""
                    : formatTargetInput(target)
                }
                placeholder={
                  index === sections.length - 1
                    ? "3:20.000"
                    : "0:35.000"
                }
                disabled={isPending}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-zinc-100 disabled:opacity-50"
              />
            </label>
          );
        })}

        {sections.length === 0 && (
          <p className="text-sm text-zinc-400">
            Add at least one Section before creating a
            Custom Target.
          </p>
        )}

        {state.error && (
          <p role="alert" className="text-sm text-red-400">
            {state.error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending || sections.length === 0}
            className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "Saving..." : "Save Custom Target"}
          </button>

          <span className="text-xs text-zinc-500">
            Clear all fields and save to remove the target.
          </span>
        </div>
      </form>
    </section>
  );
}