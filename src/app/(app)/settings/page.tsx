import { getSettings } from "@/lib/auth";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Appearance is used on the OBS overlay. Log in once inside the OBS Browser Source so the
        overlay can load your account.
      </p>
      <div className="mt-6">
        <SettingsForm settings={settings} />
      </div>
    </main>
  );
}
