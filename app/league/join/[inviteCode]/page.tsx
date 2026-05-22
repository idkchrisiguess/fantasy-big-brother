"use client";

import { AppShell } from "@/components/app-shell";
import { useLeagueStore } from "@/components/providers/league-store";
import {
  isLeagueFull,
  joinLeagueAsManager,
  unclaimedManagers,
} from "@/lib/invite";
import {
  fetchRemoteLeagueByInviteCode,
  isSupabaseConfigured,
  withUpdatedAt,
} from "@/lib/sync";
import {
  getLeagueMemberId,
  getPlayerDisplayName,
  setLeagueManagerId,
  setLeagueMemberId,
  setPlayerDisplayName,
} from "@/lib/session";
import type { ManagerId } from "@/lib/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function readSavedDisplayName(): string {
  if (typeof window === "undefined") return "";
  return getPlayerDisplayName() ?? "";
}

export default function JoinLeaguePage() {
  const params = useParams();
  const inviteCode =
    typeof params.inviteCode === "string" ? params.inviteCode : "";
  const router = useRouter();
  const { getById, importLeague, hydrated } = useLeagueStore();

  const [leagueLoading, setLeagueLoading] = useState(Boolean(inviteCode));
  const [leagueError, setLeagueError] = useState(
    inviteCode ? "" : "Missing invite code.",
  );
  const [remoteLeagueId, setRemoteLeagueId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(readSavedDisplayName);
  const [passcode, setPasscode] = useState("");
  const [slotId, setSlotId] = useState<ManagerId | "">("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!inviteCode) return;

    let cancelled = false;

    async function load() {
      setLeagueLoading(true);
      setLeagueError("");

      if (!isSupabaseConfigured()) {
        if (!cancelled) {
          setLeagueError(
            "Cloud sync is not configured. Ask the commissioner to share the league from a synced deploy, or open the invite on their device.",
          );
          setLeagueLoading(false);
        }
        return;
      }

      try {
        const remote = await fetchRemoteLeagueByInviteCode(inviteCode);
        if (cancelled) return;
        if (!remote) {
          setLeagueError(
            "Invite not found. Check the link with your commissioner.",
          );
          setLeagueLoading(false);
          return;
        }
        setRemoteLeagueId(remote.id);
        importLeague(remote);
      } catch {
        if (!cancelled) {
          setLeagueError("Could not load league. Try again in a moment.");
        }
      } finally {
        if (!cancelled) setLeagueLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [inviteCode, importLeague]);

  const loadedLeague = remoteLeagueId ? getById(remoteLeagueId) : undefined;
  const openSlots = loadedLeague ? unclaimedManagers(loadedLeague) : [];

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!loadedLeague) return;
    setJoinError("");
    setJoining(true);

    const result = joinLeagueAsManager(loadedLeague, {
      displayName,
      passcode,
      managerId: slotId || undefined,
    });

    if ("error" in result) {
      setJoinError(result.error);
      setJoining(false);
      return;
    }

    setPlayerDisplayName(displayName);
    setLeagueManagerId(loadedLeague.id, result.managerId);
    setLeagueMemberId(loadedLeague.id, result.member.id);

    const existingMember = getLeagueMemberId(loadedLeague.id);
    let next = result.league;
    if (!next.commissionerMemberId && !existingMember) {
      next = { ...next, commissionerMemberId: result.member.id };
    }

    importLeague(withUpdatedAt(next));
    setJoining(false);
    router.push(`/league/${loadedLeague.id}`);
  }

  if (!inviteCode) {
    return (
      <AppShell title="Join draft">
        <p className="text-rose-300">Missing invite code.</p>
        <Link href="/" className="mt-4 inline-block text-orange-400 hover:underline">
          ← Home
        </Link>
      </AppShell>
    );
  }

  if (leagueLoading || !hydrated) {
    return (
      <AppShell title="Join draft">
        <p className="text-zinc-400">Loading invite…</p>
      </AppShell>
    );
  }

  if (leagueError) {
    return (
      <AppShell title="Join draft">
        <p className="text-rose-300">{leagueError}</p>
        <Link href="/" className="mt-4 inline-block text-orange-400 hover:underline">
          ← Home
        </Link>
      </AppShell>
    );
  }

  if (!loadedLeague) {
    return (
      <AppShell title="Join draft">
        <p className="text-zinc-400">Loading league…</p>
      </AppShell>
    );
  }

  const full = isLeagueFull(loadedLeague);
  const needsSlotPick = openSlots.length > 1;

  return (
    <AppShell
      title={loadedLeague.name}
      subtitle={`${loadedLeague.seasonLabel} · Join with invite ${loadedLeague.inviteCode}`}
    >
      {full ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <p className="text-lg font-semibold text-rose-100">League full</p>
          <p className="mt-2 text-sm text-rose-100/80">
            All {loadedLeague.managers.length} manager slots are claimed.
          </p>
          <Link
            href={`/league/${loadedLeague.id}`}
            className="mt-4 inline-block text-orange-300 hover:underline"
          >
            View league anyway
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleJoin}
          className="max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#121a2e] p-6"
        >
          <p className="text-sm text-zinc-400">
            Claim your manager slot to join the live snake draft.
          </p>

          <label className="block">
            <span className="text-sm font-medium text-zinc-300">Your name</span>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Same as your manager slot if pre-assigned"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-white"
            />
          </label>

          {loadedLeague.passcode ? (
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                League passcode
              </span>
              <input
                required
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-white"
              />
            </label>
          ) : null}

          {needsSlotPick ? (
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Manager slot
              </span>
              <select
                required
                value={slotId}
                onChange={(e) => setSlotId(e.target.value as ManagerId)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-white"
              >
                <option value="">Select open slot…</option>
                {openSlots.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          ) : openSlots.length === 1 ? (
            <p className="text-xs text-zinc-500">
              Open slot: <span className="text-white">{openSlots[0]!.name}</span>
            </p>
          ) : null}

          {joinError ? <p className="text-sm text-rose-400">{joinError}</p> : null}

          <button
            type="submit"
            disabled={joining}
            className="w-full rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-400 disabled:opacity-50"
          >
            {joining ? "Joining…" : "Join league"}
          </button>
        </form>
      )}
    </AppShell>
  );
}
