import { createDefaultHouseguests } from "./houseguests";
import type { League, LeagueId } from "./types";

const STORAGE_KEY = "fbb-leagues-v1";

function migrateLeague(league: League): League {
  if (!Array.isArray(league.houseguests) || league.houseguests.length === 0) {
    return { ...league, houseguests: createDefaultHouseguests() };
  }
  return league;
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
