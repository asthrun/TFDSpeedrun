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

export type EmailState = {
  error?: string;
  success?: string;
};

export async function changeEmail(
  _previousState: EmailState,
  formData: FormData
): Promise<EmailState> {
  const { supabase, user } = await requireUser();

  const rawEmail = formData.get("email");

  if (typeof rawEmail !== "string") {
    return {
      error: "Enter a valid email address.",
    };
  }

  const email = rawEmail.trim().toLowerCase();

  if (!email) {
    return {
      error: "Email address is required.",
    };
  }

  if (email.length > 254) {
    return {
      error: "Email address is too long.",
    };
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return {
      error: "Enter a valid email address.",
    };
  }

  if (user.email?.toLowerCase() === email) {
    return {
      error: "This is already your current email address.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    email,
  });

  if (error) {
    console.error("Failed to change email address:", error);

    return {
      error: "Unable to change your email address. Please try again.",
    };
  }

  revalidatePath("/account");

  return {
    success:
      "Email change requested. Check your email to confirm the new address.",
  };
}
