"use server";

import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type UsernameState = {
  error?: string;
  success?: string;
};

export async function changeUsername(
  _previousState: UsernameState,
  formData: FormData
): Promise<UsernameState> {
  const { supabase, user } = await requireUser();

  const rawUsername = formData.get("username");

  if (typeof rawUsername !== "string") {
    return { error: "Enter a valid username." };
  }

  const username = rawUsername.trim();

  if (username.length < 2) {
    return {
      error: "Username must be at least 2 characters.",
    };
  }

  if (username.length > 50) {
    return {
      error: "Username cannot be longer than 50 characters.",
    };
  }

  const { error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: user.id,
        display_name: username,
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) {
    console.error("Failed to change username:", error);

    return {
      error: "Unable to change your username. Please try again.",
    };
  }

  revalidatePath("/account");
  revalidatePath("/", "layout");

  return {
    success: "Username updated.",
  };
}
