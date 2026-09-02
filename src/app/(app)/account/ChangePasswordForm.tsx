"use client";

import { useActionState, useState } from "react";
import {
  changePassword,
  changePasswordWithNonce,
  requestPasswordReauthentication,
  type PasswordState,
} from "@/app/actions/account";

const initialState: PasswordState = {};

export function ChangePasswordForm() {
  const [reauthenticationMode, setReauthenticationMode] =
    useState(false);

  const [reauthMessage, setReauthMessage] =
    useState<string | null>(null);

  const [reauthError, setReauthError] =
    useState<string | null>(null);

  const [requestingCode, setRequestingCode] =
    useState(false);

  const [passwordState, passwordAction, passwordPending] =
    useActionState(changePassword, initialState);

  const [
    nonceState,
    nonceAction,
    noncePending,
  ] = useActionState(
    changePasswordWithNonce,
    initialState
  );

  async function handleRequestCode() {
    setRequestingCode(true);
    setReauthMessage(null);
    setReauthError(null);

    try {
      const result =
        await requestPasswordReauthentication();

      if (result.error) {
        setReauthError(result.error);
        return;
      }

      setReauthMessage(
        result.success ??
          "Verification code sent."
      );

      setReauthenticationMode(true);
    } catch (error) {
      console.error(
        "Unexpected password reauthentication error:",
        error
      );

      setReauthError(
        "Unable to send a verification code. Please try again."
      );
    } finally {
      setRequestingCode(false);
    }
  }

  if (reauthenticationMode) {
    return (
      <form
        action={nonceAction}
        className="mt-4 space-y-3"
      >
        <div>
          <label
            htmlFor="nonce"
            className="block text-sm text-zinc-400"
          >
            Verification code
          </label>

          <input
            id="nonce"
            name="nonce"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            disabled={noncePending}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="reauthNewPassword"
            className="block text-sm text-zinc-400"
          >
            New password
          </label>

          <input
            id="reauthNewPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={noncePending}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="reauthConfirmPassword"
            className="block text-sm text-zinc-400"
          >
            Confirm new password
          </label>

          <input
            id="reauthConfirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={noncePending}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 disabled:opacity-60"
          />
        </div>

        {reauthMessage ? (
          <p className="text-sm text-green-400">
            {reauthMessage}
          </p>
        ) : null}

        {nonceState.error ? (
          <p className="text-sm text-red-400">
            {nonceState.error}
          </p>
        ) : null}

        {nonceState.success ? (
          <p className="text-sm text-green-400">
            {nonceState.success}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={noncePending}
            className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {noncePending
              ? "Saving..."
              : "Verify & Change Password"}
          </button>

          <button
            type="button"
            disabled={noncePending}
            onClick={() =>
              setReauthenticationMode(false)
            }
            className="rounded-md px-3 py-2 text-sm text-zinc-400 hover:text-white disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <form
        action={passwordAction}
        className="space-y-3"
      >
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm text-zinc-400"
          >
            Current password
          </label>

          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            disabled={passwordPending}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm text-zinc-400"
          >
            New password
          </label>

          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={passwordPending}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm text-zinc-400"
          >
            Confirm new password
          </label>

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={passwordPending}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 disabled:opacity-60"
          />
        </div>

        {passwordState.error ? (
          <p className="text-sm text-red-400">
            {passwordState.error}
          </p>
        ) : null}

        {passwordState.success ? (
          <p className="text-sm text-green-400">
            {passwordState.success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={passwordPending}
          className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {passwordPending
            ? "Saving..."
            : "Change Password"}
        </button>
      </form>

      <div className="border-t border-zinc-800 pt-4">
        <p className="text-sm text-zinc-400">
          If Supabase requires additional verification,
          request a one-time verification code.
        </p>

        {reauthError ? (
          <p className="mt-2 text-sm text-red-400">
            {reauthError}
          </p>
        ) : null}

        <button
          type="button"
          disabled={requestingCode}
          onClick={handleRequestCode}
          className="mt-3 text-sm text-zinc-300 hover:text-white disabled:opacity-60"
        >
          {requestingCode
            ? "Sending code..."
            : "Send Verification Code"}
        </button>
      </div>
    </div>
  );
}
