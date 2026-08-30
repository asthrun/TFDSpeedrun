"use server";

import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { UserSettings } from "@/lib/database.types";

const SHORTCUT_FIELDS = [
  "shortcut_start",
  "shortcut_stop",
  "shortcut_split",
  "shortcut_reset",
  "shortcut_undo",
  "shortcut_next_section",
] as const;

const SETTING_FIELDS = [
  "chroma_hex",
  "transparent_background",
  "font_scale",
  "font_family",
  "show_best_of",
  "show_sum_of_best",
  "show_pb_delta",
  "show_section_delta",
  "compare_mode",
] as const;

type SettingField = (typeof SETTING_FIELDS)[number];

type SettingsPatch = Partial<
  Pick<UserSettings, SettingField>
>;

export async function updateSettings(
  patch: SettingsPatch
) {
  const { supabase, user } = await requireUser();

  const safePatch: SettingsPatch = {};

  for (const field of SETTING_FIELDS) {
    if (field in patch) {
      (safePatch as Record<string, unknown>)[field] =
        patch[field];
    }
  }

  const { error } = await supabase
    .from("user_settings")
    .update({
      ...safePatch,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update settings:", error);

    return {
      error: "We couldn't save your settings. Please try again.",
    };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return {
    error: null as string | null,
  };
}

export async function updateShortcuts(formData: FormData) {
  const { supabase, user } = await requireUser();

  const patch: Record<string, string | null> = {};

  for (const field of SHORTCUT_FIELDS) {
    const value = String(formData.get(field) ?? "").trim();
    patch[field] = value.length === 0 ? null : value;
  }

  const { error } = await supabase
    .from("user_settings")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update shortcuts:", error);

    return {
      error: "We couldn't save your keyboard shortcuts. Please try again.",
    };
  }

  revalidatePath("/settings");

  return {
    error: null as string | null,
  };
}