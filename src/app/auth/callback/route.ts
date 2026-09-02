import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");

  // Only allow internal application paths.
  // This prevents the callback from being used as an open redirect.
  const next =
    requestedNext?.startsWith("/") &&
    !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";

  if (code) {
    const supabase = await createClient();

    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Email confirmation is verification only.
      // The user must explicitly log in afterwards.
      if (next === "/email-confirmed") {
        await supabase.auth.signOut();

        return NextResponse.redirect(
          new URL("/email-confirmed", origin)
        );
      }

      // Magic links and password recovery keep their session.
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=auth", origin)
  );
}