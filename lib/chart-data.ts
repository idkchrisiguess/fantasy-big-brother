import { managerRosterIds } from "./league";
import { SCORING_RULES, placementPoints } from "./scoring";
import type { League, ManagerId, ScoringRules, WeekEvent, WeekEventType } from "./types";

export type ChartEventCategory =
  | "survival"
  | "hoh"
  | "veto"
  | "nominated"
  | "placement";

const CATEGORY_LABELS: Record<ChartEventCategory, string> = {
  survival: "Survival",
  hoh: "HOH",
  veto: "Veto",
  nominated: "Nominated",
  placement: "Placement",
};

const CATEGORY_COLORS: Record<ChartEventCategory, string> = {
  survival: "#34d399",
  hoh: "#60a5fa",
  veto: "#a78bfa",
  nominated: "#fbbf24",
  placement: "#fb923c",
};

function eventPoints(
  event: WeekEvent,
  rules: ScoringRules = SCORING_RULES,
): number {
  switch (event.type) {
    case "survival":
      return rules.survivalPerWeek;
    case "hoh":
      return rules.hohWin;
    case "veto":
      return rules.vetoWin;
    case "nominated":
      return rules.nominated;
    default:
      return 0;
  }
}

function maxChartWeek(league: League): number {
  const fromEvents = league.events.reduce((max, e) => Math.max(max, e.week), 0);
  const fromEvictions = league.houseguests.reduce(
    (max, hg) => Math.max(max, hg.evictionWeek ?? 0),
    0,
  );
  return Math.max(1, league.currentWeek, fromEvents, fromEvictions);
}

function houseguestPointsThroughWeek(
  league: League,
  houseguestId: string,
  throughWeek: number,
  rules: ScoringRules = SCORING_RULES,
): number {
  const hg = league.houseguests.find((h) => h.id === houseguestId);
  if (!hg) return 0;

  let total = 0;
  for (const event of league.events) {
    if (event.houseguestId !== houseguestId) continue;
    if (event.type === "evicted") continue;
    if (event.week > throughWeek) continue;
    total += eventPoints(event, rules);
  }

  if (
    hg.placement !== undefined &&
    hg.evictionWeek !== undefined &&
    hg.evictionWeek <= throughWeek
  ) {
    total += placementPoints(hg.placement);
  }

  return total;
}

export interface WeeklyPointsRow {
  week: number;
  [managerKey: string]: number | string;
}

export function buildWeeklyPointsSeries(league: League): {
  data: WeeklyPointsRow[];
  managers: { id: ManagerId; name: string; key: string }[];
} {
  const weeks = Array.from({ length: maxChartWeek(league) }, (_, i) => i + 1);
  const managers = league.managers.map((m) => ({
    id: m.id,
    name: m.name,
    key: `mgr_${m.id}`,
  }));

  const data: WeeklyPointsRow[] = weeks.map((week) => {
    const row: WeeklyPointsRow = { week };
    for (const manager of managers) {
      const roster = managerRosterIds(league, manager.id);
      row[manager.key] = roster.reduce(
        (sum, hgId) =>
          sum + houseguestPointsThroughWeek(league, hgId, week),
        0,
      );
    }
    return row;
  });

  return { data, managers };
}

export interface EventBreakdownRow {
  manager: string;
  survival: number;
  hoh: number;
  veto: number;
  nominated: number;
  placement: number;
}

function categorizeEvent(type: WeekEventType): ChartEventCategory | null {
  if (type === "evicted") return null;
  return type;
}

export function buildEventBreakdown(league: League): {
  data: EventBreakdownRow[];
  categories: { key: ChartEventCategory; label: string; color: string }[];
} {
  const rules = SCORING_RULES;
  const categories = (
    Object.keys(CATEGORY_LABELS) as ChartEventCategory[]
  ).map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    color: CATEGORY_COLORS[key],
  }));

  const data: EventBreakdownRow[] = league.managers.map((manager) => {
    const roster = new Set(managerRosterIds(league, manager.id));
    const row: EventBreakdownRow = {
      manager: manager.name,
      survival: 0,
      hoh: 0,
      veto: 0,
      nominated: 0,
      placement: 0,
    };

    for (const event of league.events) {
      if (!roster.has(event.houseguestId)) continue;
      const cat = categorizeEvent(event.type);
      if (!cat) continue;
      row[cat] += eventPoints(event, rules);
    }

    for (const hgId of roster) {
      const hg = league.houseguests.find((h) => h.id === hgId);
      if (hg?.placement !== undefined) {
        row.placement += placementPoints(hg.placement);
      }
    }

    return row;
  });

  return { data, categories };
}

export function hasChartData(league: League): boolean {
  return league.picks.length > 0 || league.events.length > 0;
}
