import type { LeagueId, ManagerId } from "./types";

const PLAYER_NAME_KEY = "fbb-player-name";

export function getPlayerDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLAYER_NAME_KEY);
}

export function setPlayerDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAYER_NAME_KEY, name.trim());
}

function managerKey(leagueId: LeagueId): string {
  return `fbb-league-${leagueId}-managerId`;
}

function memberKey(leagueId: LeagueId): string {
  return `fbb-league-${leagueId}-memberId`;
}

export function getLeagueManagerId(leagueId: LeagueId): ManagerId | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(managerKey(leagueId));
}

export function setLeagueManagerId(
  leagueId: LeagueId,
  managerId: ManagerId,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(managerKey(leagueId), managerId);
}

export function clearLeagueManagerId(leagueId: LeagueId): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(managerKey(leagueId));
}

export function getLeagueMemberId(leagueId: LeagueId): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(memberKey(leagueId));
}

export function setLeagueMemberId(leagueId: LeagueId, memberId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(memberKey(leagueId), memberId);
}
