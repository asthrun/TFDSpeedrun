"use client";

import { useActionState, useState } from "react";
import {
  deleteAccount,
  type DeleteAccountState,
} from "@/app/actions/account";

const initialState: DeleteAccountState = {};

export function DeleteAccountForm() {
  const [state, formAction, isPending] =
    useActionState(deleteAccount, initialState);

  const [confirmation, setConfirmation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const canDelete =
    confirmation === "DELETE" &&
    currentPassword.length > 0 &&
    !isPending;

  return (
    <form
      action={formAction}
      className="mt-6 border-t border-red-900/60 pt-5"
    >
      <h3 className="font-medium text-red-400">
        Delete Account
      </h3>

      <p className="mt-2 text-sm text-zinc-400">
        Permanently delete your account and all TFDSpeedrun data
        associated with it. This action cannot be undone.
      </p>

      <div className="mt-4">
        <label
          htmlFor="delete-confirmation"
          className="block text-sm font-medium"
        >
          Type{" "}
          <span className="font-mono text-red-400">
            DELETE
          </span>{" "}
          to confirm
        </label>

        <input
          id="delete-confirmation"
          name="confirmation"
          type="text"
          autoComplete="off"
          value={confirmation}
          onChange={(event) =>
            setConfirmation(event.target.value)
          }
          className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="delete-current-password"
          className="block text-sm font-medium"
        >
          Current password
        </label>

        <input
          id="delete-current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) =>
            setCurrentPassword(event.target.value)
          }
          className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        />
      </div>

      {state.error && (
        <p className="mt-3 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canDelete}
        className="mt-5 rounded-md border border-red-800 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950/60 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending
          ? "Deleting Account..."
          : "Delete Account Permanently"}
      </button>
    </form>
  );
}