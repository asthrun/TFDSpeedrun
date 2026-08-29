"use client";

import { useActionState } from "react";
import { renameSection } from "@/app/actions/catalog";
import { initialActionState } from "@/lib/action-state";

type Props = {
  sectionId: string;
  categoryId: string;
  currentName: string;
  index: number;
};

export default function RenameSectionForm({
  sectionId,
  categoryId,
  currentName,
  index,
}: Props) {
  const renameSectionForId = renameSection.bind(
    null,
    sectionId,
    categoryId
  );

  const [state, formAction, isPending] = useActionState(
    renameSectionForId,
    initialActionState
  );

  return (
    <form action={formAction}>
      <div className="flex gap-2">
        <span className="w-8 pt-2 text-zinc-500">{index + 1}.</span>

        <input
          name="name"
          defaultValue={currentName}
          disabled={isPending}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 disabled:opacity-50"
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
        <p role="alert" className="ml-8 mt-2 text-sm text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}