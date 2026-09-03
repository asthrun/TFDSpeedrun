import type { ReactNode } from "react";

type SettingSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SettingSection({
  title,
  description,
  children,
}: SettingSectionProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-zinc-400">
            {description}
          </p>
        )}
      </div>

      <div className="mt-5 divide-y divide-zinc-800">
        {children}
      </div>
    </section>
  );
}