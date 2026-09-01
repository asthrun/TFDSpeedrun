"use server";

import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { UserSettings } from "@/lib/database.types";

const SHORTCUT_FIELDS = [
  "shortcut_start_split",
  "shortcut_pause",
  "shortcut_reset",
  "shortcut_undo",
  "shortcut_skip",
] as const;

const SETTING_FIELDS = [
  "font_family",
  "font_scale",
  "show_compare_delta",
  "double_tap_delay_ms",
  "save_incomplete_runs",

  // Timer Layout
  "show_game_profile",
  "show_category",
  "show_compare_to",
  "visible_split_count",

  // Appearance
  "text_shadow",
  "timer_background_mode",
  "timer_background_color",
  "timer_background_opacity",

  // Split backgrounds
  "splits_background_mode",
  "splits_background_color_1",
  "splits_background_color_2",
  "splits_background_opacity",

  // Semantic colors
  "primary_text_color",
  "secondary_text_color",
  "ahead_gaining_color",
  "ahead_losing_color",
  "behind_gaining_color",
  "behind_losing_color",
  "best_segment_color",
  "paused_color",
  
  // OBS
  "chroma_key_enabled",
  "chroma_key_color",
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

      if ("visible_split_count" in safePatch) {
        const value =
          safePatch.visible_split_count;

        if (
              value !== undefined &&
              value !== null &&
              (!Number.isInteger(value) || value < 1)
            ) {
          return {
            error:
              "Visible split count must be a positive whole number or All.",
          };
        }
      }

      if ("double_tap_delay_ms" in safePatch) {
        const value =
          safePatch.double_tap_delay_ms;

        if (
          value !== undefined &&
          (!Number.isInteger(value) ||
            value < 0 ||
            value > 5000)
        ) {
          return {
            error:
              "Double Tap Prevention must be a whole number between 0 and 5000 milliseconds.",
          };
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
  revalidatePath("/categories", "layout");

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

  const assignedShortcuts = Object.values(
    patch
  ).filter(
    (value): value is string =>
      value !== null
  );

  const normalizedShortcuts =
    assignedShortcuts.map((value) =>
      value.toLowerCase()
    );

  if (
    new Set(normalizedShortcuts).size !==
    normalizedShortcuts.length
  ) {
    return {
      error:
        "Each keyboard shortcut must use a different key.",
    };
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