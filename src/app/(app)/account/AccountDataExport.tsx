"use client";

import { useState } from "react";
import { exportCsv } from "@/app/actions/export";

export function AccountDataExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsExporting(true);
    setError(null);

    try {
      const result = await exportCsv();

      if (result.error || !result.csv) {
        setError(
          result.error ??
            "We couldn't export your data. Please try again."
        );
        return;
      }

      const blob = new Blob([result.csv], {
        type: "text/csv;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const date = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `tfdspeedrun-runs-${date}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (unexpectedError) {
      console.error("Unexpected CSV export error:", unexpectedError);

      setError(
        "We couldn't export your data. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-zinc-400">
        Before deleting your account, you can download a copy of
        your complete run history.
      </p>

      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="mt-3 rounded-md border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isExporting
          ? "Preparing CSV..."
          : "Download Run History CSV"}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}