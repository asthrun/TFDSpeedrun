"use client";

import { useActionState } from "react";
import { createCategory } from "@/app/actions/catalog";
import { initialActionState } from "@/lib/action-state";

type Props = {
  profileId: string;
};

export default function CreateCategoryForm({ profileId }: Props) {
  const createCategoryForProfile = createCategory.bind(null, profileId);

  const [state, formAction, isPending] = useActionState(
    createCategoryForProfile,
    initialActionState
  );

  return (
    <>
      <form
        action={formAction}
        className="mt-3 grid gap-2 sm:grid-cols-[1fr_10rem_auto]"
      >
        <input
          name="name"
          required
          disabled={isPending}
          placeholder="e.g. Onslaught 4"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 disabled:opacity-50"
        />

        <input
          name="target_time"
          disabled={isPending}
          placeholder="mm:ss.SSS"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-100 px-4 py-2 font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add"}
        </button>
      </form>

      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <p className="mt-1 text-xs text-zinc-500">
        Target time is optional (world record / compare-to).
      </p>
    </>
  );
}