"use client";

import Link from "next/link";
import { signOut } from "@/app/actions/catalog";
import { useCompanionStatus } from "@/components/CompanionStatusProvider";

type AppNavProps = {
  username: string;
  privacyMode: boolean;
};

export function AppNav({
  username,
  privacyMode,
}: AppNavProps) {
  const { status } = useCompanionStatus();

  const displayedUsername = privacyMode
    ? "Hidden"
    : username;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
      <Link
        href="/dashboard"
        className="font-semibold tracking-tight"
      >
        TFD Speedrun
      </Link>

      <nav className="flex flex-wrap items-center gap-4 text-sm text-zinc-300">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/settings">Settings</Link>

        <div
          className="flex items-center gap-1.5 text-xs text-zinc-500"
          title={
            status === "connected"
              ? "TFDSpeedrun Companion is connected."
              : "TFDSpeedrun Companion is not connected."
          }
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === "connected"
                ? "bg-emerald-500"
                : "bg-zinc-600"
            }`}
            aria-hidden="true"
          />

          <span>
            Companion:{" "}
            {status === "connected"
              ? "Connected"
              : "Disconnected"}
          </span>
        </div>

        <Link
          href="/account"
          className="hidden text-zinc-500 hover:text-white sm:inline"
        >
          {displayedUsername}
        </Link>

        <form action={signOut}>
          <button
            type="submit"
            className="text-zinc-300 hover:text-white"
          >
            Log out
          </button>
        </form>
      </nav>
    </header>
  );
}
