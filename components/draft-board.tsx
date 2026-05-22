"use client";

import { CastImport } from "@/components/cast-import";
import {
  availableHouseguests,
  getManagerName,
  makeDraftPick,
  onTheClockManagerId,
  totalDraftPicks,
  undoLastPick,
  updateLeagueCast,
} from "@/lib/league";
import type { Houseguest, League } from "@/lib/types";

export function DraftBoard({
  league,
  onUpdate,
}: {
  league: League;
  onUpdate: (league: League) => void;
}) {
  const onClock = onTheClockManagerId(league);
  const available = availableHouseguests(league);
  const total = totalDraftPicks(league);
  const canEditCast =
    league.picks.length === 0 && league.events.length === 0;

  function handleCastChange(pool: Houseguest[], errors: string[]) {
    if (errors.length > 0) return;
    const updated = updateLeagueCast(league, pool);
    if (updated) onUpdate(updated);
  }

  if (league.draftComplete) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-200">Draft complete</p>
        <p className="mt-2 text-sm text-emerald-100/80">
          All {total} picks are in. Head to Scoring to log weekly events.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canEditCast ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-400">Season cast</h3>
          <p className="text-xs text-zinc-500">
            Change the houseguest pool before the first pick. After drafting
            starts, the cast is locked.
          </p>
          <CastImport
            value={league.houseguests}
            onChange={handleCastChange}
          />
        </div>
      ) : null}

      <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-5 py-4">
        <p className="text-xs uppercase tracking-wide text-orange-200/80">
          On the clock · Pick {league.picks.length + 1} of {total}
        </p>
        <p className="mt-1 text-xl font-semibold text-white">
          {onClock ? getManagerName(league, onClock) : "—"}
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-400">
          Available houseguests ({available.length})
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((hg) => (
            <button
              key={hg.id}
              type="button"
              onClick={() => onUpdate(makeDraftPick(league, hg.id))}
              className="rounded-xl border border-white/10 bg-[#121a2e] px-4 py-3 text-left text-sm font-medium text-white transition hover:border-orange-500/50 hover:bg-[#151f36]"
            >
              {hg.name}
            </button>
          ))}
        </div>
      </div>

      {league.picks.length > 0 ? (
        <button
          type="button"
          onClick={() => onUpdate(undoLastPick(league))}
          className="text-sm text-zinc-400 underline-offset-2 hover:text-white hover:underline"
        >
          Undo last pick
        </button>
      ) : null}

      <DraftHistory league={league} />
    </div>
  );
}

function DraftHistory({ league }: { league: League }) {
  if (league.picks.length === 0) return null;

  const sorted = [...league.picks].sort((a, b) => b.pickNumber - a.pickNumber);

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-zinc-400">Recent picks</h3>
      <ol className="max-h-48 space-y-2 overflow-y-auto text-sm">
        {sorted.slice(0, 12).map((pick) => {
          const hg = league.houseguests.find((h) => h.id === pick.houseguestId);
          return (
            <li
              key={pick.pickNumber}
              className="flex justify-between rounded-lg bg-white/5 px-3 py-2"
            >
              <span className="text-zinc-400">#{pick.pickNumber}</span>
              <span className="text-white">
                {getManagerName(league, pick.managerId)}
              </span>
              <span className="text-orange-200">{hg?.name}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
