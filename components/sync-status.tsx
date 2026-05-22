"use client";

import { useLeagueStore } from "@/components/providers/league-store";
import { isSupabaseConfigured } from "@/lib/sync";

const STATUS_COPY = {
  "local-only": {
    label: "Local only",
    className: "bg-zinc-500/20 text-zinc-400",
    title: "Cloud sync is off. Add Supabase env vars to sync across devices.",
  },
  syncing: {
    label: "Syncing…",
    className: "bg-blue-500/20 text-blue-200",
    title: "Syncing leagues with cloud storage.",
  },
  synced: {
    label: "Synced",
    className: "bg-emerald-500/20 text-emerald-300",
    title: "Leagues are synced with Supabase.",
  },
  error: {
    label: "Sync error",
    className: "bg-rose-500/20 text-rose-300",
    title: "Could not sync. Changes are saved locally.",
  },
} as const;

export function SyncStatus() {
  const { syncStatus, syncError, resync } = useLeagueStore();
  const copy = STATUS_COPY[syncStatus];

  if (!isSupabaseConfigured() && syncStatus === "local-only") {
    return (
      <span
        className="rounded-full px-2.5 py-1 text-xs font-medium bg-zinc-500/20 text-zinc-400"
        title={copy.title}
      >
        Local only
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${copy.className}`}
        title={syncError ?? copy.title}
      >
        {copy.label}
      </span>
      {syncStatus === "error" ? (
        <button
          type="button"
          onClick={() => void resync()}
          className="text-xs text-zinc-400 underline hover:text-white"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
