import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCategoryBundle } from "@/lib/load-category";
import RunHistoryTable from "@/components/RunHistoryTable";

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{ highlight?: string }>;
}) {
  const { categoryId } = await params;
  const { highlight } = await searchParams;

  const bundle = await loadCategoryBundle(categoryId);

  if (!bundle) {
    notFound();
  }

  const completed = bundle.history.filter(
    (run) => run.completed_at
  );

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <Link
        href={`/categories/${categoryId}`}
        className="text-sm text-zinc-400 hover:text-white"
      >
        ← Timer
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">
        Run history
      </h1>

      <p className="text-sm text-zinc-400">
        Read-only times. Delete a run if it should not count.
      </p>

      <RunHistoryTable
        runs={completed}
        sections={bundle.sections}
        categoryId={categoryId}
        highlightRunId={highlight}
      />
    </main>
  );
}
