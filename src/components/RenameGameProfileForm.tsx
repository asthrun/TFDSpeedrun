"use client";

import { useActionState } from "react";
import { renameGameProfile } from "@/app/actions/catalog";
import { initialActionState } from "@/lib/action-state";

type Props = {
  profileId: string;
  currentName: string;
};

export default function RenameGameProfileForm({
  profileId,
  currentName,
}: Props) {
  const renameGameProfileForId = renameGameProfile.bind(null, profileId);

  const [state, formAction, isPending] = useActionState(
    renameGameProfileForId,
    initialActionState
  );

  return (
    <form action={formAction} className="mt-4">
      <div className="flex gap-2">
        <input
          name="name"
          defaultValue={currentName}
          disabled={isPending}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xl font-semibold disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg border border-zinc-700 px-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Renaming..." : "Rename"}
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