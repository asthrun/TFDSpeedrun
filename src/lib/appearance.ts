import type { UserSettings } from "@/lib/database.types";
import type { CSSProperties } from "react";

export type TimerBackgroundMode =
  | "transparent"
  | "solid";

export type SplitsBackgroundMode =
  | "transparent"
  | "solid"
  | "alternating";

export type AppearanceSettings = Pick<
  UserSettings,
  | "font_family"
  | "font_scale"
  | "text_shadow"
  | "primary_text_color"
  | "secondary_text_color"
  | "ahead_gaining_color"
  | "ahead_losing_color"
  | "behind_gaining_color"
  | "behind_losing_color"
  | "best_segment_color"
  | "paused_color"
  | "timer_background_mode"
  | "timer_background_color"
  | "timer_background_opacity"
  | "splits_background_mode"
  | "splits_background_color_1"
  | "splits_background_color_2"
  | "splits_background_opacity"
  | "chroma_key_enabled"
  | "chroma_key_color"
>;

export type SemanticTone =
  | "primary"
  | "secondary"
  | "ahead-gaining"
  | "ahead-losing"
  | "behind-gaining"
  | "behind-losing"
  | "best-segment"
  | "paused";

export function getComparisonTone(
  position: "ahead" | "behind" | "even" | null,
  trend: "gaining" | "losing" | "even" | null,
  isBestSegment = false,
): SemanticTone {
  if (isBestSegment) {
    return "best-segment";
  }

  if (position === "ahead") {
    if (trend === "gaining") {
      return "ahead-gaining";
    }

    return "ahead-losing";
  }

  if (position === "behind") {
    if (trend === "losing") {
      return "behind-losing";
    }

    return "behind-gaining";
  }

  return "primary";
}

export function getSemanticColor(
  appearance: AppearanceSettings,
  tone: SemanticTone,
): string {
  switch (tone) {
    case "primary":
      return appearance.primary_text_color;

    case "secondary":
      return appearance.secondary_text_color;

    case "ahead-gaining":
      return appearance.ahead_gaining_color;

    case "ahead-losing":
      return appearance.ahead_losing_color;

    case "behind-gaining":
      return appearance.behind_gaining_color;

    case "behind-losing":
      return appearance.behind_losing_color;

    case "best-segment":
      return appearance.best_segment_color;

    case "paused":
      return appearance.paused_color;
  }
}

export function clampOpacity(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function withOpacity(
  hexColor: string,
  opacity: number,
): string {
  const normalizedOpacity = clampOpacity(opacity);

  const hex = hexColor.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `rgba(0, 0, 0, ${normalizedOpacity})`;
  }

  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${normalizedOpacity})`;
}

export function getTimerBackgroundStyle(
  appearance: AppearanceSettings,
): CSSProperties {
  if (appearance.chroma_key_enabled) {
    return {
      backgroundColor: appearance.chroma_key_color,
    };
  }

  if (appearance.timer_background_mode === "transparent") {
    return {
      backgroundColor: "transparent",
    };
  }

  return {
    backgroundColor: withOpacity(
      appearance.timer_background_color,
      appearance.timer_background_opacity,
    ),
  };
}

export function getSplitBackgroundStyle(
  appearance: AppearanceSettings,
  rowIndex: number,
): CSSProperties {
  if (appearance.splits_background_mode === "transparent") {
    return {
      backgroundColor: "transparent",
    };
  }

  const color =
    appearance.splits_background_mode === "alternating" &&
    rowIndex % 2 === 1
      ? appearance.splits_background_color_2
      : appearance.splits_background_color_1;

  return {
    backgroundColor: withOpacity(
      color,
      appearance.splits_background_opacity,
    ),
  };
}

export function getTextStyle(
  appearance: AppearanceSettings,
  tone: SemanticTone = "primary",
): CSSProperties {
  return {
    color: getSemanticColor(appearance, tone),
    fontFamily: appearance.font_family,
    fontSize: `${appearance.font_scale}em`,
    textShadow: appearance.text_shadow
      ? "0 1px 2px rgba(0, 0, 0, 0.8)"
      : "none",
  };
}

export function getTimerTextStyle(
  appearance: AppearanceSettings,
  tone: SemanticTone = "primary",
): CSSProperties {
  const color = getSemanticColor(appearance, tone);

  return {
    backgroundImage: `linear-gradient(
      to bottom,
      color-mix(in srgb, ${color} 70%, white 30%),
      ${color} 55%,
      color-mix(in srgb, ${color} 75%, black 25%)
    )`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: color,
    WebkitTextFillColor: "transparent",
    textShadow: appearance.text_shadow
      ? "0 1px 3px rgba(0, 0, 0, 0.9)"
      : "none",
  };
}