import type { ManagerStanding } from "@/lib/types";

export function StandingsTable({ standings }: { standings: ManagerStanding[] }) {
  if (standings.length === 0) {
    return (
      <p className="text-sm text-zinc-400">Add managers and complete the draft to see rankings.</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wide text-zinc-400">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Manager</th>
            <th className="px-4 py-3">Roster</th>
            <th className="px-4 py-3 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr
              key={row.managerId}
              className="border-t border-white/5 hover:bg-white/[0.03]"
            >
              <td className="px-4 py-3 font-mono text-zinc-400">#{row.rank}</td>
              <td className="px-4 py-3 font-semibold text-white">
                {row.managerName}
                {row.rank === 1 ? (
                  <span className="ml-2 text-xs font-normal text-orange-400">
                    HOH
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-zinc-300">
                {row.roster.length === 0 ? (
                  <span className="text-zinc-500">No picks yet</span>
                ) : (
                  <ul className="space-y-1">
                    {row.roster.map(({ houseguest, points }) => (
                      <li key={houseguest.id} className="flex justify-between gap-4">
                        <span>
                          {houseguest.name}
                          {houseguest.status === "evicted" ? (
                            <span className="ml-1 text-xs text-zinc-500">
                              (out w{houseguest.evictionWeek})
                            </span>
                          ) : null}
                        </span>
                        <span className="font-mono text-zinc-400">+{points}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="px-4 py-3 text-right font-mono text-lg font-semibold text-orange-300">
                {row.totalPoints}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
