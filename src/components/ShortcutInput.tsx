"use client";

import { useRef } from "react";

type Props = {
  name: string;
  defaultValue?: string | null;
  label: string;
};

export function ShortcutInput({ name, defaultValue, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label className="grid gap-1 text-sm">
      <span className="text-zinc-300">{label}</span>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          name={name}
          defaultValue={defaultValue ?? ""}
          readOnly
          placeholder="None (click, then press a key)"
          onKeyDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (event.key === "Backspace" || event.key === "Delete" || event.key === "Escape") {
              event.currentTarget.value = "";
              return;
            }
            event.currentTarget.value = event.code;
          }}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono"
        />
        <button
          type="button"
          className="rounded-lg border border-zinc-700 px-3 text-sm"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
          }}
        >
          Clear
        </button>
      </div>
    </label>
  );
}
