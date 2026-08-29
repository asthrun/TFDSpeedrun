"use client";

import { useState, useTransition } from "react";
import { updateSettings, updateShortcuts } from "@/app/actions/settings";
import { exportCsv } from "@/app/actions/export";
import { ShortcutInput } from "@/components/ShortcutInput";
import { FONT_OPTIONS } from "@/lib/fonts";
import type { UserSettings } from "@/lib/database.types";

export function SettingsForm({ settings }: { settings: UserSettings }) {
  const [chroma, setChroma] = useState(settings.chroma_hex);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [pending, startTransition] = useTransition();

  async function saveSetting(
    patch: Partial<UserSettings>,
    successMessage: string
  ) {
    try {
      const result = await updateSettings(patch);

      if (result.error) {
        setMessage({
          type: "error",
          text: result.error,
        });
        return false;
      }

      setMessage({
        type: "success",
        text: successMessage,
      });

      return true;
    } catch (error) {
      console.error("Unexpected error while saving settings:", error);

      setMessage({
        type: "error",
        text: "We couldn't save your settings. Please try again.",
      });

      return false;
    }
  }

  return (
    <div className="grid gap-8">
      <section>
        <h2 className="text-lg font-medium">Appearance / OBS</h2>
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1 text-sm">
            Chromakey color
            <div className="flex gap-2">
              <input
                type="color"
                value={chroma}
                onChange={(e) => setChroma(e.target.value)}
              />
              <input
                value={chroma}
                onChange={(e) => setChroma(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono"
              />
              <button
                type="button"
                className="rounded-lg bg-zinc-100 px-3 text-sm font-medium text-zinc-950"
                onClick={() =>
                  startTransition(async () => {
                    await saveSetting(
                      { chroma_hex: chroma },
                      "Chromakey saved."
                    );
                  })
                }
              >
                Save
              </button>
            </div>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              defaultChecked={settings.transparent_background}
              onChange={(e) => {
                const checked = e.target.checked;

                startTransition(async () => {
                  await saveSetting(
                    { transparent_background: checked },
                    "Transparent background saved."
                  );
                });
              }}
            />
            Transparent background (OBS Browser Source)
          </label>
          <label className="grid gap-1 text-sm">
            Font
            <select
              defaultValue={settings.font_family}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
              onChange={(e) => {
                const value = e.target.value;

                startTransition(async () => {
                  await saveSetting(
                    { font_family: value },
                    "Font saved."
                  );
                });
              }}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Font size scale ({Number(settings.font_scale)})
            <input
              type="range"
              min="0.75"
              max="2.5"
              step="0.05"
              defaultValue={Number(settings.font_scale)}
              onMouseUp={(e) => {
                const value = Number(
                  (e.target as HTMLInputElement).value
                );

                startTransition(async () => {
                  await saveSetting(
                    { font_scale: value },
                    "Font size saved."
                  );
                });
              }}
            />
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Keyboard shortcuts</h2>
        <p className="text-sm text-zinc-400">Empty by default. Click a field, then press a key. Clear is allowed.</p>
        <form
          action={async (formData) => {
            try {
              const result = await updateShortcuts(formData);

              if (result.error) {
                setMessage({
                  type: "error",
                  text: result.error,
                });
                return;
              }

              setMessage({
                type: "success",
                text: "Shortcuts saved.",
              });
            } catch (error) {
              console.error(
                "Unexpected error while saving shortcuts:",
                error
              );

              setMessage({
                type: "error",
                text: "We couldn't save your keyboard shortcuts. Please try again.",
              });
            }
          }}
          className="mt-3 grid gap-3"
        >
          <ShortcutInput name="shortcut_start" label="Start" defaultValue={settings.shortcut_start} />
          <ShortcutInput name="shortcut_stop" label="Stop" defaultValue={settings.shortcut_stop} />
          <ShortcutInput name="shortcut_split" label="Split" defaultValue={settings.shortcut_split} />
          <ShortcutInput name="shortcut_reset" label="Reset" defaultValue={settings.shortcut_reset} />
          <ShortcutInput name="shortcut_undo" label="Undo" defaultValue={settings.shortcut_undo} />
          <ShortcutInput
            name="shortcut_next_section"
            label="Next section (missed split)"
            defaultValue={settings.shortcut_next_section}
          />
          <button type="submit" className="w-fit rounded-lg bg-zinc-100 px-4 py-2 font-medium text-zinc-950">
            Save shortcuts
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium">Export</h2>
        <button
          type="button"
          disabled={pending}
          className="mt-3 rounded-lg border border-zinc-700 px-4 py-2 text-sm"
          onClick={() =>
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
            })
          }
          >
            Download all splits as CSV
        </button>
      </section>
      {message && (
        <p
          role={message.type === "error" ? "alert" : undefined}
          className={
            message.type === "error"
              ? "text-sm text-red-400"
              : "text-sm text-emerald-400"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
