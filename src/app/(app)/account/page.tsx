import { getSettings, requireUser } from "@/lib/auth";
import { ChangeUsernameForm } from "./ChangeUsernameForm";
import { ChangeEmailForm } from "./ChangeEmailForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { AccountDataExport } from "./AccountDataExport";

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!domain) {
    return "Hidden";
  }

  const firstCharacter = localPart.charAt(0);

  return `${firstCharacter}•••••@${domain}`;
}

export default async function AccountPage() {
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
  const email = user.email ?? "No email address available";

  const displayedUsername = settings.privacy_mode
    ? "Hidden"
    : username;

  const displayedEmail = settings.privacy_mode
    ? maskEmail(email)
    : email;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your profile, email address, security, and account.
        </p>
      </div>

      <section className="rounded-lg border border-zinc-800 p-5">
        <h2 className="text-lg font-semibold">Profile</h2>

        <div className="mt-4">
          <p className="text-sm text-zinc-400">Username</p>
          <p className="mt-1">{displayedUsername}</p>
        </div>

        <ChangeUsernameForm currentUsername={username} />
      </section>

      <section className="rounded-lg border border-zinc-800 p-5">
        <h2 className="text-lg font-semibold">Email</h2>

        <div className="mt-4">
          <p className="text-sm text-zinc-400">Email address</p>
          <p className="mt-1">{displayedEmail}</p>
        </div>

        <ChangeEmailForm
          currentEmail={
            settings.privacy_mode
              ? ""
              : email
          }
        />
      </section>

      <section className="rounded-lg border border-zinc-800 p-5">
        <h2 className="text-lg font-semibold">Security</h2>

        <p className="mt-2 text-sm text-zinc-400">
          Manage the password used to sign in to your account.
        </p>

        <ChangePasswordForm />
      </section>

      <section className="rounded-lg border border-red-900/60 p-5">
        <h2 className="text-lg font-semibold text-red-400">
          Danger Zone
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Permanently delete your account and its associated data.
        </p>

        <AccountDataExport />
          Delete Account
      </section>
    </main>
  );
}
