"use client";

import { useState } from "react";
import {
  activeHouseguests,
  addWeekEvent,
  recordWeekSurvival,
  removeWeekEvent,
} from "@/lib/league";
import { formatScoringRulesSummary } from "@/lib/scoring";
import type { League, WeekEventType } from "@/lib/types";

const QUICK_EVENTS: { type: WeekEventType; label: string; color: string }[] = [
  { type: "hoh", label: "HOH", color: "bg-blue-500/20 text-blue-200 hover:bg-blue-500/30" },
  { type: "veto", label: "Veto", color: "bg-purple-500/20 text-purple-200 hover:bg-purple-500/30" },
  { type: "nominated", label: "Nominated", color: "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30" },
  { type: "evicted", label: "Evicted", color: "bg-rose-500/20 text-rose-200 hover:bg-rose-500/30" },
];

export function ScoringPanel({
  league,
  onUpdate,
}: {
  league: League;
  onUpdate: (league: League) => void;
}) {
  const [week, setWeek] = useState(league.currentWeek);
  const active = activeHouseguests(league);
  const weekEvents = league.events
    .filter((e) => e.week === week)
    .sort((a, b) => b.id.localeCompare(a.id));

  function logEvent(houseguestId: string, type: WeekEventType) {
    onUpdate(addWeekEvent(league, week, houseguestId, type));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Week
          </span>
          <input
            type="number"
            min={1}
            max={99}
            value={week}
            onChange={(e) => setWeek(Number(e.target.value) || 1)}
            className="mt-1 w-24 rounded-lg border border-white/10 bg-[#121a2e] px-3 py-2 text-white"
          />
        </label>
        <button
          type="button"
          onClick={() => onUpdate(recordWeekSurvival(league, week))}
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20"
        >
          Award survival to all active ({active.length})
        </button>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-400">
          Log events for week {week}
        </h3>
        <div className="space-y-3">
          {active.map((hg) => (
            <div
              key={hg.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#121a2e] px-4 py-3"
            >
              <span className="min-w-[140px] flex-1 font-medium text-white">
                {hg.name}
              </span>
              {QUICK_EVENTS.map((evt) => (
                <button
                  key={evt.type}
                  type="button"
                  onClick={() => logEvent(hg.id, evt.type)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${evt.color}`}
                >
                  {evt.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        {active.length === 0 ? (
          <p className="text-sm text-zinc-500">No active houseguests remain.</p>
        ) : null}
      </div>

      {weekEvents.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-medium text-zinc-400">
            Events this week
          </h3>
          <ul className="space-y-2 text-sm">
            {weekEvents.map((evt) => {
              const hg = league.houseguests.find((h) => h.id === evt.houseguestId);
              return (
                <li
                  key={evt.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                >
                  <span className="text-zinc-300">
                    <span className="capitalize text-white">{evt.type}</span>
                    {" · "}
                    {hg?.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdate(removeWeekEvent(league, evt.id))}
                    className="text-xs text-zinc-500 hover:text-rose-300"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <details className="rounded-xl border border-white/10 bg-[#121a2e] p-4">
        <summary className="cursor-pointer text-sm font-medium text-zinc-300">
          Scoring rules
        </summary>
        <ul className="mt-3 space-y-1 text-sm text-zinc-400">
          {formatScoringRulesSummary().map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
