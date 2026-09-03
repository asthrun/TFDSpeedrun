"use client";

import { useRef } from "react";

type Props = {
  name: string;
  defaultValue?: string | null;
  label: string;
};

function isModifierCode(code: string) {
  return [
    "ShiftLeft",
    "ShiftRight",
    "ControlLeft",
    "ControlRight",
    "AltLeft",
    "AltRight",
    "MetaLeft",
    "MetaRight",
  ].includes(code);
}

function buildShortcutValue(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.metaKey) {
    return null;
  }

  if (isModifierCode(event.code)) {
    return null;
  }

  const parts: string[] = [];

  if (event.ctrlKey) {
    parts.push("Ctrl");
  }

  if (event.altKey) {
    parts.push("Alt");
  }

  if (event.shiftKey) {
    parts.push("Shift");
  }

  parts.push(event.code);

  return parts.join("+");
}

function formatShortcutForDisplay(value: string) {
  return value
    .replace(/\bCtrl\b/g, "Ctrl")
    .replace(/\bAlt\b/g, "Alt")
    .replace(/\bShift\b/g, "Shift")
    .replace(/\bDigit([0-9])\b/g, "$1")
    .replace(/\bKey([A-Z])\b/g, "$1")
    .replace(/\bNumpad([0-9])\b/g, "Numpad $1");
}

export function ShortcutInput({
  name,
  defaultValue,
  label,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const initialValue = defaultValue ?? "";

  return (
    <label className="grid gap-1 text-sm">
      <span className="text-zinc-300">{label}</span>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          defaultValue={formatShortcutForDisplay(initialValue)}
          readOnly
          placeholder="None (click, then press a shortcut)"
          onKeyDown={(event) => {
            event.preventDefault();
            event.stopPropagation();

            if (
              event.key === "Backspace" ||
              event.key === "Delete" ||
              event.key === "Escape"
            ) {
              event.currentTarget.value = "";

              if (hiddenInputRef.current) {
                hiddenInputRef.current.value = "";
              }

              return;
            }

            const shortcut = buildShortcutValue(event);

            // Modifier-only keys and Windows/Meta shortcuts are ignored.
            if (!shortcut) {
              return;
            }

            event.currentTarget.value =
              formatShortcutForDisplay(shortcut);

            if (hiddenInputRef.current) {
              hiddenInputRef.current.value = shortcut;
            }
          }}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono"
        />

        <input
          ref={hiddenInputRef}
          type="hidden"
          name={name}
          defaultValue={initialValue}
        />

        <button
          type="button"
          className="rounded-lg border border-zinc-700 px-3 text-sm"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.value = "";
            }

            if (hiddenInputRef.current) {
              hiddenInputRef.current.value = "";
            }
          }}
        >
          Clear
        </button>
      </div>
    </label>
  );
}
