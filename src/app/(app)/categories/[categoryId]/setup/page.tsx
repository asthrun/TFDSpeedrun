import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCategoryBundle } from "@/lib/load-category";
import { formatTime } from "@/lib/format-time";
import UpdateCategoryForm from "@/components/UpdateCategoryForm";
import AddSectionForm from "@/components/AddSectionForm";
import RenameSectionForm from "@/components/RenameSectionForm";
import DeleteCategoryForm from "@/components/DeleteCategoryForm";
import CustomTargetForm from "@/components/CustomTargetForm";

export default async function CategorySetupPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;

  const bundle = await loadCategoryBundle(categoryId);

  if (!bundle) notFound();

  const {
    category,
    profile,
    sections,
    customTargetSplits,
  } = bundle;

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Link href={`/categories/${categoryId}`} className="text-sm text-zinc-400 hover:text-white">
        ← Timer
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Category setup</h1>

      <UpdateCategoryForm
        categoryId={categoryId}
        currentName={category.name}
        currentTargetTime={
          category.target_time_ms == null
            ? ""
            : formatTime(category.target_time_ms)
        }
        currentCompareMode={category.compare_mode}
      />

      <h2 className="mt-8 text-lg font-medium">Sections</h2>
      <p className="text-sm text-zinc-400">
        Order is fixed. New sections are appended. Rename is saved to your account.
      </p>
      <ol className="mt-3 space-y-2">
        {sections.map((section, index) => (
          <li key={section.id}>
            <RenameSectionForm
              sectionId={section.id}
              categoryId={categoryId}
              currentName={section.name}
              index={index}
            />
          </li>
        ))}
      </ol>
      <AddSectionForm categoryId={categoryId} />

      <CustomTargetForm
        categoryId={categoryId}
        sections={sections}
        currentTargets={customTargetSplits}
      />

      <DeleteCategoryForm
        categoryId={categoryId}
        profileId={profile.id}
      />
    </main>
  );
}
