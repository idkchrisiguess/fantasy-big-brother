import { createDefaultHouseguests } from "./houseguests";
import { newId } from "./storage";
import type {
  DraftPick,
  Houseguest,
  HouseguestId,
  League,
  Manager,
  ManagerId,
  WeekEvent,
  WeekEventType,
} from "./types";

export function createLeague(input: {
  name: string;
  seasonLabel: string;
  managerNames: string[];
  rosterSize?: number;
  houseguests?: Houseguest[];
}): League {
  const managers: Manager[] = input.managerNames.map((name, index) => ({
    id: newId("mgr"),
    name: name.trim(),
    draftPosition: index + 1,
  }));

  return {
    id: newId("league"),
    name: input.name.trim(),
    seasonLabel: input.seasonLabel.trim() || "Season 27",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    managers,
    houseguests: input.houseguests ?? createDefaultHouseguests(),
    picks: [],
    events: [],
    currentWeek: 1,
    draftComplete: false,
    rosterSize: input.rosterSize ?? 3,
  };
}

export function totalDraftPicks(league: League): number {
  return league.managers.length * league.rosterSize;
}

export function snakeDraftOrder(league: League, pickNumber: number): ManagerId {
  const count = league.managers.length;
  const round = Math.floor((pickNumber - 1) / count);
  const positionInRound = (pickNumber - 1) % count;
  const reversed = round % 2 === 1;
  const sorted = [...league.managers].sort(
    (a, b) => a.draftPosition - b.draftPosition,
  );
  const index = reversed ? count - 1 - positionInRound : positionInRound;
  return sorted[index]!.id;
}

export function currentPickNumber(league: League): number {
  return league.picks.length + 1;
}

export function onTheClockManagerId(league: League): ManagerId | null {
  if (league.draftComplete) return null;
  const pickNum = currentPickNumber(league);
  if (pickNum > totalDraftPicks(league)) return null;
  return snakeDraftOrder(league, pickNum);
}

export function availableHouseguests(league: League): Houseguest[] {
  const picked = new Set(league.picks.map((p) => p.houseguestId));
  return league.houseguests.filter((hg) => !picked.has(hg.id));
}

export function managerRosterIds(
  league: League,
  managerId: ManagerId,
): HouseguestId[] {
  return league.picks
    .filter((p) => p.managerId === managerId)
    .map((p) => p.houseguestId);
}

export function makeDraftPick(
  league: League,
  houseguestId: HouseguestId,
): League {
  const managerId = onTheClockManagerId(league);
  if (!managerId) return league;

  const pick: DraftPick = {
    managerId,
    houseguestId,
    pickNumber: currentPickNumber(league),
  };

  const picks = [...league.picks, pick];
  const draftComplete = picks.length >= totalDraftPicks(league);

  return { ...league, picks, draftComplete };
}

export function undoLastPick(league: League): League {
  if (league.picks.length === 0) return league;
  const picks = league.picks.slice(0, -1);
  return { ...league, picks, draftComplete: false };
}

export function activeHouseguests(league: League): Houseguest[] {
  return league.houseguests.filter((hg) => hg.status === "active");
}

export function remainingPlacement(league: League): number {
  const evicted = league.houseguests.filter((hg) => hg.status === "evicted");
  return league.houseguests.length - evicted.length;
}

export function addWeekEvent(
  league: League,
  week: number,
  houseguestId: HouseguestId,
  type: WeekEventType,
): League {
  const event: WeekEvent = {
    id: newId("evt"),
    week,
    houseguestId,
    type,
  };

  let houseguests = league.houseguests;
  const events = [...league.events, event];

  if (type === "evicted") {
    const placement = remainingPlacement(league);
    houseguests = houseguests.map((hg) =>
      hg.id === houseguestId
        ? {
            ...hg,
            status: "evicted" as const,
            evictionWeek: week,
            placement,
          }
        : hg,
    );
  }

  return { ...league, houseguests, events, currentWeek: Math.max(league.currentWeek, week) };
}

export function removeWeekEvent(league: League, eventId: string): League {
  const event = league.events.find((e) => e.id === eventId);
  if (!event) return league;

  let houseguests = league.houseguests;
  const events = league.events.filter((e) => e.id !== eventId);

  if (event.type === "evicted") {
    houseguests = houseguests.map((hg) =>
      hg.id === event.houseguestId
        ? {
            ...hg,
            status: "active" as const,
            evictionWeek: undefined,
            placement: undefined,
          }
        : hg,
    );
  }

  return { ...league, houseguests, events };
}

/** Award survival points to every active houseguest for a week. */
export function recordWeekSurvival(league: League, week: number): League {
  const active = activeHouseguests(league);
  let next = league;
  for (const hg of active) {
    const already = next.events.some(
      (e) =>
        e.week === week &&
        e.houseguestId === hg.id &&
        e.type === "survival",
    );
    if (!already) {
      next = addWeekEvent(next, week, hg.id, "survival");
    }
  }
  return { ...next, currentWeek: Math.max(next.currentWeek, week) };
}

export function getManagerName(league: League, managerId: ManagerId): string {
  return league.managers.find((m) => m.id === managerId)?.name ?? "Unknown";
}

/** Replace the cast only before any draft picks or scored events. */
export function updateLeagueCast(
  league: League,
  houseguests: Houseguest[],
): League | null {
  if (league.picks.length > 0 || league.events.length > 0) {
    return null;
  }
  return { ...league, houseguests, draftComplete: false };
}
