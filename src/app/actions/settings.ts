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
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/dashboard");
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
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
}
