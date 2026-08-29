import { AppNav } from "@/components/AppNav";
import { requireUser } from "@/lib/auth";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser();
  return (
    <div className="flex min-h-full flex-col">
      <AppNav email={user.email ?? user.id} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
