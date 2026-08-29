import type { RunWithSplits } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import type { Category, GameProfile, Section, UserSettings } from "@/lib/database.types";

export async function loadCategoryBundle(categoryId: string): Promise<{
  category: Category;
  profile: GameProfile;
  sections: Section[];
  settings: UserSettings;
  history: RunWithSplits[];
} | null> {
  const { supabase, user } = await requireUser();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!category) return null;

  const { data: profile } = await supabase
    .from("game_profiles")
    .select("*")
    .eq("id", category.game_profile_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) return null;

  const { data: sections } = await supabase
    .from("sections")
    .select("*")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });

  const { data: settingsRow } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const settings =
    settingsRow ??
    (
      await supabase.from("user_settings").insert({ user_id: user.id }).select("*").single()
    ).data;

  if (!settings) return null;

  const { data: runs } = await supabase
    .from("runs")
    .select("*")
    .eq("category_id", categoryId)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  const runIds = (runs ?? []).map((run) => run.id);
  const { data: splits } =
    runIds.length > 0
      ? await supabase.from("run_splits").select("*").in("run_id", runIds)
      : { data: [] };

  const history: RunWithSplits[] = (runs ?? []).map((run) => ({
    ...run,
    splits: (splits ?? []).filter((split) => split.run_id === run.id),
  }));

  return {
    category,
    profile,
    sections: sections ?? [],
    settings,
    history,
  };
}
