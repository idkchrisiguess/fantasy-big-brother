"use client";

import { useLeagueStore } from "@/components/providers/league-store";
import {
  fetchRemoteLeagueById,
  isSupabaseConfigured,
  subscribeToLeague,
} from "@/lib/sync";
import type { League, LeagueId } from "@/lib/types";
import { useEffect, useRef } from "react";

const POLL_MS = 4000;

/** Realtime + polling: keep one league in sync during live draft. */
export function useLeagueLive(leagueId: LeagueId, enabled: boolean) {
  const { applyRemoteLeague } = useLeagueStore();
  const applyRef = useRef(applyRemoteLeague);

  useEffect(() => {
    applyRef.current = applyRemoteLeague;
  }, [applyRemoteLeague]);

  useEffect(() => {
    if (!enabled || !leagueId) return;

    let cancelled = false;

    async function pull() {
      if (!isSupabaseConfigured()) return;
      try {
        const remote = await fetchRemoteLeagueById(leagueId);
        if (!cancelled && remote) {
          applyRef.current(remote);
        }
      } catch {
        /* polling is best-effort */
      }
    }

    void pull();

    const unsubscribeRealtime = subscribeToLeague(leagueId, (remote: League) => {
      if (!cancelled) applyRef.current(remote);
    });

    const pollId = isSupabaseConfigured()
      ? window.setInterval(() => void pull(), POLL_MS)
      : undefined;

    return () => {
      cancelled = true;
      unsubscribeRealtime();
      if (pollId) window.clearInterval(pollId);
    };
  }, [leagueId, enabled]);
}
