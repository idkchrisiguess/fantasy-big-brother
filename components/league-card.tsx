import Link from "next/link";
import { buildStandings } from "@/lib/scoring";
import type { League } from "@/lib/types";

export function LeagueCard({ league }: { league: League }) {
  const standings = buildStandings(league);
  const leader = standings[0];
  const pickCount = league.picks.length;
  const totalPicks = league.managers.length * league.rosterSize;

  return (
    <Link
      href={`/league/${league.id}`}
      className="group block rounded-2xl border border-white/10 bg-[#121a2e] p-5 transition hover:border-orange-500/40 hover:bg-[#151f36]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white group-hover:text-orange-200">
            {league.name}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">{league.seasonLabel}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            league.draftComplete
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-amber-500/20 text-amber-300"
          }`}
        >
          {league.draftComplete ? "Live" : "Drafting"}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-lg bg-white/5 px-2 py-2">
          <dt className="text-zinc-500">Managers</dt>
          <dd className="font-semibold text-white">{league.managers.length}</dd>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-2">
          <dt className="text-zinc-500">Picks</dt>
          <dd className="font-semibold text-white">
            {pickCount}/{totalPicks}
          </dd>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-2">
          <dt className="text-zinc-500">Leader</dt>
          <dd className="truncate font-semibold text-orange-300">
            {leader ? `${leader.managerName}` : "—"}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
