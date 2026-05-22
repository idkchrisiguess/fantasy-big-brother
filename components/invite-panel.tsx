"use client";

import { claimedMemberCount, invitePath, isLeagueFull } from "@/lib/invite";
import { isSupabaseConfigured } from "@/lib/sync";
import type { League } from "@/lib/types";
import { useMemo, useState } from "react";

export function InvitePanel({
  league,
  onUpdate,
}: {
  league: League;
  onUpdate: (league: League) => void;
}) {
  const [copied, setCopied] = useState(false);
  const inviteCode = league.inviteCode ?? "";
  const joinPath = inviteCode ? invitePath(inviteCode) : "";

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined" || !joinPath) return joinPath;
    return `${window.location.origin}${joinPath}`;
  }, [joinPath]);

  async function handleCopy() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const claimed = claimedMemberCount(league);
  const capacity = league.managers.length;
  const full = isLeagueFull(league);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121a2e] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Invite managers</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Share the link so friends claim a manager slot before the draft.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            full
              ? "bg-rose-500/20 text-rose-200"
              : "bg-emerald-500/20 text-emerald-200"
          }`}
        >
          {claimed}/{capacity} joined
        </span>
      </div>

      {!isSupabaseConfigured() ? (
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
          Enable Supabase env vars for live drafts and cross-device invites.
          Solo play still works locally.
        </p>
      ) : null}

      {inviteCode ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-xs text-orange-200">
            {inviteUrl || joinPath}
          </code>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="shrink-0 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-400"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      ) : null}

      <label className="mt-4 block">
        <span className="text-xs font-medium text-zinc-400">
          League passcode (optional)
        </span>
        <input
          value={league.passcode ?? ""}
          onChange={(e) =>
            onUpdate({
              ...league,
              passcode: e.target.value.trim() || undefined,
            })
          }
          placeholder="Leave blank for open join"
          className="mt-1 w-full max-w-xs rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        />
      </label>

      <div className="mt-5">
        <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Roster
        </h4>
        <ul className="mt-2 space-y-1.5 text-sm">
          {league.managers.map((mgr) => {
            const member = league.members?.find((m) => m.id === mgr.memberId);
            return (
              <li
                key={mgr.id}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
              >
                <span className="text-white">{mgr.name}</span>
                <span className="text-xs text-zinc-400">
                  {member ? `Joined · ${member.name}` : "Open slot"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
