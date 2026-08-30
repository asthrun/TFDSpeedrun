"use server";

import { requireUser } from "@/lib/auth";
import { formatTime } from "@/lib/format-time";

export async function exportCsv(): Promise<{ error: string | null; csv: string | null }> {
  const { supabase, user } = await requireUser();

  const { data: profiles, error: profileError } = await supabase
    .from("game_profiles")
    .select("id, name")
    .eq("user_id", user.id);
  if (profileError) {
  console.error("Failed to load profiles for CSV export:", profileError);
  return {
    error: "We couldn't export your data. Please try again.",
    csv: null,
  };
}

  const { data: categories, error: categoryError } = await supabase
    .from("categories")
    .select("id, name, game_profile_id, target_time_ms")
    .eq("user_id", user.id);
  if (categoryError) {
  console.error("Failed to load categories for CSV export:", categoryError);
  return {
    error: "We couldn't export your data. Please try again.",
    csv: null,
  };
}

  const { data: sections, error: sectionError } = await supabase
    .from("sections")
    .select("id, name, category_id, sort_order")
    .eq("user_id", user.id);
if (sectionError) {
  console.error("Failed to load sections for CSV export:", sectionError);
  return {
    error: "We couldn't export your data. Please try again.",
    csv: null,
  };
}

  const { data: runs, error: runError } = await supabase
    .from("runs")
    .select("id, category_id, started_at, completed_at, is_valid")
    .eq("user_id", user.id)
    .order("started_at", { ascending: true });
  if (runError) {
  console.error("Failed to load runs for CSV export:", runError);
  return {
    error: "We couldn't export your data. Please try again.",
    csv: null,
  };
}

  const { data: splits, error: splitError } = await supabase
    .from("run_splits")
    .select("run_id, section_id, time_ms")
    .eq("user_id", user.id);
if (splitError) {
  console.error("Failed to load splits for CSV export:", splitError);
  return {
    error: "We couldn't export your data. Please try again.",
    csv: null,
  };
}

  const profileName = new Map((profiles ?? []).map((p) => [p.id, p.name]));
  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));
  const sectionById = new Map((sections ?? []).map((s) => [s.id, s]));

  const lines = [
    [
      "profile",
      "category",
      "run_id",
      "started_at",
      "completed_at",
      "valid",
      "section_order",
      "section",
      "segment_ms",
      "segment_time",
    ].join(","),
  ];

  for (const run of runs ?? []) {
    const category = categoryById.get(run.category_id);
    const profile = category ? profileName.get(category.game_profile_id) ?? "" : "";
    const runSplits = (splits ?? []).filter((s) => s.run_id === run.id);
    if (runSplits.length === 0) {
      lines.push(
        [
          csv(profile),
          csv(category?.name ?? ""),
          csv(run.id),
          csv(run.started_at),
          csv(run.completed_at ?? ""),
          run.is_valid ? "true" : "false",
          "",
          "",
          "",
          "",
        ].join(","),
      );
      continue;
    }
    for (const split of runSplits) {
      const section = sectionById.get(split.section_id);
      lines.push(
        [
          csv(profile),
          csv(category?.name ?? ""),
          csv(run.id),
          csv(run.started_at),
          csv(run.completed_at ?? ""),
          run.is_valid ? "true" : "false",
          String(section?.sort_order ?? ""),
          csv(section?.name ?? ""),
          String(split.time_ms),
          csv(formatTime(split.time_ms)),
        ].join(","),
      );
    }
  }

  return { error: null, csv: lines.join("\n") };
}

function csv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
