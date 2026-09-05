"use client";

import { useState } from "react";
import { exportAccountData } from "@/app/actions/export";

export function AccountDataExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsExporting(true);
    setError(null);

    try {
      const result = await exportAccountData();

      if (result.error || !result.json) {
        setError(
          result.error ??
            "We couldn't export your account data. Please try again."
        );
        return;
      }

      const blob = new Blob([result.json], {
        type: "application/json;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const date = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `tfdspeedrun-account-data-${date}.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (unexpectedError) {
      console.error(
        "Unexpected account data export error:",
        unexpectedError
      );

      setError(
        "We couldn't export your account data. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-zinc-400">
        Download a copy of your TFDSpeedrun account data, including your
        profile, settings, game profiles, categories, sections, custom
        targets, runs, and splits.
      </p>

      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="mt-3 rounded-md border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isExporting
          ? "Preparing JSON..."
          : "Download Account Data"}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}