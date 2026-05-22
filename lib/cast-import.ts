import { createHouseguestsFromNames } from "./houseguests";
import type { Houseguest } from "./types";

export const CAST_MIN_PLAYERS = 10;
export const CAST_MAX_PLAYERS = 20;

/** Parse pasted text: one name per line, or `Name,Archetype` (archetype ignored in v1). */
export function parseCastLines(text: string): string[] {
  const names: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(",").map((s) => s.trim());
    const name = parts[0];
    if (name) names.push(name);
  }
  return names;
}

export function validateCastNames(
  names: string[],
): { ok: true; houseguests: Houseguest[] } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  if (names.length === 0) {
    errors.push("Add at least one houseguest name.");
  } else if (names.length < CAST_MIN_PLAYERS) {
    errors.push(
      `Need at least ${CAST_MIN_PLAYERS} houseguests (you have ${names.length}).`,
    );
  } else if (names.length > CAST_MAX_PLAYERS) {
    errors.push(
      `Maximum ${CAST_MAX_PLAYERS} houseguests (you have ${names.length}).`,
    );
  }

  const empty = names.some((n) => !n.trim());
  if (empty) {
    errors.push("Names cannot be empty.");
  }

  const seen = new Map<string, string>();
  const duplicates: string[] = [];
  for (const name of names) {
    const key = name.trim().toLowerCase();
    if (seen.has(key)) {
      if (!duplicates.includes(seen.get(key)!)) {
        duplicates.push(seen.get(key)!);
      }
    } else {
      seen.set(key, name.trim());
    }
  }
  if (duplicates.length > 0) {
    errors.push(`Duplicate names: ${duplicates.join(", ")}`);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, houseguests: createHouseguestsFromNames(names) };
}

export function parseAndValidateCastText(
  text: string,
): { ok: true; houseguests: Houseguest[] } | { ok: false; errors: string[] } {
  return validateCastNames(parseCastLines(text));
}
