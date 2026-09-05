"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const CURRENT_TERMS_VERSION = "1.0";

export type SignUpState = {
  error?: string;
  success?: string;
};

export async function signUp(
  _previousState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const rawUsername = formData.get("username");
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const rawConfirmPassword = formData.get("confirmPassword");
  const rawLegalAccepted = formData.get("legalAccepted");

  if (
    typeof rawUsername !== "string" ||
    typeof rawEmail !== "string" ||
    typeof rawPassword !== "string" ||
    typeof rawConfirmPassword !== "string"
  ) {
    return { error: "Enter all required fields." };
  }

  const username = rawUsername.trim();
  const email = rawEmail.trim().toLowerCase();

  if (username.length < 2) {
    return { error: "Username must be at least 2 characters." };
  }

  if (username.length > 50) {
    return { error: "Username must be 50 characters or fewer." };
  }

  if (!email || email.length > 254) {
    return { error: "Enter a valid email address." };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return { error: "Enter a valid email address." };
  }

  if (rawPassword.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (rawPassword !== rawConfirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (rawLegalAccepted !== "on") {
    return {
      error:
        "You must confirm that you are at least 16 years old and agree to the Terms of Service.",
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!url || !anonKey || !siteUrl) {
    console.error("Missing Supabase or site configuration during sign-up.");
    return {
      error: "Unable to create your account. Please try again.",
    };
  }

  const supabase = createSupabaseClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password: rawPassword,
    options: {
      data: {
        display_name: username,
        terms_version: CURRENT_TERMS_VERSION,
        age_confirmed: true,
        },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/email-confirmed`,
    },
  });

  if (signUpError || !data.user) {
    console.error("Sign-up failed:", signUpError);

    return {
      error: "Unable to create your account. Please try again.",
    };
  }

  return {
    success: "Check your email to confirm your account.",
  };
}