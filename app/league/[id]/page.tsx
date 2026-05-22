"use client";

import { LeagueTabs } from "@/components/league-tabs";
import { AppShell } from "@/components/app-shell";
import { useLeagueStore } from "@/components/providers/league-store";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

export default function LeaguePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { getById, updateLeague, removeLeague, hydrated } = useLeagueStore();

  const league = useMemo(() => getById(id), [getById, id]);

  if (!hydrated) {
    return (
      <AppShell>
        <p className="text-zinc-400">Loading…</p>
      </AppShell>
    );
  }

  if (!league) {
    return (
      <AppShell title="League not found">
        <p className="text-zinc-400">This draft may have been deleted.</p>
        <Link href="/" className="mt-4 inline-block text-orange-400 hover:underline">
          Back to home
        </Link>
      </AppShell>
    );
  }

  function handleDelete() {
    const current = getById(id);
    if (!current) return;
    if (
      confirm(
        `Delete "${current.name}"? This cannot be undone and clears all picks and scores.`,
      )
    ) {
      removeLeague(current.id);
      router.push("/");
    }
  }

  return (
    <AppShell
      title={league.name}
      subtitle={`${league.seasonLabel} · ${league.managers.length} managers · ${league.rosterSize} picks each · Snake draft`}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <Link href="/" className="text-zinc-400 hover:text-white">
          ← All drafts
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="text-zinc-500 hover:text-rose-400"
        >
          Delete league
        </button>
      </div>

      <LeagueTabs
        league={league}
        onUpdate={(updated) => updateLeague(updated)}
      />
    </AppShell>
  );
}
