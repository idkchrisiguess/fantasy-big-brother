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
import { isCommissioner } from "@/lib/invite";
import { isSupabaseConfigured } from "@/lib/sync";
import { getLeagueManagerId, getLeagueMemberId } from "@/lib/session";
import type { Houseguest, League } from "@/lib/types";

export function DraftBoard({
  league,
  onUpdate,
  live,
}: {
  league: League;
  onUpdate: (league: League) => void;
  live?: boolean;
}) {
  const onClock = onTheClockManagerId(league);
  const available = availableHouseguests(league);
  const total = totalDraftPicks(league);
  const canEditCast =
    league.picks.length === 0 && league.events.length === 0;

  const myManagerId = getLeagueManagerId(league.id);
  const myMemberId = getLeagueMemberId(league.id);
  const isMyTurn = Boolean(onClock && myManagerId && onClock === myManagerId);
  const canPick = isMyTurn || (!myManagerId && !isSupabaseConfigured());
  const commissioner = isCommissioner(league, myMemberId);
  const clockName = onClock ? getManagerName(league, onClock) : "—";

  function handleCastChange(pool: Houseguest[], errors: string[]) {
    if (errors.length > 0) return;
    const updated = updateLeagueCast(league, pool);
    if (updated) onUpdate(updated);
  }

  function handlePick(houseguestId: string) {
    if (!canPick) return;
    onUpdate(makeDraftPick(league, houseguestId));
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
      <DraftStatusBanner
        live={live}
        isMyTurn={isMyTurn}
        clockName={clockName}
        pickIndex={league.picks.length + 1}
        total={total}
        hasIdentity={Boolean(myManagerId)}
      />

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

      <div
        className={`rounded-2xl border px-5 py-4 ${
          isMyTurn
            ? "border-orange-500/50 bg-orange-500/15"
            : "border-orange-500/30 bg-orange-500/10"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-wide text-orange-200/80">
            On the clock · Pick {league.picks.length + 1} of {total}
          </p>
          {live && isSupabaseConfigured() ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xl font-semibold text-white">{clockName}</p>
        {!isMyTurn && myManagerId ? (
          <p className="mt-2 text-sm text-zinc-400">
            Waiting for {clockName}…
          </p>
        ) : null}
        {!myManagerId && isSupabaseConfigured() ? (
          <p className="mt-2 text-sm text-amber-200/90">
            Select who you are above to make picks on your turn.
          </p>
        ) : null}
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
              disabled={!canPick}
              onClick={() => handlePick(hg.id)}
              className="rounded-xl border border-white/10 bg-[#121a2e] px-4 py-3 text-left text-sm font-medium text-white transition hover:border-orange-500/50 hover:bg-[#151f36] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {hg.name}
            </button>
          ))}
        </div>
      </div>

      {league.picks.length > 0 && commissioner ? (
        <button
          type="button"
          onClick={() => onUpdate(undoLastPick(league))}
          className="text-sm text-zinc-400 underline-offset-2 hover:text-white hover:underline"
        >
          Undo last pick (commissioner)
        </button>
      ) : null}

      <DraftHistory league={league} />
    </div>
  );
}

function DraftStatusBanner({
  live,
  isMyTurn,
  clockName,
  pickIndex,
  total,
  hasIdentity,
}: {
  live?: boolean;
  isMyTurn: boolean;
  clockName: string;
  pickIndex: number;
  total: number;
  hasIdentity: boolean;
}) {
  if (!live || !isSupabaseConfigured()) return null;

  let message = `Live draft · pick ${pickIndex} of ${total}`;
  if (isMyTurn) message = "You're on the clock!";
  else if (hasIdentity) message = `Waiting for ${clockName}…`;
  else message = "Select your manager to join the draft";

  return (
    <p className="text-center text-xs font-medium uppercase tracking-wide text-zinc-500">
      {message}
    </p>
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
