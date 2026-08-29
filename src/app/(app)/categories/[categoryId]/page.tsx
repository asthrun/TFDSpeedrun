import Link from "next/link";
import { notFound } from "next/navigation";
import { RunBoard } from "@/components/RunBoard";
import { loadCategoryBundle } from "@/lib/load-category";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const bundle = await loadCategoryBundle(categoryId);
  if (!bundle) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="mb-4 flex flex-wrap gap-3 text-sm text-zinc-400">
        <Link href={`/profiles/${bundle.profile.id}`} className="hover:text-white">
          ← {bundle.profile.name}
        </Link>
        <Link href={`/categories/${categoryId}/setup`} className="hover:text-white">
          Setup
        </Link>
        <Link href={`/categories/${categoryId}/history`} className="hover:text-white">
          History
        </Link>
        <Link href={`/overlay/${categoryId}`} className="hover:text-white">
          OBS overlay
        </Link>
      </div>
      {bundle.sections.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 p-4 text-zinc-300">
          Add sections in{" "}
          <Link href={`/categories/${categoryId}/setup`} className="underline">
            setup
          </Link>{" "}
          before timing a run. Order is fixed once created.
        </p>
      ) : (
        <RunBoard
          category={bundle.category}
          profileName={bundle.profile.name}
          sections={bundle.sections}
          settings={bundle.settings}
          history={bundle.history}
        />
      )}
    </main>
  );
}
