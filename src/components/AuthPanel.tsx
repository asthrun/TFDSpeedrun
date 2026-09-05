"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LegalNotice } from "@/components/LegalNotice";
import Link from "next/link";
import { signUp } from "@/app/actions/auth";

type Mode = "signin" | "signup" | "forgot";

export function AuthPanel({
  nextPath = "/dashboard",
}: {
  nextPath?: string;
}) {
  const [mode, setMode] = useState<Mode>("signin");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window === "undefined" ? "" : window.location.origin);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setPending(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    try {
      if (mode === "signup") {
          const formData = new FormData();

          formData.set("username", username);
          formData.set("email", email);
          formData.set("password", password);
          formData.set("confirmPassword", confirmPassword);

          if (legalAccepted) {
            formData.set("legalAccepted", "on");
          }

          const result = await signUp({}, formData);

          if (result.error) {
            setError(result.error);
            return;
          }

          setMessage(
            result.success ?? "Check your email to confirm your account."
          );

          setUsername("");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          setLegalAccepted(false);
        } else if (mode === "forgot") {
        const { error: resetError } =
          await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
          });

        if (resetError) {
          throw resetError;
        }

        setMessage(
          "Password reset email sent if that account exists."
        );
      } else {
        const { error: signError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signError) {
          throw signError;
        }

        window.location.assign(nextPath);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setPending(false);
    }
  }

  async function magicLink() {
    setPending(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    try {
      const { error: otpError } =
        await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(
              nextPath
            )}`,
          },
        });

      if (otpError) {
        throw otpError;
      }

      setMessage("Magic link sent. Check your email.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setPending(false);
    }
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
    setPassword("");
    setConfirmPassword("");
    setLegalAccepted(false);

    if (nextMode !== "signup") {
      setUsername("");
    }
  }                             

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <h1 className="text-2xl font-semibold">
        {mode === "signup"
          ? "Create account"
          : mode === "forgot"
            ? "Reset password"
            : "Log in"}
      </h1>

      <p className="mt-1 text-sm text-zinc-400">
        Private timing dashboard for OBS capture.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-3">
        {mode === "signup" && (
          <label className="grid gap-1 text-sm">
            Username
            <input
              type="text"
              required
              minLength={2}
              maxLength={50}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            />
          </label>
        )}

        <label className="grid gap-1 text-sm">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
          />
        </label>

        {mode !== "forgot" && (
          <label className="grid gap-1 text-sm">
            Password
            <input
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "signup"
                  ? "new-password"
                  : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            />
          </label>
        )}

        {mode === "signup" && (
          <label className="grid gap-1 text-sm">
            Confirm password
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            />
          </label>
        )}

        {mode === "signup" && (
          <div className="grid gap-2 text-sm">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                className="mt-1"
              />

              <span className="text-zinc-300">
                I confirm that I am at least 16 years old and agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-zinc-100"
                >
                  Terms of Service
                </Link>
                .
              </span>
            </label>

            <p className="text-xs leading-5 text-zinc-500">
              By creating an account, you acknowledge that you have read the{" "}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-zinc-300"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {message && (
          <p className="text-sm text-emerald-400">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-100 py-2 font-medium text-zinc-950 disabled:opacity-50"
        >
          {pending
            ? "Please wait..."
            : mode === "signup"
              ? "Sign up"
              : mode === "forgot"
                ? "Send reset email"
                : "Log in"}
        </button>

        {mode === "signin" && (
          <button
            type="button"
            onClick={magicLink}
            disabled={pending || !email}
            className="rounded-lg border border-zinc-700 py-2 text-sm"
          >
            Send magic link instead
          </button>
        )}
      </form>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-400">
        {mode !== "signin" && (
          <button
            type="button"
            onClick={() => changeMode("signin")}
          >
            Log in
          </button>
        )}

        {mode !== "signup" && (
          <button
            type="button"
            onClick={() => changeMode("signup")}
          >
            Create account
          </button>
        )}

        {mode !== "forgot" && (
          <button
            type="button"
            onClick={() => changeMode("forgot")}
          >
            Forgot password
          </button>
        )}
      </div>
       <div className="mt-6 border-t border-zinc-800 pt-4">
        <LegalNotice />
      </div>
    </div>
  );
}
