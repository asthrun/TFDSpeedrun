"use server";

import { requireUser } from "@/lib/auth";
import { isRunValid, type LiveRunState } from "@/lib/live-run";
import { revalidatePath } from "next/cache";

export async function persistLiveRun(
  state: LiveRunState,
  sectionCount: number
) {
  const { supabase, user } = await requireUser();

  const valid =
    isRunValid(state.splits, sectionCount) &&
    state.status === "stopped";

  const startedAt = new Date(state.startedAt).toISOString();
  const completedAt =
    state.status === "stopped" ? new Date().toISOString() : null;

  let runId = state.runId;

  if (runId) {
    const { data, error } = await supabase
      .from("runs")
      .update({
        completed_at: completedAt,
        is_valid: valid,
      })
      .eq("id", runId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Failed to update run:", error);

      return {
        error: "Your run could not be saved. Please try again.",
        runId,
      };
    }

    if (!data) {
      runId = null;
    }
  }

  if (!runId) {
    const { data, error } = await supabase
      .from("runs")
      .insert({
        category_id: state.categoryId,
        user_id: user.id,
        started_at: startedAt,
        completed_at: completedAt,
        is_valid: valid,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create run:", error);

      return {
        error: "Your run could not be saved. Please try again.",
        runId: null as string | null,
      };
    }

    runId = data.id;
  }

  state.runId = runId;

  const { error: deleteSplitsError } = await supabase
    .from("run_splits")
    .delete()
    .eq("run_id", state.runId)
    .eq("user_id", user.id);

  if (deleteSplitsError) {
    console.error("Failed to replace run splits:", deleteSplitsError);

    return {
      error: "Your run could not be saved completely. Please try again.",
      runId: state.runId,
    };
  }

  const rows = state.splits
    .filter(
      (split): split is { sectionId: string; timeMs: number } =>
        split !== null
    )
    .map((split) => ({
      run_id: state.runId as string,
      section_id: split.sectionId,
      user_id: user.id,
      time_ms: split.timeMs,
    }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from("run_splits")
      .insert(rows);

    if (error) {
      console.error("Failed to save run splits:", error);

      return {
        error: "Your run could not be saved completely. Please try again.",
        runId: state.runId,
      };
    }
  }

  revalidatePath(`/categories/${state.categoryId}`);
  revalidatePath(`/categories/${state.categoryId}/history`);
  revalidatePath(`/overlay/${state.categoryId}`);

  return {
    error: null as string | null,
    runId,
  };
}

export async function abandonRun(
  runId: string,
  categoryId: string
) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("runs")
    .delete()
    .eq("id", runId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to abandon run:", error);

    return {
      error:
        "The timer was reset, but the saved run could not be removed.",
    };
  }

  revalidatePath(`/categories/${categoryId}`);
  revalidatePath(`/categories/${categoryId}/history`);

  return {
    error: null as string | null,
  };
}

export async function deleteRun(runId: string, categoryId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("runs").delete().eq("id", runId).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/categories/${categoryId}/history`);
  revalidatePath(`/categories/${categoryId}`);
}
