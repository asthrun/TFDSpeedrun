import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserSettings } from "@/lib/database.types";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getSettings(): Promise<UserSettings> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load user settings:", error);
    throw new Error("Failed to load user settings.");
  }

  if (data) {
    return data;
  }

  const { data: created, error: insertError } = await supabase
    .from("user_settings")
    .insert({ user_id: user.id })
    .select("*")
    .single();

  if (insertError) {
    console.error("Failed to create user settings:", insertError);
    throw new Error("Failed to create user settings.");
  }

  return created;
}
