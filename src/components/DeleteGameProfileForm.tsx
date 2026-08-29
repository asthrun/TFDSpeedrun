"use client";

import { useActionState } from "react";
import { deleteGameProfile } from "@/app/actions/catalog";
import { initialActionState } from "@/lib/action-state";

type Props = {
  profileId: string;
};

export default function DeleteGameProfileForm({ profileId }: Props) {
  const deleteGameProfileForId = deleteGameProfile.bind(null, profileId);

  const [state, formAction, isPending] = useActionState(
    deleteGameProfileForId,
    initialActionState
  );

  return (
    <form
      action={formAction}
      className="mt-10"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Are you sure you want to delete this GameProfile? This cannot be undone."
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="text-sm text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Deleting..." : "Delete this game profile"}
      </button>

      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}