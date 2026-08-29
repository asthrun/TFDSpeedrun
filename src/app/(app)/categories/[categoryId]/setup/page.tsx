import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addSection,
  deleteCategory,
  renameSection,
  updateCategory,
} from "@/app/actions/catalog";
import { loadCategoryBundle } from "@/lib/load-category";
import { formatTime } from "@/lib/format-time";

export default async function CategorySetupPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const bundle = await loadCategoryBundle(categoryId);
  if (!bundle) notFound();
  const { category, profile, sections } = bundle;

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Link href={`/categories/${categoryId}`} className="text-sm text-zinc-400 hover:text-white">
        ← Timer
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Category setup</h1>

      <form action={updateCategory.bind(null, categoryId)} className="mt-4 grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
        <input
          name="name"
          defaultValue={category.name}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
        />
        <input
          name="target_time"
          defaultValue={category.target_time_ms == null ? "" : formatTime(category.target_time_ms)}
          placeholder="mm:ss.SSS"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono"
        />
        <button type="submit" className="rounded-lg bg-zinc-100 px-4 py-2 font-medium text-zinc-950">
          Save
        </button>
      </form>

      <h2 className="mt-8 text-lg font-medium">Sections</h2>
      <p className="text-sm text-zinc-400">
        Order is fixed. New sections are appended. Rename is saved to your account.
      </p>
      <ol className="mt-3 space-y-2">
        {sections.map((section, index) => (
          <li key={section.id}>
            <form action={renameSection.bind(null, section.id, categoryId)} className="flex gap-2">
              <span className="w-8 pt-2 text-zinc-500">{index + 1}.</span>
              <input
                name="name"
                defaultValue={section.name}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
              <button type="submit" className="rounded-lg border border-zinc-700 px-3">
                Rename
              </button>
            </form>
          </li>
        ))}
      </ol>
      <form action={addSection.bind(null, categoryId)} className="mt-3 flex gap-2">
        <input
          name="name"
          required
          placeholder="Section name"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
        />
        <button type="submit" className="rounded-lg bg-zinc-100 px-4 py-2 font-medium text-zinc-950">
          Add section
        </button>
      </form>

      <form action={deleteCategory.bind(null, categoryId, profile.id)} className="mt-10">
        <button type="submit" className="text-sm text-red-400">
          Delete this category
        </button>
      </form>
    </main>
  );
}
