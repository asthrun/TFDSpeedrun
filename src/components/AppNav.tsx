import Link from "next/link";
import { signOut } from "@/app/actions/catalog";

export function AppNav({ email }: { email: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
      <Link href="/dashboard" className="font-semibold tracking-tight">
        TFD Speedrun
      </Link>
      <nav className="flex flex-wrap items-center gap-4 text-sm text-zinc-300">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/settings">Settings</Link>
        <span className="hidden text-zinc-500 sm:inline">{email}</span>
        <form action={signOut}>
          <button type="submit" className="text-zinc-300 hover:text-white">
            Log out
          </button>
        </form>
      </nav>
    </header>
  );
}
