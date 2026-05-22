"use client";

import { useState } from "react";
import { DraftBoard } from "@/components/draft-board";
import { useLeagueLive } from "@/components/hooks/use-league-live";
import { InvitePanel } from "@/components/invite-panel";
import { LeagueCharts } from "@/components/league-charts";
import { ManagerIdentity } from "@/components/manager-identity";
import { ScoringPanel } from "@/components/scoring-panel";
import { StandingsTable } from "@/components/standings-table";
import { buildStandings } from "@/lib/scoring";
import { isSupabaseConfigured } from "@/lib/sync";
import type { League } from "@/lib/types";

const TABS = [
  { id: "standings", label: "Standings" },
  { id: "charts", label: "Charts" },
  { id: "invite", label: "Invite" },
  { id: "draft", label: "Draft" },
  { id: "scoring", label: "Scoring" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function LeagueTabs({
  league,
  onUpdate,
}: {
  league: League;
  onUpdate: (league: League) => void;
}) {
  const defaultTab: TabId = league.draftComplete ? "standings" : "draft";
  const [tab, setTab] = useState<TabId>(defaultTab);
  const standings = buildStandings(league);
  const draftLive = !league.draftComplete && isSupabaseConfigured();
  useLeagueLive(league.id, draftLive);

  return (
    <div>
      <nav className="mb-6 flex gap-2 border-b border-white/10 pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-white/10 text-orange-200"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "standings" ? <StandingsTable standings={standings} /> : null}
      {tab === "charts" ? <LeagueCharts league={league} /> : null}
      {tab === "invite" ? (
        <InvitePanel league={league} onUpdate={onUpdate} />
      ) : null}
      {tab === "draft" ? (
        <div className="space-y-6">
          <ManagerIdentity
            league={league}
            onClaimCommissioner={(memberId) => {
              if (!league.commissionerMemberId) {
                onUpdate({ ...league, commissionerMemberId: memberId });
              }
            }}
          />
          <DraftBoard league={league} onUpdate={onUpdate} live={draftLive} />
        </div>
      ) : null}
      {tab === "scoring" ? (
        <ScoringPanel league={league} onUpdate={onUpdate} />
      ) : null}
    </div>
  );
}
