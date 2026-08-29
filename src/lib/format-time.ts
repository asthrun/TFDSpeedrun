export function formatTime(ms: number): string {
  const clamped = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(clamped / 60_000);
  const seconds = Math.floor((clamped % 60_000) / 1000);
  const millis = clamped % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export function parseTimeInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d+):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const millis = Number((match[3] ?? "0").padEnd(3, "0"));
  if (seconds >= 60) return null;
  return minutes * 60_000 + seconds * 1000 + millis;
}

export function formatSignedDelta(ms: number): string {
  const sign = ms < 0 ? "−" : "+";
  return `${sign}${formatTime(Math.abs(ms))}`;
}
