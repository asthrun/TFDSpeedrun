"use server";
import type { ActionState } from "@/lib/action-state";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createGameProfile(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();

  // Dit is een verwachte gebruikersfout.
  // Daarom retourneren we hem naar het formulier.
  if (!name) {
    return {
      error: "Please enter a name for your GameProfile.",
    };
  }

  if (!/[\p{L}\p{N}]/u.test(name)) {
    return {
      error: "The GameProfile name must contain at least one letter or number.",
    };
  }

  if (name.length > 50) {
    return {
      error: "The GameProfile name cannot be longer than 50 characters.",
    };
  }

  const { data, error } = await supabase
    .from("game_profiles")
    .insert({
      user_id: user.id,
      name,
    })
    .select("id")
    .single();

  if (error) {
    // Technische informatie bewaren we aan de serverkant.
    console.error("Failed to create GameProfile:", error);

    // De gebruiker krijgt een begrijpelijke, veilige melding.
    return {
      error: "We couldn't create your GameProfile. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  redirect(`/profiles/${data.id}`);
}

export async function renameGameProfile(
  profileId: string,
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return {
      error: "Please enter a name for your GameProfile.",
    };
  }

  if (!/[\p{L}\p{N}]/u.test(name)) {
    return {
      error: "The GameProfile name must contain at least one letter or number.",
    };
  }

  if (name.length > 50) {
    return {
      error: "The GameProfile name cannot be longer than 50 characters.",
    };
  }

  const { error } = await supabase
    .from("game_profiles")
    .update({ name })
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to rename GameProfile:", error);

    return {
      error: "We couldn't rename your GameProfile. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/profiles/${profileId}`);

  return {
    error: null,
  };
}

export async function deleteGameProfile(
  profileId: string,
  _previousState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("game_profiles")
    .delete()
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete GameProfile:", error);

    return {
      error: "We couldn't delete this GameProfile. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createCategory(
  profileId: string,
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const targetRaw = String(formData.get("target_time") ?? "").trim();
  
  if (!name) {
    return {
      error: "Please enter a name for the Category.",
    };
  }

  if (!/[\p{L}\p{N}]/u.test(name)) {
    return {
      error: "The Category name must contain at least one letter or number.",
    };
  }

  if (name.length > 50) {
    return {
      error: "The Category name cannot be longer than 50 characters.",
    };
  }

  
  let target_time_ms: number | null = null;

  if (targetRaw) {
    const { parseTimeInput } = await import("@/lib/format-time");

    target_time_ms = parseTimeInput(targetRaw);

    if (target_time_ms == null) {
      return {
        error: "Please enter the target time as mm:ss.SSS.",
      };
    }
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      game_profile_id: profileId,
      user_id: user.id,
      name,
      target_time_ms,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create Category:", error);

    return {
      error: "We couldn't create the Category. Please try again.",
    };
  }

  revalidatePath(`/profiles/${profileId}`);
  redirect(`/categories/${data.id}`);
}

export async function updateCategory(
  categoryId: string,
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const targetRaw = String(formData.get("target_time") ?? "").trim();
  const compareMode = String(
    formData.get("compare_mode") ?? ""
  ).trim();

  if (!name) {
    return {
      error: "Please enter a name for the Category.",
    };
  }

  if (!/[\p{L}\p{N}]/u.test(name)) {
    return {
      error: "The Category name must contain at least one letter or number.",
    };
  }

  if (name.length > 50) {
    return {
      error: "The Category name cannot be longer than 50 characters.",
    };
  }

  const validCompareModes = [
    "personal_best",
    "custom_target",
    "latest_run",
    "worst_run",
  ] as const;

  if (
    !validCompareModes.includes(
      compareMode as (typeof validCompareModes)[number]
    )
  ) {
    return {
      error: "Please select a valid comparison mode.",
    };
  }

  let target_time_ms: number | null = null;

  if (targetRaw) {
    const { parseTimeInput } = await import("@/lib/format-time");

    target_time_ms = parseTimeInput(targetRaw);

    if (target_time_ms == null) {
      return {
        error: "Please enter the target time as mm:ss.SSS.",
      };
    }
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      target_time_ms,
      compare_mode: compareMode as
        | "personal_best"
        | "custom_target"
        | "latest_run"
        | "worst_run",
    })
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update Category:", error);

    return {
      error: "We couldn't save the Category. Please try again.",
    };
  }

  revalidatePath(`/categories/${categoryId}`);
  revalidatePath(`/categories/${categoryId}/setup`);

  return {
    error: null,
  };
}

export async function updateCategoryCompareMode(
  categoryId: string,
  compareMode: string,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const validCompareModes = [
    "personal_best",
    "custom_target",
    "latest_run",
    "worst_run",
  ] as const;

  if (
    !validCompareModes.includes(
      compareMode as (typeof validCompareModes)[number]
    )
  ) {
    return {
      error: "Please select a valid comparison mode.",
    };
  }

  const { error } = await supabase
    .from("categories")
    .update({
      compare_mode: compareMode as
        | "personal_best"
        | "custom_target"
        | "latest_run"
        | "worst_run",
    })
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) {
    console.error(
      "Failed to update Category comparison mode:",
      error
    );

    return {
      error: "We couldn't change the comparison. Please try again.",
    };
  }

  revalidatePath(`/categories/${categoryId}`);
  revalidatePath(`/categories/${categoryId}/setup`);
  revalidatePath(`/categories/${categoryId}/overlay`);

  return {
    error: null,
  };
}

export async function updateCustomTarget(
  categoryId: string,
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  /*
   * Load the Sections from the database instead of trusting
   * Section IDs sent by the browser.
   */
  const { data: sections, error: sectionsError } = await supabase
    .from("sections")
    .select("id, sort_order")
    .eq("category_id", categoryId)
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  if (sectionsError) {
    console.error(
      "Failed to load Sections for Custom Target:",
      sectionsError
    );

    return {
      error: "We couldn't save your Custom Target. Please try again.",
    };
  }

  if (sections.length === 0) {
    return {
      error: "Add at least one Section before creating a Custom Target.",
    };
  }

  const { parseTimeInput } = await import("@/lib/format-time");

  const parsedTargets: {
    sectionId: string;
    timeMs: number | null;
  }[] = [];

  for (const section of sections) {
    const raw = String(
      formData.get(`target_${section.id}`) ?? ""
    ).trim();

    if (!raw) {
      parsedTargets.push({
        sectionId: section.id,
        timeMs: null,
      });

      continue;
    }

    const timeMs = parseTimeInput(raw);

    if (timeMs == null) {
      return {
        error: "Please enter Custom Target times as mm:ss.SSS.",
      };
    }

    parsedTargets.push({
      sectionId: section.id,
      timeMs,
    });
  }

  const filledTargets = parsedTargets.filter(
    (target) => target.timeMs != null
  );

  /*
   * No values means: remove the existing Custom Target.
   */
  if (filledTargets.length === 0) {
    const { error } = await supabase
      .from("custom_target_splits")
      .delete()
      .eq("category_id", categoryId)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Failed to remove Custom Target:",
        error
      );

      return {
        error: "We couldn't remove your Custom Target. Please try again.",
      };
    }

    revalidatePath(`/categories/${categoryId}`);
    revalidatePath(`/categories/${categoryId}/setup`);
    revalidatePath(`/categories/${categoryId}/overlay`);

    return {
      error: null,
    };
  }

  const lastTarget =
    parsedTargets[parsedTargets.length - 1];

  const hasFinishTime =
    lastTarget.timeMs != null;

  const hasAllSplits =
    filledTargets.length === parsedTargets.length;

  const hasFinishTimeOnly =
    filledTargets.length === 1 &&
    hasFinishTime;

  /*
   * The only valid Custom Target structures are:
   *
   * 1. Every Section has a cumulative target time.
   * 2. Only the final Section has a target time.
   */
  if (!hasAllSplits && !hasFinishTimeOnly) {
    return {
      error:
        "Enter a time for every Section, or enter only the final target time.",
    };
  }

  /*
   * Full Split targets must be strictly increasing because
   * the values represent cumulative times.
   */
  if (hasAllSplits) {
    let previousTimeMs = -1;

    for (const target of parsedTargets) {
      const timeMs = target.timeMs;

      if (timeMs == null) {
        return {
          error: "Every Section must have a target time.",
        };
      }

      if (timeMs <= previousTimeMs) {
        return {
          error:
            "Custom Target times must increase from one Section to the next.",
        };
      }

      previousTimeMs = timeMs;
    }
  }

  const rows = filledTargets.map((target) => ({
    category_id: categoryId,
    section_id: target.sectionId,
    user_id: user.id,
    time_ms: target.timeMs as number,
  }));

  /*
   * Replace the previous Custom Target.
   */
  const { error: deleteError } = await supabase
    .from("custom_target_splits")
    .delete()
    .eq("category_id", categoryId)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error(
      "Failed to clear previous Custom Target:",
      deleteError
    );

    return {
      error: "We couldn't save your Custom Target. Please try again.",
    };
  }

  const { error: insertError } = await supabase
    .from("custom_target_splits")
    .insert(rows);

  if (insertError) {
    console.error(
      "Failed to save Custom Target:",
      insertError
    );

    return {
      error: "We couldn't save your Custom Target. Please try again.",
    };
  }

  revalidatePath(`/categories/${categoryId}`);
  revalidatePath(`/categories/${categoryId}/setup`);
  revalidatePath(`/categories/${categoryId}/overlay`);

  return {
    error: null,
  };
}

export async function deleteCategory(
  categoryId: string,
  profileId: string,
  _previousState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .eq("game_profile_id", profileId);

  if (error) {
    console.error("Failed to delete Category:", error);

    return {
      error: "We couldn't delete this Category. Please try again.",
    };
  }

  revalidatePath(`/profiles/${profileId}`);
  redirect(`/profiles/${profileId}`);
}

export async function addSection(
  categoryId: string,
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return {
      error: "Please enter a Section name.",
    };
  }

  if (!/[\p{L}\p{N}]/u.test(name)) {
    return {
      error: "The Section name must contain at least one letter or number.",
    };
  }

  if (name.length > 50) {
    return {
      error: "The Section name cannot be longer than 50 characters.",
    };
  }

  const { data: existing, error: listError } = await supabase
    .from("sections")
    .select("sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (listError) {
    console.error("Failed to determine Section order:", listError);

    return {
      error: "We couldn't add the Section. Please try again.",
    };
  }

  const sort_order = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("sections").insert({
    category_id: categoryId,
    user_id: user.id,
    name,
    sort_order,
  });

  if (error) {
    console.error("Failed to add Section:", error);

    return {
      error: "We couldn't add the Section. Please try again.",
    };
  }

  revalidatePath(`/categories/${categoryId}`);
  revalidatePath(`/categories/${categoryId}/setup`);

  return {
    error: null,
  };
}

export async function renameSection(
  sectionId: string,
  categoryId: string,
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return {
      error: "Please enter a Section name.",
    };
  }

  if (!/[\p{L}\p{N}]/u.test(name)) {
    return {
      error: "The Section name must contain at least one letter or number.",
    };
  }

  if (name.length > 50) {
    return {
      error: "The Section name cannot be longer than 50 characters.",
    };
  }

 const { error } = await supabase
    .from("sections")
    .update({ name })
    .eq("id", sectionId)
    .eq("user_id", user.id)
    .eq("category_id", categoryId);

  if (error) {
    console.error("Failed to rename Section:", error);

    return {
      error: "We couldn't rename the Section. Please try again.",
    };
  }

  revalidatePath(`/categories/${categoryId}`);
  revalidatePath(`/categories/${categoryId}/setup`);

  return {
    error: null,
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
