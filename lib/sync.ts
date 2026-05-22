import { getSupabaseClient, isSupabaseConfigured } from "./supabase/client";
import type { League, LeagueId } from "./types";

export type SyncStatus = "local-only" | "syncing" | "synced" | "error";

export function getLeagueUpdatedAt(league: League): string {
  return league.updatedAt ?? league.createdAt;
}

export function withUpdatedAt(league: League): League {
  return { ...league, updatedAt: new Date().toISOString() };
}

export function mergeLeagues(local: League[], remote: League[]): League[] {
  const byId = new Map<LeagueId, League>();

  for (const league of local) {
    byId.set(league.id, league);
  }

  for (const remoteLeague of remote) {
    const existing = byId.get(remoteLeague.id);
    if (!existing) {
      byId.set(remoteLeague.id, remoteLeague);
      continue;
    }
    const localTime = new Date(getLeagueUpdatedAt(existing)).getTime();
    const remoteTime = new Date(getLeagueUpdatedAt(remoteLeague)).getTime();
    byId.set(
      remoteLeague.id,
      remoteTime >= localTime ? remoteLeague : existing,
    );
  }

  return [...byId.values()];
}

interface LeagueRow {
  id: string;
  data: League;
  updated_at: string;
}

function leagueFromRow(row: LeagueRow): League {
  const league = row.data;
  return {
    ...league,
    updatedAt: league.updatedAt ?? row.updated_at,
  };
}

export async function fetchRemoteLeagues(): Promise<League[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("leagues")
    .select("id, data, updated_at");

  if (error) throw error;
  return (data as LeagueRow[] | null)?.map(leagueFromRow) ?? [];
}

export async function pushLeague(league: League): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client.from("leagues").upsert({
    id: league.id,
    data: league,
    updated_at: getLeagueUpdatedAt(league),
  });

  if (error) throw error;
}

export async function deleteRemoteLeague(id: LeagueId): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client.from("leagues").delete().eq("id", id);
  if (error) throw error;
}

/** Pull remote leagues, merge with local, and push any local-only or newer copies. */
export async function syncLeagues(local: League[]): Promise<{
  merged: League[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { merged: local };
  }

  try {
    const remote = await fetchRemoteLeagues();
    const merged = mergeLeagues(local, remote);

    const remoteById = new Map(remote.map((l) => [l.id, l]));
    await Promise.all(
      merged.map(async (league) => {
        const remoteCopy = remoteById.get(league.id);
        const localCopy = local.find((l) => l.id === league.id);
        const mergedTime = new Date(getLeagueUpdatedAt(league)).getTime();
        const remoteTime = remoteCopy
          ? new Date(getLeagueUpdatedAt(remoteCopy)).getTime()
          : 0;
        const localTime = localCopy
          ? new Date(getLeagueUpdatedAt(localCopy)).getTime()
          : mergedTime;

        if (!remoteCopy || mergedTime > remoteTime || localTime > remoteTime) {
          await pushLeague(league);
        }
      }),
    );

    return { merged };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return { merged: local, error: message };
  }
}

export { isSupabaseConfigured };
