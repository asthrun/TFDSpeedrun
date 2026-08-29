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
  if (error) throw error;
  if (data) return data;

  const { data: created, error: insertError } = await supabase
    .from("user_settings")
    .insert({ user_id: user.id })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return created;
}
