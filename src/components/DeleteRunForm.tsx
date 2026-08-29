"use client";

import { useActionState } from "react";
import { deleteRun } from "@/app/actions/runs";
import { initialActionState } from "@/lib/action-state";

type DeleteRunFormProps = {
  runId: string;
  categoryId: string;
};

export default function DeleteRunForm({
  runId,
  categoryId,
}: DeleteRunFormProps) {
  const deleteRunWithIds = deleteRun.bind(null, runId, categoryId);

  const [state, formAction, pending] = useActionState(
    deleteRunWithIds,
    initialActionState
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Are you sure you want to delete this run?\n\nThis cannot be undone."
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={pending}
        aria-label="Delete run"
        title="Delete run"
        className="text-zinc-400 hover:text-red-400 disabled:opacity-50"
      >
        {pending ? "..." : "🗑"}
      </button>

      {state.error && (
        <p role="alert" className="mt-1 text-xs text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}