import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createCategory,
  deleteGameProfile,
  renameGameProfile,
} from "@/app/actions/catalog";
import { requireUser } from "@/lib/auth";
import { formatTime } from "@/lib/format-time";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("game_profiles")
    .select("*")
    .eq("id", profileId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) notFound();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("game_profile_id", profileId)
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
        ← Dashboard
      </Link>
      <form action={renameGameProfile.bind(null, profile.id)} className="mt-4 flex gap-2">
        <input
          name="name"
          defaultValue={profile.name}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xl font-semibold"
        />
        <button type="submit" className="rounded-lg border border-zinc-700 px-3">
          Rename
        </button>
      </form>

      <h2 className="mt-8 text-lg font-medium">Categories</h2>
      <form action={createCategory.bind(null, profile.id)} className="mt-3 grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
        <input
          name="name"
          required
          placeholder='e.g. Onslaught 4'
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
        />
        <input
          name="target_time"
          placeholder="mm:ss.SSS"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono"
        />
        <button type="submit" className="rounded-lg bg-zinc-100 px-4 py-2 font-medium text-zinc-950">
          Add
        </button>
      </form>
      <p className="mt-1 text-xs text-zinc-500">Target time is optional (world record / compare-to).</p>

      <ul className="mt-4 space-y-2">
        {(categories ?? []).map((category) => (
          <li key={category.id} className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2">
            <Link href={`/categories/${category.id}`} className="hover:underline">
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

      <form action={deleteGameProfile.bind(null, profile.id)} className="mt-10">
        <button type="submit" className="text-sm text-red-400 hover:text-red-300">
          Delete this game profile
        </button>
      </form>
    </main>
  );
}
