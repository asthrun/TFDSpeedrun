"use server";

import { requireUser } from "@/lib/auth";
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

export async function saveIncompleteTimerRun(
  categoryId: string,
  state: TimerState,
) {
  const { supabase, user } =
    await requireUser();

  if (
    state.startedAt === null ||
    state.status === "idle"
  ) {
    console.error(
      "Invalid incomplete timer state received.",
    );

    return {
      error:
        "Your incomplete run contains invalid timing data.",
      runId: null as string | null,
    };
  }

  if (
    !Number.isFinite(state.startedAt) ||
    state.startedAt <= 0
  ) {
    console.error(
      "Invalid incomplete timer timestamp received.",
    );

    return {
      error:
        "Your incomplete run contains invalid timing data.",
      runId: null as string | null,
    };
  }

  const { data: sections, error: sectionsError } =
    await supabase
      .from("sections")
      .select("id")
      .eq("category_id", categoryId)
      .eq("user_id", user.id);

  if (sectionsError) {
    console.error(
      "Failed to validate incomplete timer sections:",
      sectionsError,
    );

    return {
      error:
        "Your incomplete run could not be saved. Please try again.",
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
      console.error(
        "Invalid incomplete timer progress received.",
      );

      return {
        error:
          "Your incomplete run contains invalid split data.",
        runId: null as string | null,
      };
    }

    seenSectionIds.add(entry.sectionId);
    previousTimeMs = entry.timeMs;
  }

  const segments = getTimerSegments(state);

  const completedAt = Date.now();

  const { data: run, error: runError } =
    await supabase
      .from("runs")
      .insert({
        category_id: categoryId,
        user_id: user.id,
        started_at: new Date(
          state.startedAt,
        ).toISOString(),
        completed_at: new Date(
          completedAt,
        ).toISOString(),
        is_valid: false,
      })
      .select("id")
      .single();

  if (runError) {
    console.error(
      "Failed to create incomplete run:",
      runError,
    );

    return {
      error:
        "Your incomplete run could not be saved. Please try again.",
      runId: null as string | null,
    };
  }

  const rows = segments
    .filter(
      (segment) => segment.type === "split",
    )
    .map((segment) => ({
      run_id: run.id,
      section_id: segment.sectionId,
      user_id: user.id,
      time_ms: segment.timeMs,
    }));

  if (rows.length > 0) {
    const { error: splitsError } =
      await supabase
        .from("run_splits")
        .insert(rows);

    if (splitsError) {
      console.error(
        "Failed to save incomplete run splits:",
        splitsError,
      );

      return {
        error:
          "Your incomplete run could not be saved completely. Please try again.",
        runId: run.id,
      };
    }
  }

  revalidatePath(
    `/categories/${categoryId}`,
  );
  revalidatePath(
    `/categories/${categoryId}/history`,
  );
  revalidatePath(
    `/overlay/${categoryId}`,
  );

  return {
    error: null as string | null,
    runId: run.id,
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
