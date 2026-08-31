"use server";

import { requireUser } from "@/lib/auth";
import { isRunValid, type LiveRunState } from "@/lib/live-run";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import {
  getTimerSegments,
  isTimerValid,
  type TimerState,
} from "@/lib/timer-engine";

export async function incrementAttemptCount(
  categoryId: string,
) {
  const { supabase } = await requireUser();

  const { error } = await supabase.rpc(
    "increment_category_attempt_count",
    {
      p_category_id: categoryId,
    },
  );

  if (error) {
    console.error("Failed to increment attempt count:", error);

    return {
      error: "Your attempt could not be counted.",
    };
  }

    revalidatePath(`/categories/${categoryId}`);
    revalidatePath(`/overlay/${categoryId}`);

    return {
      error: null as string | null,
    };
  }

export async function finalizeTimerRun(
  categoryId: string,
  state: TimerState,
) {
  const { supabase, user } = await requireUser();

  if (
    state.status !== "finished" ||
    state.startedAt === null ||
    state.finishedAt === null
  ) {
    console.error("Invalid finished timer state received.");

    return {
      error: "Your run contains invalid timing data.",
      runId: null as string | null,
    };
  }

  if (
    !Number.isFinite(state.startedAt) ||
    !Number.isFinite(state.finishedAt) ||
    state.startedAt <= 0 ||
    state.finishedAt < state.startedAt
  ) {
    console.error("Invalid timer timestamps received.");

    return {
      error: "Your run contains invalid timing data.",
      runId: null as string | null,
    };
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("sections")
    .select("id")
    .eq("category_id", categoryId)
    .eq("user_id", user.id);

  if (sectionsError) {
    console.error("Failed to validate timer sections:", sectionsError);

    return {
      error: "Your run could not be saved. Please try again.",
      runId: null as string | null,
    };
  }

  if (state.progress.length !== sections.length) {
    console.error("Finished run does not contain all sections.");

    return {
      error: "Your run contains incomplete section data.",
      runId: null as string | null,
    };
  }

  const validSectionIds = new Set(
    sections.map((section) => section.id),
  );

  const seenSectionIds = new Set<string>();
  let previousTimeMs = 0;

  for (const entry of state.progress) {
    if (
      !validSectionIds.has(entry.sectionId) ||
      seenSectionIds.has(entry.sectionId) ||
      !Number.isFinite(entry.timeMs) ||
      entry.timeMs < previousTimeMs
    ) {
      console.error("Invalid timer progress received.");

      return {
        error: "Your run contains invalid split data.",
        runId: null as string | null,
      };
    }

    seenSectionIds.add(entry.sectionId);
    previousTimeMs = entry.timeMs;
  }

  const valid = isTimerValid(state);
  const segments = getTimerSegments(state);

  const { data: run, error: runError } = await supabase
    .from("runs")
    .insert({
      category_id: categoryId,
      user_id: user.id,
      started_at: new Date(state.startedAt).toISOString(),
      completed_at: new Date(state.finishedAt).toISOString(),
      is_valid: valid,
    })
    .select("id")
    .single();

  if (runError) {
    console.error("Failed to create finalized run:", runError);

    return {
      error: "Your run could not be saved. Please try again.",
      runId: null as string | null,
    };
  }

  const rows = segments
    .filter((segment) => segment.type === "split")
    .map((segment) => ({
      run_id: run.id,
      section_id: segment.sectionId,
      user_id: user.id,
      time_ms: segment.timeMs,
    }));

  if (rows.length > 0) {
    const { error: splitsError } = await supabase
      .from("run_splits")
      .insert(rows);

    if (splitsError) {
      console.error(
        "Failed to save finalized run splits:",
        splitsError,
      );

      return {
        error: "Your run could not be saved completely. Please try again.",
        runId: run.id,
      };
    }
  }

  revalidatePath(`/categories/${categoryId}`);
  revalidatePath(`/categories/${categoryId}/history`);
  revalidatePath(`/overlay/${categoryId}`);

  return {
    error: null as string | null,
    runId: run.id,
  };
}


export async function persistLiveRun(
  state: LiveRunState
)  {
  const { supabase, user } = await requireUser();

  const { data: sections, error: sectionsError } = await supabase
    .from("sections")
    .select("id")
    .eq("category_id", state.categoryId)
    .eq("user_id", user.id);

  if (sectionsError) {
    console.error("Failed to validate run sections:", sectionsError);

    return {
      error: "Your run could not be saved. Please try again.",
      runId: state.runId,
    };
  }

  const validSectionIds = new Set(
    sections.map((section) => section.id)
  );

  const splitsAreValid = state.splits.every(
    (split) =>
      split === null ||
      (
        validSectionIds.has(split.sectionId) &&
        Number.isFinite(split.timeMs) &&
        split.timeMs >= 0
      )
  );

  if (!splitsAreValid) {
    console.error("Invalid run split data received.");

    return {
      error: "Your run contains invalid split data.",
      runId: state.runId,
    };
  }

  const valid =
  isRunValid(state.splits, sections.length) &&
  state.status === "stopped";

if (
  !Number.isFinite(state.startedAt) ||
  state.startedAt <= 0
) {
  console.error("Invalid run start time received.");

  return {
    error: "Your run contains invalid timing data.",
    runId: state.runId,
  };
}

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
      .eq("category_id", state.categoryId)
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
    .eq("user_id", user.id)
    .eq("category_id", categoryId);

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

export async function deleteRun(
  runId: string,
  categoryId: string,
  _previousState: ActionState,
  _formData: FormData
  ): Promise<ActionState> {
    const { supabase, user } = await requireUser();

    const { error } = await supabase
      .from("runs")
      .delete()
      .eq("id", runId)
      .eq("user_id", user.id)
      .eq("category_id", categoryId);

    if (error) {
      console.error("Failed to delete run:", error);

      return {
        error: "We couldn't delete this run. Please try again.",
      };
    }

    revalidatePath(`/categories/${categoryId}/history`);
    revalidatePath(`/categories/${categoryId}`);

    return {
      error: null,
    };
}
