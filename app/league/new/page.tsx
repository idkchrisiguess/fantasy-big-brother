"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CastImport } from "@/components/cast-import";
import { useLeagueStore } from "@/components/providers/league-store";
import { createDefaultHouseguests } from "@/lib/houseguests";
import type { Houseguest } from "@/lib/types";

export default function NewLeaguePage() {
  const router = useRouter();
  const { createNewLeague } = useLeagueStore();
  const [name, setName] = useState("");
  const [seasonLabel, setSeasonLabel] = useState("Season 27");
  const [managersText, setManagersText] = useState("");
  const [rosterSize, setRosterSize] = useState(3);
  const [houseguests, setHouseguests] = useState<Houseguest[]>(() =>
    createDefaultHouseguests(),
  );
  const [castErrors, setCastErrors] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleCastChange = useCallback(
    (pool: Houseguest[], errors: string[]) => {
      setCastErrors(errors);
      if (errors.length === 0) {
        setHouseguests(pool);
      }
    },
    [],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const managerNames = managersText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!name.trim()) {
      setError("Give your league a name.");
      return;
    }
    if (managerNames.length < 2) {
      setError("Add at least two managers (comma or newline separated).");
      return;
    }
    if (castErrors.length > 0) {
      setError("Fix the cast import errors before creating the league.");
      return;
    }

    const league = createNewLeague({
      name,
      seasonLabel,
      managerNames,
      rosterSize,
      houseguests,
    });
    router.push(`/league/${league.id}`);
  }

  return (
    <AppShell
      title="New fantasy draft"
      subtitle="Set up managers, import your season cast, and choose roster size."
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-lg space-y-5 rounded-2xl border border-white/10 bg-[#121a2e] p-6"
      >
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">League name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sunday Night BB League"
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-white placeholder:text-zinc-600"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-300">Season label</span>
          <input
            value={seasonLabel}
            onChange={(e) => setSeasonLabel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-white"
          />
        </label>

        <CastImport value={houseguests} onChange={handleCastChange} />

        <label className="block">
          <span className="text-sm font-medium text-zinc-300">
            Managers (comma or one per line)
          </span>
          <textarea
            required
            rows={5}
            value={managersText}
            onChange={(e) => setManagersText(e.target.value)}
            placeholder={"Chris\nJordan\nSam\nTaylor"}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-white placeholder:text-zinc-600"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-300">
            Picks per manager
          </span>
          <select
            value={rosterSize}
            onChange={(e) => setRosterSize(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-white"
          >
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} houseguests
              </option>
            ))}
          </select>
        </label>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={castErrors.length > 0}
            className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create & start draft
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </form>
    </AppShell>
  );
}
