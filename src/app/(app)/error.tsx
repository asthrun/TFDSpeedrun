"use client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-6">
        <h1 className="text-xl font-semibold text-red-300">
          Something went wrong
        </h1>

        <p className="mt-2 text-sm text-zinc-400">
          We couldn&apos;t load this page. Please try again.
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900"
        >
          Retry
        </button>
      </div>
    </main>
  );
}