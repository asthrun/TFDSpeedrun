"use client";

import { useState, useTransition } from "react";
import { exportCsv } from "@/app/actions/export";

export function RunDataExport() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleExport() {
    startTransition(async () => {
      const result = await exportCsv();

      if (result.error || !result.csv) {
        setMessage({
          type: "error",
          text: result.error ?? "Export failed.",
        });

        return;
      }

      const blob = new Blob([result.csv], {
        type: "text/csv",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = "tfd-speedrun-export.csv";
      a.click();

      URL.revokeObjectURL(url);

      setMessage({
        type: "success",
        text: "CSV downloaded.",
      });
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={handleExport}
        className="
          rounded-lg border border-zinc-700
          px-4 py-2 text-sm text-zinc-200
          transition-colors
          hover:border-zinc-500
          hover:bg-zinc-900
          focus:outline-none
          focus:ring-2
          focus:ring-zinc-700
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {pending ? "Exporting..." : "Export all run data"}
      </button>

      {message && (
        <p
          role={message.type === "error" ? "alert" : undefined}
          className={
            message.type === "error"
              ? "text-xs text-red-400"
              : "text-xs text-emerald-400"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}