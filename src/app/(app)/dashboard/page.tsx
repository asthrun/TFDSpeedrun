import Link from "next/link";
import CreateGameProfileForm from "@/components/CreateGameProfileForm";
import CompanionPairingClient from "@/components/CompanionPairingClient";
import { requireUser } from "@/lib/auth";


export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const {
    data: profiles,
    error: profilesError,
  } = await supabase
    .from("game_profiles")
    .select("id, name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (profilesError) {
    console.error("Failed to load game profiles:", profilesError);
    throw new Error("Failed to load game profiles.");
  }

  const {
    data: categories,
    error: categoriesError,
  } = await supabase
    .from("categories")
    .select("id, name, game_profile_id")
    .eq("user_id", user.id);

  if (categoriesError) {
    console.error("Failed to load dashboard categories:", categoriesError);
    throw new Error("Failed to load dashboard categories.");
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <CompanionPairingClient />

      <h1 className="text-2xl font-semibold">Game profiles</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Each profile is a game or mode. Categories live inside a profile.
      </p>

      <CreateGameProfileForm />

      <ul className="mt-6 space-y-3">
        {profiles.map((profile) => {
        const cats = categories.filter(
          (c) => c.game_profile_id === profile.id
        );
          return (
            <li key={profile.id} className="rounded-xl border border-zinc-800 p-4">
              <Link href={`/profiles/${profile.id}`} className="text-lg font-medium hover:underline">
                {profile.name}
              </Link>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {cats.length === 0 && <span className="text-zinc-500">No categories yet</span>}
                {cats.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.id}`}
                    className="rounded-full bg-zinc-800 px-3 py-1"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
