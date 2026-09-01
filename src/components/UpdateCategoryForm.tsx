"use client";

import { useActionState } from "react";
import { updateCategory } from "@/app/actions/catalog";
import { initialActionState } from "@/lib/action-state";

type Props = {
  categoryId: string;
  currentName: string;
  currentTargetTime: string;
  currentCompareMode: string;
};

export default function UpdateCategoryForm({
  categoryId,
  currentName,
  currentTargetTime,
  currentCompareMode,
}: Props) {
  const updateCategoryForId = updateCategory.bind(null, categoryId);

  const [state, formAction, isPending] = useActionState(
    updateCategoryForId,
    initialActionState
  );

  return (
    <form action={formAction} className="mt-4">
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_10rem]">
          <label className="grid gap-1">
            <span className="text-sm text-zinc-400">Category name</span>
            <input
              name="name"
              defaultValue={currentName}
              disabled={isPending}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 disabled:opacity-50"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-zinc-400">Target time</span>
            <input
              name="target_time"
              defaultValue={currentTargetTime}
              disabled={isPending}
              placeholder="mm:ss.SSS"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono disabled:opacity-50"
            />
          </label>
        </div>

        <label className="grid gap-1 sm:max-w-xs">
          <span className="text-sm text-zinc-400">Compare To</span>

          <select
            name="compare_mode"
            defaultValue={currentCompareMode}
            disabled={isPending}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 disabled:opacity-50"
          >
            <option value="personal_best">Personal Best</option>
            <option value="latest_run">Latest Run</option>
            <option value="worst_run">Worst Run</option>
            <option value="custom_target">Custom Target</option>
          </select>
        </label>

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-zinc-100 px-4 py-2 font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}