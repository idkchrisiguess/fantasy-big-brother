import type {
  Houseguest,
  League,
  ManagerStanding,
  ScoringRules,
  WeekEvent,
  WeekEventType,
} from "./types";

/** Standard fantasy Big Brother scoring (documented in README-style export). */
export const SCORING_RULES: ScoringRules = {
  survivalPerWeek: 2,
  hohWin: 5,
  vetoWin: 4,
  nominated: -2,
  placementPoints: {
    1: 30,
    2: 25,
    3: 20,
    4: 15,
    5: 12,
    6: 10,
    7: 8,
    8: 6,
    9: 5,
    10: 4,
    11: 3,
    12: 2,
    13: 2,
    14: 1,
    15: 1,
    16: 1,
  },
};

const EVENT_POINTS: Partial<Record<WeekEventType, number>> = {
  hoh: SCORING_RULES.hohWin,
  veto: SCORING_RULES.vetoWin,
  nominated: SCORING_RULES.nominated,
  survival: SCORING_RULES.survivalPerWeek,
};

export function placementPoints(placement: number): number {
  return SCORING_RULES.placementPoints[placement] ?? 0;
}

export function calculateHouseguestPoints(
  houseguest: Houseguest,
  events: WeekEvent[],
  rules: ScoringRules = SCORING_RULES,
): number {
  const hgEvents = events.filter((e) => e.houseguestId === houseguest.id);
  let total = 0;

  for (const event of hgEvents) {
    if (event.type === "evicted") continue;
    const base = EVENT_POINTS[event.type];
    if (base !== undefined) {
      total +=
        event.type === "survival"
          ? rules.survivalPerWeek
          : event.type === "hoh"
            ? rules.hohWin
            : event.type === "veto"
              ? rules.vetoWin
              : rules.nominated;
    }
  }

  if (houseguest.placement !== undefined) {
    total += rules.placementPoints[houseguest.placement] ?? 0;
  }

  return total;
}

export function buildStandings(league: League): ManagerStanding[] {
  const houseguestMap = new Map(
    league.houseguests.map((hg) => [hg.id, hg] as const),
  );

  const rows = league.managers.map((manager) => {
    const rosterPicks = league.picks.filter((p) => p.managerId === manager.id);
    const roster = rosterPicks
      .map((pick) => {
        const houseguest = houseguestMap.get(pick.houseguestId);
        if (!houseguest) return null;
        return {
          houseguest,
          points: calculateHouseguestPoints(houseguest, league.events),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    const totalPoints = roster.reduce((sum, r) => sum + r.points, 0);

    return {
      managerId: manager.id,
      managerName: manager.name,
      totalPoints,
      roster,
      rank: 0,
    };
  });

  rows.sort((a, b) => b.totalPoints - a.totalPoints);
  rows.forEach((row, index) => {
    row.rank = index + 1;
  });

  return rows;
}

export function formatScoringRulesSummary(): string[] {
  const p = SCORING_RULES.placementPoints;
  return [
    `Survive the week: +${SCORING_RULES.survivalPerWeek}`,
    `Head of Household: +${SCORING_RULES.hohWin}`,
    `Power of Veto win: +${SCORING_RULES.vetoWin}`,
    `Nominated (on the block): ${SCORING_RULES.nominated}`,
    `Finale placement: +${p[1]} (winner) down to +${p[16]} (16th)`,
  ];
}
