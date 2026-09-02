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

export type PasswordState = {
  error?: string;
  success?: string;
};

export async function changePassword(
  _previousState: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const { supabase } = await requireUser();

  const rawCurrentPassword = formData.get("currentPassword");
  const rawNewPassword = formData.get("newPassword");
  const rawConfirmPassword = formData.get("confirmPassword");

  if (
    typeof rawCurrentPassword !== "string" ||
    typeof rawNewPassword !== "string" ||
    typeof rawConfirmPassword !== "string"
  ) {
    return {
      error: "Enter all password fields.",
    };
  }

  const currentPassword = rawCurrentPassword;
  const newPassword = rawNewPassword;
  const confirmPassword = rawConfirmPassword;

  if (!currentPassword) {
    return {
      error: "Current password is required.",
    };
  }

  if (newPassword.length < 8) {
    return {
      error: "New password must be at least 8 characters.",
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      error: "New passwords do not match.",
    };
  }

  if (newPassword === currentPassword) {
    return {
      error: "Your new password must be different from your current password.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    current_password: currentPassword,
    password: newPassword,
  });

  if (error) {
    console.error("Failed to change password:", error);

    return {
      error:
        "Unable to change your password. Check your current password and try again.",
    };
  }

  return {
    success: "Password changed successfully.",
  };
}

export type ReauthenticationState = {
  error?: string;
  success?: string;
};

export async function requestPasswordReauthentication(): Promise<ReauthenticationState> {
  const { supabase } = await requireUser();

  const { error } = await supabase.auth.reauthenticate();

  if (error) {
    console.error("Failed to request password reauthentication:", error);

    return {
      error:
        "Unable to send a verification code. Please try again.",
    };
  }

  return {
    success:
      "A verification code has been sent to your email address.",
  };
}

export async function changePasswordWithNonce(
  _previousState: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const { supabase } = await requireUser();

  const rawNewPassword = formData.get("newPassword");
  const rawConfirmPassword = formData.get("confirmPassword");
  const rawNonce = formData.get("nonce");

  if (
    typeof rawNewPassword !== "string" ||
    typeof rawConfirmPassword !== "string" ||
    typeof rawNonce !== "string"
  ) {
    return {
      error: "Enter all required fields.",
    };
  }

  const newPassword = rawNewPassword;
  const confirmPassword = rawConfirmPassword;
  const nonce = rawNonce.trim();

  if (!nonce) {
    return {
      error: "Verification code is required.",
    };
  }

  if (newPassword.length < 8) {
    return {
      error: "New password must be at least 8 characters.",
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      error: "New passwords do not match.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
    nonce,
  });

  if (error) {
    console.error(
      "Failed to change password after reauthentication:",
      error
    );

    return {
      error:
        "Unable to change your password. Check the verification code and try again.",
    };
  }

  return {
    success: "Password changed successfully.",
  };
}