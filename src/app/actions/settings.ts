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

export async function updateSettings(patch: Partial<UserSettings>) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("user_settings")
    .update({
      ...patch,
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