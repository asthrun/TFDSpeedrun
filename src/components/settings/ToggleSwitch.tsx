type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
};

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
}: ToggleSwitchProps) {
  return (
    <label className="inline-flex cursor-pointer items-center">
      <span className="sr-only">{label}</span>

      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />

      <span
        className="
          relative h-6 w-11 rounded-full
          bg-zinc-700
          transition-colors
          peer-checked:bg-emerald-500
          peer-focus-visible:outline
          peer-focus-visible:outline-2
          peer-focus-visible:outline-offset-2
          peer-focus-visible:outline-zinc-300
          peer-disabled:cursor-not-allowed
          peer-disabled:opacity-50
          after:absolute
          after:left-0.5
          after:top-0.5
          after:h-5
          after:w-5
          after:rounded-full
          after:bg-white
          after:transition-transform
          peer-checked:after:translate-x-5
        "
      />
    </label>
  );
}