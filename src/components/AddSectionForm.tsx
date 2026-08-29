"use client";

import { useActionState } from "react";
import { addSection } from "@/app/actions/catalog";
import { initialActionState } from "@/lib/action-state";

type Props = {
  categoryId: string;
};

export default function AddSectionForm({ categoryId }: Props) {
  const addSectionForCategory = addSection.bind(null, categoryId);

  const [state, formAction, isPending] = useActionState(
    addSectionForCategory,
    initialActionState
  );

  return (
    <form action={formAction} className="mt-3">
      <div className="flex gap-2">
        <input
          name="name"
          required
          disabled={isPending}
          placeholder="Section name"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-100 px-4 py-2 font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add section"}
        </button>
      </div>

      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}