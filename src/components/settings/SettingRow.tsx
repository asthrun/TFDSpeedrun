import type { ReactNode } from "react";

type SettingRowProps = {
  label: string;
  description?: string;
  children: ReactNode;
};

export function SettingRow({
  label,
  description,
  children,
}: SettingRowProps) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-medium text-zinc-200">
          {label}
        </div>

        {description && (
          <p className="mt-1 max-w-xl text-xs text-zinc-500">
            {description}
          </p>
        )}
      </div>

      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}