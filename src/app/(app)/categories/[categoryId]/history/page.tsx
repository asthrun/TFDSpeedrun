import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteRun } from "@/app/actions/runs";
import { loadCategoryBundle } from "@/lib/load-category";
import { formatTime } from "@/lib/format-time";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const bundle = await loadCategoryBundle(categoryId);
  if (!bundle) notFound();

      const completed = bundle.history.filter((run) => run.completed_at);
      return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Link href={`/categories/${categoryId}`} className="text-sm text-zinc-400 hover:text-white">
        ← Timer
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Run history</h1>
      <p className="text-sm text-zinc-400">Read-only times. Delete a run if it should not count.</p>
      <ul className="mt-6 space-y-3">
        {completed.length === 0 && <li className="text-zinc-500">No runs yet.</li>}
        {completed.map((run) => {
          const total = run.splits.reduce((sum, split) => sum + split.time_ms, 0);
          return (
            <li key={run.id} className="rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono">{formatTime(total)}</div>
                  <div className="text-xs text-zinc-500">
                    {new Date(run.started_at).toLocaleString()} · {run.is_valid ? "Valid" : "Invalid"}
                  </div>
                </div>
                <form action={deleteRun.bind(null, run.id, categoryId)}>
                  <button type="submit" className="text-sm text-red-400">
                    Delete
                  </button>
                </form>
              </div>
              <ol className="mt-3 grid gap-1 text-sm">
                {bundle.sections.map((section) => {
                  const split = run.splits.find((item) => item.section_id === section.id);
                  return (
                    <li key={section.id} className="flex justify-between font-mono text-zinc-300">
                      <span className="font-sans">{section.name}</span>
                      <span>{split ? formatTime(split.time_ms) : "—"}</span>
                    </li>
                  );
                })}
              </ol>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
