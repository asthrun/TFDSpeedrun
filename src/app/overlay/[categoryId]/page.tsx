import { notFound } from "next/navigation";
import { RunBoard } from "@/components/RunBoard";
import { loadCategoryBundle } from "@/lib/load-category";

export default async function OverlayPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const bundle = await loadCategoryBundle(categoryId);
  if (!bundle) notFound();

  return (
    <RunBoard
      category={bundle.category}
      profileName={bundle.profile.name}
      sections={bundle.sections}
      settings={bundle.settings}
      history={bundle.history}
      customTargetSplits={bundle.customTargetSplits}
      overlay
    />
  );
}
