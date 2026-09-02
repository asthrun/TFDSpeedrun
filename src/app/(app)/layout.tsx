import { AppNav } from "@/components/AppNav";
import { getSettings, requireUser } from "@/lib/auth";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await requireUser();
  const settings = await getSettings();

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load user profile:", profileError);
    throw new Error("Failed to load user profile.");
  }

  const username = profile?.display_name?.trim() || "User";

  return (
    <div className="flex min-h-full flex-col">
      <AppNav
        username={username}
        privacyMode={settings.privacy_mode}
      />

      <div className="flex-1">{children}</div>
    </div>
  );
}
