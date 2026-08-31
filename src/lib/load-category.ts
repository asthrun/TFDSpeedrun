import type { RunWithSplits } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import type {
  Category,
  Database,
  GameProfile,
  RunSplit,
  Section,
  UserSettings,
} from "@/lib/database.types";
type CustomTargetSplit =
  Database["public"]["Tables"]["custom_target_splits"]["Row"];

export async function loadCategoryBundle(categoryId: string): Promise<{
  category: Category;
  profile: GameProfile;
  sections: Section[];
  settings: UserSettings;
  history: RunWithSplits[];
  customTargetSplits: CustomTargetSplit[];
} | null> {
  const { supabase, user } = await requireUser();

  const {
    data: category,
    error: categoryError,
  } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (categoryError) {
    console.error("Failed to load category:", categoryError);
    throw new Error("Failed to load category.");
  }

  if (!category) {
    return null;
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("game_profiles")
    .select("*")
    .eq("id", category.game_profile_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load game profile:", profileError);
    throw new Error("Failed to load game profile.");
  }

  if (!profile) {
    return null;
  }

  const {
    data: sections,
    error: sectionsError,
  } = await supabase
    .from("sections")
    .select("*")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });

  if (sectionsError) {
    console.error("Failed to load sections:", sectionsError);
    throw new Error("Failed to load sections.");
  }

    const {
      data: customTargetSplits,
      error: customTargetSplitsError,
    } = await supabase
      .from("custom_target_splits")
      .select("*")
      .eq("category_id", categoryId)
      .eq("user_id", user.id);

    if (customTargetSplitsError) {
      console.error(
        "Failed to load custom target splits:",
        customTargetSplitsError,
      );

      throw new Error(
        "Failed to load custom target splits.",
      );
    }

  const {
    data: settingsRow,
    error: settingsError,
  } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (settingsError) {
    console.error("Failed to load user settings:", settingsError);
    throw new Error("Failed to load user settings.");
  }

  let settings = settingsRow;

  if (!settings) {
    const {
      data: newSettings,
      error: createSettingsError,
    } = await supabase
      .from("user_settings")
      .insert({ user_id: user.id })
      .select("*")
      .single();

    if (createSettingsError) {
      console.error(
        "Failed to create user settings:",
        createSettingsError
      );
      throw new Error("Failed to create user settings.");
    }

    settings = newSettings;
  }

  const {
    data: runs,
    error: runsError,
  } = await supabase
    .from("runs")
    .select("*")
    .eq("category_id", categoryId)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (runsError) {
    console.error("Failed to load runs:", runsError);
    throw new Error("Failed to load runs.");
  }

  const runIds = runs.map((run) => run.id);

  let splits: RunSplit[] = [];

  if (runIds.length > 0) {
    const {
      data: splitRows,
      error: splitsError,
    } = await supabase
      .from("run_splits")
      .select("*")
      .in("run_id", runIds);

    if (splitsError) {
      console.error("Failed to load run splits:", splitsError);
      throw new Error("Failed to load run splits.");
    }

    splits = splitRows;
  }

  const history: RunWithSplits[] = runs.map((run) => ({
    ...run,
    splits: splits.filter(
      (split) => split.run_id === run.id
    ),
  }));

  return {
    category,
    profile,
    sections,
    settings,
    history,
    customTargetSplits,
  };
}