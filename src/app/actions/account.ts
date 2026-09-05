"use server";

import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    console.error(
      "Cannot change password because authenticated user has no email."
    );

    return {
      error: "Unable to verify your account. Please try again.",
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(
      "Missing Supabase public configuration during password change."
    );

    return {
      error: "Unable to change your password. Please try again.",
    };
  }

  /*
   * Verify the current password with a separate Supabase client.
   * This client does not persist or share the user's browser session.
   */
  const verificationClient = createSupabaseClient(
    url,
    anonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  const {
    data: verificationData,
    error: verificationError,
  } = await verificationClient.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (
    verificationError ||
    !verificationData.user ||
    verificationData.user.id !== user.id
  ) {
    console.error(
      "Password change verification failed:",
      verificationError
    );

    return {
      error: "Current password is incorrect.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Failed to change password:", error);

    return {
      error: "Unable to change your password. Please try again.",
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

export type DeleteAccountState = {
  error?: string;
};

export async function deleteAccount(
  _previousState: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> {
  const { supabase, user } = await requireUser();

  const rawConfirmation = formData.get("confirmation");
  const rawCurrentPassword = formData.get("currentPassword");

  if (
    typeof rawConfirmation !== "string" ||
    typeof rawCurrentPassword !== "string"
  ) {
    return {
      error: "Enter DELETE and your current password.",
    };
  }

  if (rawConfirmation !== "DELETE") {
    return {
      error: "Type DELETE exactly to confirm account deletion.",
    };
  }

  if (!rawCurrentPassword) {
    return {
      error: "Current password is required.",
    };
  }

  if (!user.email) {
    console.error(
      "Cannot delete account because authenticated user has no email:",
      user.id
    );

    return {
      error: "Unable to verify your account. Please try again.",
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(
      "Missing Supabase public configuration during account deletion."
    );

    return {
      error: "Unable to delete your account. Please try again.",
    };
  }

  /*
   * Use a completely separate client to verify the password.
   * This client does not share the authenticated browser session.
   */
  const verificationClient = createSupabaseClient(
    url,
    anonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  const {
    data: verificationData,
    error: verificationError,
  } = await verificationClient.auth.signInWithPassword({
    email: user.email,
    password: rawCurrentPassword,
  });

  if (
    verificationError ||
    !verificationData.user ||
    verificationData.user.id !== user.id
  ) {
    console.error(
      "Account deletion password verification failed:",
      verificationError
    );

    return {
      error: "Current password is incorrect.",
    };
  }

  /*
   * Clear the user's current authenticated session before
   * permanently removing the Auth user.
   *
   * If this fails, do not continue with deletion.
   */
  const { error: signOutError } =
    await supabase.auth.signOut();

  if (signOutError) {
    console.error(
      "Failed to sign out user before account deletion:",
      signOutError
    );

    return {
      error: "Unable to delete your account. Please try again.",
    };
  }

  /*
   * From this point onward, only the server-side admin client
   * is allowed to perform the destructive operation.
   *
   * The user ID comes exclusively from requireUser().
   * It is never accepted from FormData.
   */
  const admin = createAdminClient();

  const { error: deleteError } =
    await admin.auth.admin.deleteUser(user.id, false);

  if (deleteError) {
    console.error(
      "Failed to permanently delete account:",
      deleteError
    );

    /*
     * At this point the user has been signed out, but their
     * account still exists. They can sign in again.
     */
    return {
      error:
        "Unable to delete your account. Your account has not been deleted. Please sign in and try again.",
    };
  }

  redirect("/");
}
