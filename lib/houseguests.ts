import type { Houseguest } from "./types";

/** Demo cast for a 16-player season — replace when wiring a real season. */
export const DEFAULT_CAST_NAMES = [
  "Alex Rivera",
  "Blake Chen",
  "Casey Morgan",
  "Drew Patel",
  "Emery Brooks",
  "Finley Shaw",
  "Gray Donovan",
  "Harper Lane",
  "Indigo West",
  "Jordan Hale",
  "Kai Sullivan",
  "Logan Price",
  "Morgan Ellis",
  "Nova Kim",
  "Parker Reed",
  "Quinn Avery",
] as const;

/** Fictional 16-player preset — generic “recent season” vibe, not real cast names. */
export const SEASON_26_STYLE_NAMES = [
  "Avery Cole",
  "Brooks Tate",
  "Cameron Vale",
  "Dakota Finn",
  "Ellis Rowe",
  "Frankie Moss",
  "Greer Holt",
  "Hayden Pike",
  "Isla Mercer",
  "Jules Navarro",
  "Kellen Shaw",
  "Lena Ortiz",
  "Micah Grant",
  "Nico Brandt",
  "Opal Reese",
  "Peyton Lane",
] as const;

export type CastPresetId = "default" | "season-26-style";

export interface CastPreset {
  id: CastPresetId;
  label: string;
  description: string;
  names: readonly string[];
}

export const CAST_PRESETS: CastPreset[] = [
  {
    id: "default",
    label: "Default cast",
    description: "16 fictional houseguests (demo pool)",
    names: DEFAULT_CAST_NAMES,
  },
  {
    id: "season-26-style",
    label: "Season 26 style",
    description: "16 fictional names in a modern-season layout",
    names: SEASON_26_STYLE_NAMES,
  },
];

export function createHouseguestsFromNames(names: string[]): Houseguest[] {
  return names.map((name, index) => ({
    id: `hg-${index + 1}`,
    name: name.trim(),
    status: "active" as const,
  }));
}

export function createDefaultHouseguests(): Houseguest[] {
  return createHouseguestsFromNames([...DEFAULT_CAST_NAMES]);
}

export function houseguestsForPreset(presetId: CastPresetId): Houseguest[] {
  const preset = CAST_PRESETS.find((p) => p.id === presetId);
  if (!preset) return createDefaultHouseguests();
  return createHouseguestsFromNames([...preset.names]);
}
