import Link from "next/link";

export default function EmailConfirmedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
        <h1 className="text-2xl font-semibold">
          Welcome to TFDSpeedrun
        </h1>

        <p className="mt-4 text-zinc-300">
          Your email address has been confirmed successfully.
        </p>

        <p className="mt-2 text-sm text-zinc-400">
          You can now close this window or return to the login page.
        </p>

        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-zinc-100 px-4 py-2 font-medium text-zinc-950"
        >
          Return to Login
        </Link>
      </div>
    </main>
  );
}