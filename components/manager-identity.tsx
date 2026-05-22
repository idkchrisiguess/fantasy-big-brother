"use client";

import { getManagerName } from "@/lib/league";
import {
  getLeagueManagerId,
  getLeagueMemberId,
  getPlayerDisplayName,
  setLeagueManagerId,
  setLeagueMemberId,
  setPlayerDisplayName,
} from "@/lib/session";
import type { League, ManagerId } from "@/lib/types";
import { useState } from "react";

export function ManagerIdentity({
  league,
  onClaimCommissioner,
}: {
  league: League;
  onClaimCommissioner?: (memberId: string) => void;
}) {
  const savedId = getLeagueManagerId(league.id);
  const [managerId, setManagerId] = useState<ManagerId | "">(
    () => savedId ?? "",
  );

  function handleSelect(id: ManagerId) {
    setManagerId(id);
    setLeagueManagerId(league.id, id);
    const mgr = league.managers.find((m) => m.id === id);
    if (mgr?.memberId) {
      setLeagueMemberId(league.id, mgr.memberId);
      onClaimCommissioner?.(mgr.memberId);
    }
    const display = getManagerName(league, id);
    if (display) setPlayerDisplayName(display);
  }

  const memberId = getLeagueMemberId(league.id);
  const displayName = managerId
    ? getManagerName(league, managerId)
    : getPlayerDisplayName();

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121a2e] px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        You are drafting as
      </p>
      {managerId ? (
        <p className="mt-1 text-lg font-semibold text-white">{displayName}</p>
      ) : (
        <p className="mt-1 text-sm text-zinc-400">
          Select your manager to make picks on your turn.
        </p>
      )}
      <select
        value={managerId}
        onChange={(e) => handleSelect(e.target.value as ManagerId)}
        className="mt-3 w-full max-w-sm rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm text-white"
      >
        <option value="">Choose manager…</option>
        {league.managers.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
            {m.memberId && m.memberId !== memberId ? " (claimed)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
