type ColorSettingRowProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function ColorSettingRow({
  label,
  value,
  onChange,
  disabled = false,
}: ColorSettingRowProps) {
  function handleTextChange(value: string) {
    const normalized = value.toUpperCase();

    if (/^#[0-9A-F]{0,6}$/.test(normalized)) {
      onChange(normalized);
    }
  }

  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-zinc-300">
        {label}
      </span>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={
            /^#[0-9A-Fa-f]{6}$/.test(value)
              ? value
              : "#000000"
          }
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value.toUpperCase())
          }
          aria-label={`${label} color picker`}
          className="h-9 w-11 cursor-pointer rounded border border-zinc-700 bg-zinc-900 p-1 disabled:cursor-not-allowed disabled:opacity-50"
        />

        <input
          type="text"
          value={value}
          disabled={disabled}
          maxLength={7}
          spellCheck={false}
          onChange={(event) =>
            handleTextChange(event.target.value)
          }
          aria-label={`${label} hex color`}
          className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm uppercase text-zinc-100 disabled:opacity-50"
        />
      </div>
    </div>
  );
}