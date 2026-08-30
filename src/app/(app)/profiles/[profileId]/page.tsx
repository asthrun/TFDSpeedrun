import Link from "next/link";
import { notFound } from "next/navigation";
import CreateCategoryForm from "@/components/CreateCategoryForm";
import RenameGameProfileForm from "@/components/RenameGameProfileForm";
import { requireUser } from "@/lib/auth";
import { formatTime } from "@/lib/format-time";
import DeleteGameProfileForm from "@/components/DeleteGameProfileForm";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const { supabase, user } = await requireUser();
  const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("game_profiles")
          .select("*")
          .eq("id", profileId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Failed to load game profile:", profileError);
          throw new Error("Failed to load game profile.");
        }

        if (!profile) {
          notFound();
        }

  const {
          data: categories,
          error: categoriesError,
        } = await supabase
          .from("categories")
          .select("*")
          .eq("game_profile_id", profileId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (categoriesError) {
          console.error("Failed to load profile categories:", categoriesError);
          throw new Error("Failed to load profile categories.");
        }

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
        ← Dashboard
      </Link>
      <RenameGameProfileForm
        profileId={profile.id}
        currentName={profile.name}
      />

      <h2 className="mt-8 text-lg font-medium">Categories</h2>
        
        <CreateCategoryForm profileId={profile.id} />

      <ul className="mt-4 space-y-2">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2"
          >
            <Link
              href={`/categories/${category.id}`}
              className="hover:underline"
            >
              {category.name}
              {category.target_time_ms != null && (
                <span className="ml-2 font-mono text-zinc-500">
                  {formatTime(category.target_time_ms)}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <DeleteGameProfileForm profileId={profile.id} />
    </main>
  );
}
