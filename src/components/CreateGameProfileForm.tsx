"use client";

import { useActionState } from "react";
import { createGameProfile } from "@/app/actions/catalog";
import { initialActionState } from "@/lib/action-state";

export default function CreateGameProfileForm() {
  const [state, formAction, isPending] = useActionState(
    createGameProfile,
    initialActionState
  );

  return (
    <form action={formAction} className="mt-6">
      <div className="flex gap-2">
        <input
          name="name"
          required
          disabled={isPending}
          placeholder="e.g. Karel's Mothership Conquest"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-100 px-4 py-2 font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create"}
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