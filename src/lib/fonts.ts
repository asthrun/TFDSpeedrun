export const FONT_OPTIONS = [
  { id: "geist-mono", label: "Geist Mono", css: "var(--font-geist-mono), ui-monospace, monospace" },
  { id: "geist", label: "Geist", css: "var(--font-geist-sans), system-ui, sans-serif" },
  { id: "ibm-plex-mono", label: "IBM Plex Mono", css: "var(--font-ibm-plex-mono), ui-monospace, monospace" },
  { id: "inter", label: "Inter", css: "var(--font-inter), system-ui, sans-serif" },
  { id: "system", label: "System UI", css: "system-ui, sans-serif" },
] as const;

export function fontCss(fontFamily: string) {
  return FONT_OPTIONS.find((option) => option.id === fontFamily)?.css ?? FONT_OPTIONS[0].css;
}
