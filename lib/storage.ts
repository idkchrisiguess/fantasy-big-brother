import { createDefaultHouseguests } from "./houseguests";
import { ensureInviteCode } from "./invite";
import type { League, LeagueId } from "./types";

const STORAGE_KEY = "fbb-leagues-v1";

function migrateLeague(league: League): League {
  let next = league;
  if (!Array.isArray(next.houseguests) || next.houseguests.length === 0) {
    next = { ...next, houseguests: createDefaultHouseguests() };
  }
  if (!next.members) {
    next = { ...next, members: [] };
  }
  return ensureInviteCode(next);
}

export function loadLeagues(): League[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as League[];
    return Array.isArray(parsed) ? parsed.map(migrateLeague) : [];
  } catch {
    return [];
  }
}

export function saveLeagues(leagues: League[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leagues));
}

export function getLeague(leagues: League[], id: LeagueId): League | undefined {
  return leagues.find((l) => l.id === id);
}

export function upsertLeague(leagues: League[], league: League): League[] {
  const index = leagues.findIndex((l) => l.id === league.id);
  if (index === -1) return [...leagues, league];
  const next = [...leagues];
  next[index] = league;
  return next;
}

export function deleteLeague(leagues: League[], id: LeagueId): League[] {
  return leagues.filter((l) => l.id !== id);
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
