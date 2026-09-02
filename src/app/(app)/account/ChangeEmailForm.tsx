"use client";

import { useActionState } from "react";
import {
  changeEmail,
  type EmailState,
} from "@/app/actions/account";

const initialState: EmailState = {};

type ChangeEmailFormProps = {
  currentEmail: string;
};

export function ChangeEmailForm({
  currentEmail,
}: ChangeEmailFormProps) {
  const [state, formAction, pending] = useActionState(
    changeEmail,
    initialState
  );

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <div>
        <label
          htmlFor="email"
          className="block text-sm text-zinc-400"
        >
          New email address
        </label>

        <input
          id="email"
          name="email"
          type="email"
          defaultValue={currentEmail}
          placeholder="example@email.com"
          required
          disabled={pending}
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 disabled:opacity-60"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="text-sm text-green-400">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving..." : "Change Email Address"}
      </button>
    </form>
  );
}