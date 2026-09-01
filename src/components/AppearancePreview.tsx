import { fontCss } from "@/lib/fonts";
import {
  type AppearanceSettings,
  getSemanticColor,
  getSplitBackgroundStyle,
  getTextStyle,
  getTimerBackgroundStyle,
  getTimerTextStyle,
} from "@/lib/appearance";

type Props = {
  appearance: AppearanceSettings;
};

const PREVIEW_SPLITS = [
  {
    name: "Hangar",
    delta: "-00:01.120",
    time: "00:20.500",
    tone: "ahead-gaining" as const,
  },
  {
    name: "TV Room",
    delta: "-00:00.600",
    time: "00:42.300",
    tone: "ahead-losing" as const,
  },
  {
    name: "Boss 1",
    delta: "+00:00.250",
    time: "01:05.120",
    tone: "behind-gaining" as const,
  },
  {
    name: "Final Section",
    delta: "-00:02.314",
    time: "01:23.456",
    tone: "best-segment" as const,
  },
];

export function AppearancePreview({
  appearance,
}: Props) {
  return (
    <div className="grid gap-3">
      <div>
        <h3 className="text-lg font-semibold">
          Appearance Preview
        </h3>

        <p className="mt-1 text-sm text-zinc-400">
          Preview your timer appearance before using it in OBS.
        </p>
      </div>

      <div
        className="overflow-hidden rounded-lg border border-zinc-700 p-3"
        style={{
          ...getTimerBackgroundStyle(appearance),
          fontFamily: fontCss(appearance.font_family),
          fontSize: `${Number(appearance.font_scale) * 16}px`,
        }}
      >
        <div className="grid grid-cols-[1fr_auto_auto] gap-4">
          <div className="col-span-2 min-w-0">
            <div
              className="truncate text-sm"
              style={getTextStyle(appearance, "primary")}
            >
              The First Descendant
            </div>

            <div
              className="truncate text-xl font-semibold"
              style={getTextStyle(appearance, "primary")}
            >
              Example Category
            </div>

            <div
              className="mt-1 text-sm"
              style={getTextStyle(appearance, "secondary")}
            >
              Compare To: Personal Best
            </div>
          </div>

          <div className="col-start-3 min-w-24 pr-2 text-right">
            <div
              className="text-xs uppercase tracking-wide"
              style={getTextStyle(appearance, "secondary")}
            >
              Section
            </div>

            <div
              className="text-lg tabular-nums"
              style={getTextStyle(appearance, "primary")}
            >
              00:18.336
            </div>

            <div
              className="mt-2 text-xs uppercase tracking-wide"
              style={getTextStyle(appearance, "secondary")}
            >
              Total
            </div>

            <div
              className="text-[2.2em] font-semibold tabular-nums leading-none"
              style={getTimerTextStyle(
                appearance,
                "ahead-gaining",
              )}
            >
              <span>1:23</span>
              <span className="text-[0.5em]">
                .456
              </span>
            </div>

            <div
              className="mt-2 text-xs uppercase tracking-wide"
              style={getTextStyle(appearance, "secondary")}
            >
              Delta
            </div>

            <div
              className="font-mono text-lg tabular-nums"
              style={getTextStyle(
                appearance,
                "ahead-gaining",
              )}
            >
              -00:02.314
            </div>

            <div
              className="mt-2 text-[0.7em]"
              style={getTextStyle(
                appearance,
                "secondary",
              )}
            >
              Running
            </div>
          </div>
        </div>

        <div
          className="mt-3 flex items-center gap-6 text-[0.85em]"
          style={getTextStyle(appearance, "primary")}
        >
          <div>
            <span
              style={getTextStyle(
                appearance,
                "secondary",
              )}
            >
              Sum of Best:
            </span>{" "}
            01:18.500
          </div>

          <div>
            <span
              style={getTextStyle(
                appearance,
                "secondary",
              )}
            >
              Personal Best:
            </span>{" "}
            01:25.770
          </div>
        </div>

        <div
          className="mt-3 grid grid-cols-[1fr_auto_auto] gap-4 border-b border-zinc-800 px-2 pb-1 text-xs uppercase tracking-wide"
          style={getTextStyle(appearance, "secondary")}
        >
          <div>Section</div>
          <div className="text-right">Delta</div>
          <div className="min-w-24 text-right">
            Time
          </div>
        </div>

        <ol className="mt-3 space-y-1">
          {PREVIEW_SPLITS.map((split, index) => (
            <li
              key={split.name}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded px-2 py-1"
              style={getSplitBackgroundStyle(
                appearance,
                index,
              )}
            >
              <span
                className="min-w-0 truncate"
                style={getTextStyle(
                  appearance,
                  "primary",
                )}
              >
                {index + 1}. {split.name}
              </span>

              <span
                className="min-w-24 text-right font-mono text-[0.85em] tabular-nums"
                style={{
                  color: getSemanticColor(
                    appearance,
                    split.tone,
                  ),
                }}
              >
                {split.delta}
              </span>

              <span
                className="min-w-24 text-right font-mono tabular-nums"
                style={{
                  color: getSemanticColor(
                    appearance,
                    split.tone,
                  ),
                }}
              >
                {split.time}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}