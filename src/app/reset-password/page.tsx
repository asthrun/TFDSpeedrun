"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage("Password updated. You can return to the dashboard.");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center p-6">
      <form onSubmit={submit} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <h1 className="text-2xl font-semibold">Set a new password</h1>
        <label className="mt-4 grid gap-1 text-sm">
          New password
          <input
            type="password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
          />
        </label>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        {message && <p className="mt-2 text-sm text-emerald-400">{message}</p>}
        <button type="submit" className="mt-4 w-full rounded-lg bg-zinc-100 py-2 font-medium text-zinc-950">
          Update password
        </button>
      </form>
    </main>
  );
}
