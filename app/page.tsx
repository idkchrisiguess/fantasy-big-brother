"use client";

import { AppShell } from "@/components/app-shell";
import { LeagueCard } from "@/components/league-card";
import { useLeagueStore } from "@/components/providers/league-store";
import Link from "next/link";

export default function HomePage() {
  const { leagues, hydrated } = useLeagueStore();

  return (
    <AppShell
      title="Your drafts"
      subtitle="Create a league, snake-draft houseguests, log weekly events, and track the points race."
    >
      {!hydrated ? (
        <p className="text-zinc-400">Loading your leagues…</p>
      ) : leagues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#121a2e] px-8 py-16 text-center">
          <p className="text-lg font-medium text-white">No drafts yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            Start a fantasy league with friends. You will draft from a 16-person
            houseguest pool and score HOH, veto, survival, and evictions each
            week.
          </p>
          <Link
            href="/league/new"
            className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-400"
          >
            Create your first draft
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {leagues.map((league) => (
            <LeagueCard key={league.id} league={league} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
