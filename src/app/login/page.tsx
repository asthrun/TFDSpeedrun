import { AuthPanel } from "@/components/AuthPanel";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const ready = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!ready) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <h1 className="text-2xl font-semibold">Connect Supabase</h1>
        <p className="mt-3 text-zinc-300">
          Copy <code className="font-mono">.env.example</code> to{" "}
          <code className="font-mono">.env.local</code> and paste your project URL and anon key
          from Supabase → Project Settings → API. Then run the SQL in{" "}
          <code className="font-mono">supabase/schema.sql</code>.
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      {params.error && (
        <p className="absolute top-6 text-sm text-red-400">Auth link failed. Try again.</p>
      )}
      <AuthPanel nextPath={params.next || "/dashboard"} />
    </main>
  );
}
