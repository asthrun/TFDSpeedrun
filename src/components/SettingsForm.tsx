"use client";

import { useState, useTransition } from "react";
import { updateSettings, updateShortcuts } from "@/app/actions/settings";
import { exportCsv } from "@/app/actions/export";
import { ShortcutInput } from "@/components/ShortcutInput";
import { FONT_OPTIONS } from "@/lib/fonts";
import type { UserSettings } from "@/lib/database.types";

export function SettingsForm({ settings }: { settings: UserSettings }) {
  
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);


  const [timerBackgroundMode, setTimerBackgroundMode] = useState(
      settings.timer_background_mode
    );

    const [timerBackgroundColor, setTimerBackgroundColor] = useState(
      settings.timer_background_color
    );

    const [timerBackgroundOpacity, setTimerBackgroundOpacity] = useState(
      Number(settings.timer_background_opacity)
    );

  const [pending, startTransition] = useTransition();

  const [splitsBackgroundMode, setSplitsBackgroundMode] = useState(
  settings.splits_background_mode
    );

    const [splitsBackgroundColor1, setSplitsBackgroundColor1] = useState(
      settings.splits_background_color_1
    );

    const [splitsBackgroundColor2, setSplitsBackgroundColor2] = useState(
      settings.splits_background_color_2
    );

    const [splitsBackgroundOpacity, setSplitsBackgroundOpacity] = useState(
      Number(settings.splits_background_opacity)
    );

    const [primaryTextColor, setPrimaryTextColor] = useState(
      settings.primary_text_color
    );

    const [secondaryTextColor, setSecondaryTextColor] = useState(
      settings.secondary_text_color
    );

    const [aheadGainingColor, setAheadGainingColor] = useState(
      settings.ahead_gaining_color
    );

    const [aheadLosingColor, setAheadLosingColor] = useState(
      settings.ahead_losing_color
    );

    const [behindGainingColor, setBehindGainingColor] = useState(
      settings.behind_gaining_color
    );

    const [behindLosingColor, setBehindLosingColor] = useState(
      settings.behind_losing_color
    );

    const [bestSegmentColor, setBestSegmentColor] = useState(
      settings.best_segment_color
    );

    const [pausedColor, setPausedColor] = useState(
      settings.paused_color
    );

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
          <h2 className="text-lg font-medium">
            Timer Layout
          </h2>

          <p className="mt-1 text-sm text-zinc-400">
            Choose how much information is visible in the timer.
          </p>

          <div className="mt-3 grid gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                defaultChecked={settings.show_game_profile}
                disabled={pending}
                onChange={(e) => {
                  const checked = e.target.checked;

                  startTransition(async () => {
                    await saveSetting(
                      { show_game_profile: checked },
                      "Game Profile visibility saved.",
                    );
                  });
                }}
              />

              Show Game Profile
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                defaultChecked={settings.show_category}
                disabled={pending}
                onChange={(e) => {
                  const checked = e.target.checked;

                  startTransition(async () => {
                    await saveSetting(
                      { show_category: checked },
                      "Category visibility saved.",
                    );
                  });
                }}
              />

              Show Category
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                defaultChecked={settings.show_compare_to}
                disabled={pending}
                onChange={(e) => {
                  const checked = e.target.checked;

                  startTransition(async () => {
                    await saveSetting(
                      { show_compare_to: checked },
                      "Compare To visibility saved.",
                    );
                  });
                }}
              />

              Show Compare To
            </label>
            <label className="grid gap-1 text-sm">
              Visible splits

              <select
                defaultValue={
                  settings.visible_split_count === null
                    ? "all"
                    : String(
                        settings.visible_split_count,
                      )
                }
                disabled={pending}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
                onChange={(e) => {
                  const value =
                    e.target.value === "all"
                      ? null
                      : Number(e.target.value);

                  startTransition(async () => {
                    await saveSetting(
                      {
                        visible_split_count: value,
                      },
                      "Visible splits saved.",
                    );
                  });
                }}
              >
                <option value="all">All</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
              </select>

              <span className="text-xs text-zinc-500">
                All shows every section. A number keeps the
                current section inside a scrolling window.
              </span>
            </label>
          </div>
        </section>
      <section>
        <h2 className="text-lg font-medium">Appearance / OBS</h2>
        
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold">
            Timer Background
          </h3>

          <label className="grid gap-1 text-sm">
            Background mode

            <select
              value={timerBackgroundMode}
              onChange={(e) => {
                const value = e.target.value;

                if (
                  value !== "transparent" &&
                  value !== "solid"
                ) {
                  return;
                }

                setTimerBackgroundMode(value);

                startTransition(async () => {
                  await saveSetting(
                    { timer_background_mode: value },
                    "Timer background saved."
                  );
                });

                
              }}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            >
              <option value="transparent">
                Transparent
              </option>

              <option value="solid">
                Solid color
              </option>
            </select>
          </label>

          {timerBackgroundMode === "solid" && (
            <>
              <label className="grid gap-1 text-sm">
                Background color

                <input
                  type="color"
                  value={timerBackgroundColor}
                  onChange={(e) =>
                    setTimerBackgroundColor(e.target.value)
                  }
                />
              </label>

              <button
                type="button"
                className="w-fit rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950"
                onClick={() =>
                  startTransition(async () => {
                    await saveSetting(
                      {
                        timer_background_color:
                          timerBackgroundColor,
                      },
                      "Timer background color saved."
                    );
                  })
                }
              >
                Save color
              </button>

              <label className="grid gap-1 text-sm">
                Opacity:{" "}
                {Math.round(timerBackgroundOpacity * 100)}%

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={timerBackgroundOpacity}
                  onChange={(e) =>
                    setTimerBackgroundOpacity(
                      Number(e.target.value)
                    )
                  }
                  onMouseUp={() =>
                    startTransition(async () => {
                      await saveSetting(
                        {
                          timer_background_opacity:
                            timerBackgroundOpacity,
                        },
                        "Timer background opacity saved."
                      );
                    })
                  }
                />
              </label>
            </>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              defaultChecked={settings.text_shadow}
              onChange={(e) => {
                const checked = e.target.checked;

                startTransition(async () => {
                  await saveSetting(
                    { text_shadow: checked },
                    "Text shadow saved."
                  );
                });
              }}
            />

            Text shadow
          </label>
        </div>

        <div className="mt-6 grid gap-4">
          <h3 className="text-lg font-semibold">
            Split Background
          </h3>

          <label className="grid gap-1 text-sm">
            Background mode

            <select
              value={splitsBackgroundMode}
              disabled={pending}
              onChange={(e) => {
                const value = e.target.value;

                if (
                  value !== "transparent" &&
                  value !== "solid" &&
                  value !== "alternating"
                ) {
                  return;
                }

                setSplitsBackgroundMode(value);

                startTransition(async () => {
                  await saveSetting(
                    { splits_background_mode: value },
                    "Split background saved."
                  );
                });
              }}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            >
              <option value="transparent">
                Transparent
              </option>

              <option value="solid">
                Solid color
              </option>

              <option value="alternating">
                Alternating colors
              </option>
            </select>
          </label>

          {splitsBackgroundMode !== "transparent" && (
            <>
              <label className="grid gap-1 text-sm">
                Background color

                <input
                  type="color"
                  value={splitsBackgroundColor1}
                  disabled={pending}
                  onChange={(e) =>
                    setSplitsBackgroundColor1(e.target.value)
                  }
                />
              </label>

              <button
                type="button"
                disabled={pending}
                className="w-fit rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
                onClick={() =>
                  startTransition(async () => {
                    await saveSetting(
                      {
                        splits_background_color_1:
                          splitsBackgroundColor1,
                      },
                      "Split background color saved."
                    );
                  })
                }
              >
                Save color
              </button>
            </>
          )}

          {splitsBackgroundMode === "alternating" && (
            <>
              <label className="grid gap-1 text-sm">
                Alternating color

                <input
                  type="color"
                  value={splitsBackgroundColor2}
                  disabled={pending}
                  onChange={(e) =>
                    setSplitsBackgroundColor2(e.target.value)
                  }
                />
              </label>

              <button
                type="button"
                disabled={pending}
                className="w-fit rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
                onClick={() =>
                  startTransition(async () => {
                    await saveSetting(
                      {
                        splits_background_color_2:
                          splitsBackgroundColor2,
                      },
                      "Alternating split color saved."
                    );
                  })
                }
              >
                Save alternating color
              </button>
            </>
          )}

          {splitsBackgroundMode !== "transparent" && (
            <label className="grid gap-1 text-sm">
              Opacity:{" "}
              {Math.round(splitsBackgroundOpacity * 100)}%

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={splitsBackgroundOpacity}
                disabled={pending}
                onChange={(e) =>
                  setSplitsBackgroundOpacity(
                    Number(e.target.value)
                  )
                }
                onMouseUp={() =>
                  startTransition(async () => {
                    await saveSetting(
                      {
                        splits_background_opacity:
                          splitsBackgroundOpacity,
                      },
                      "Split background opacity saved."
                    );
                  })
                }
              />
            </label>
          )}
        </div>

        <div className="mt-6 grid gap-4">
          <div>
            <h3 className="text-lg font-semibold">
              Semantic Colors
            </h3>

            <p className="mt-1 text-sm text-zinc-400">
              Choose how timer states and comparisons are displayed.
            </p>
          </div>

          <ColorSetting
            label="Primary text"
            value={primaryTextColor}
            onChange={setPrimaryTextColor}
            disabled={pending}
            onSave={() =>
              saveSetting(
                { primary_text_color: primaryTextColor },
                "Primary text color saved."
              )
            }
          />

          <ColorSetting
            label="Secondary text"
            value={secondaryTextColor}
            onChange={setSecondaryTextColor}
            disabled={pending}
            onSave={() =>
              saveSetting(
                { secondary_text_color: secondaryTextColor },
                "Secondary text color saved."
              )
            }
          />

          <ColorSetting
            label="Ahead + Gaining"
            value={aheadGainingColor}
            onChange={setAheadGainingColor}
            disabled={pending}
            onSave={() =>
              saveSetting(
                { ahead_gaining_color: aheadGainingColor },
                "Ahead + Gaining color saved."
              )
            }
          />

          <ColorSetting
            label="Ahead + Losing"
            value={aheadLosingColor}
            onChange={setAheadLosingColor}
            disabled={pending}
            onSave={() =>
              saveSetting(
                { ahead_losing_color: aheadLosingColor },
                "Ahead + Losing color saved."
              )
            }
          />

          <ColorSetting
            label="Behind + Gaining"
            value={behindGainingColor}
            onChange={setBehindGainingColor}
            disabled={pending}
            onSave={() =>
              saveSetting(
                { behind_gaining_color: behindGainingColor },
                "Behind + Gaining color saved."
              )
            }
          />

          <ColorSetting
            label="Behind + Losing"
            value={behindLosingColor}
            onChange={setBehindLosingColor}
            disabled={pending}
            onSave={() =>
              saveSetting(
                { behind_losing_color: behindLosingColor },
                "Behind + Losing color saved."
              )
            }
          />

          <ColorSetting
            label="Best Segment"
            value={bestSegmentColor}
            onChange={setBestSegmentColor}
            disabled={pending}
            onSave={() =>
              saveSetting(
                { best_segment_color: bestSegmentColor },
                "Best Segment color saved."
              )
            }
          />

          <ColorSetting
            label="Paused"
            value={pausedColor}
            onChange={setPausedColor}
            disabled={pending}
            onSave={() =>
              saveSetting(
                { paused_color: pausedColor },
                "Paused color saved."
              )
            }
          />
        </div>

        <div className="mt-3 grid gap-3">       
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
              max="2"
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
        <h2 className="text-lg font-medium">
          Controls
        </h2>
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
          <ShortcutInput
            name="shortcut_start_split"
            label="Start / Split / Finish"
            defaultValue={
              settings.shortcut_start_split
            }
          />

          <ShortcutInput
            name="shortcut_pause"
            label="Pause / Resume"
            defaultValue={
              settings.shortcut_pause
            }
          />

          <ShortcutInput
            name="shortcut_undo"
            label="Undo Split"
            defaultValue={
              settings.shortcut_undo
            }
          />

          <ShortcutInput
            name="shortcut_skip"
            label="Skip Split"
            defaultValue={
              settings.shortcut_skip
            }
          />

          <ShortcutInput
            name="shortcut_reset"
            label="Reset"
            defaultValue={
              settings.shortcut_reset
            }
          />
          <button type="submit" className="w-fit rounded-lg bg-zinc-100 px-4 py-2 font-medium text-zinc-950">
            Save shortcuts
          </button>
        </form>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm">
            Double Tap Prevention

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="5000"
                step="1"
                defaultValue={
                  settings.double_tap_delay_ms
                }
                disabled={pending}
                className="w-32 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
                onBlur={(e) => {
                  const value = Number(
                    e.target.value
                  );

                  startTransition(async () => {
                    await saveSetting(
                      {
                        double_tap_delay_ms:
                          value,
                      },
                      "Double Tap Prevention saved.",
                    );
                  });
                }}
              />

              <span className="text-zinc-400">
                ms
              </span>
            </div>

            <span className="text-xs text-zinc-500">
              Prevents accidental repeated keyboard
              actions. Set to 0 to disable.
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              defaultChecked={
                settings.save_incomplete_runs
              }
              disabled={pending}
              onChange={(e) => {
                const checked = e.target.checked;

                startTransition(async () => {
                  await saveSetting(
                    {
                      save_incomplete_runs:
                        checked,
                    },
                    "Incomplete run preference saved.",
                  );
                });
              }}
            />

            <span>
              <span className="block">
                Save incomplete runs
              </span>

              <span className="block text-xs text-zinc-500">
                Keep incomplete or invalid attempts
                in History. They never count toward
                comparisons or statistics.
              </span>
            </span>
          </label>
        </div>

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

function ColorSetting({
  label,
  value,
  onChange,
  onSave,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => Promise<boolean>;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-2">
      <label className="grid gap-1 text-sm">
        {label}

        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value}
            disabled={disabled || pending}
            onChange={(e) => onChange(e.target.value)}
          />

          <span className="font-mono text-sm text-zinc-400">
            {value}
          </span>
        </div>
      </label>

      <button
        type="button"
        disabled={disabled || pending}
        className="w-fit rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
        onClick={() => {
          startTransition(async () => {
            await onSave();
          });
        }}
      >
        Save color
      </button>
    </div>
  );
}