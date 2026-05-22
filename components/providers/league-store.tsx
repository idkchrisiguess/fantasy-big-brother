"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { createLeague } from "@/lib/league";
import {
  deleteRemoteLeague,
  isSupabaseConfigured,
  pushLeague,
  syncLeagues,
  withUpdatedAt,
  type SyncStatus,
} from "@/lib/sync";
import {
  deleteLeague,
  loadLeagues,
  saveLeagues,
  upsertLeague,
} from "@/lib/storage";
import type { Houseguest, League, LeagueId } from "@/lib/types";

interface LeagueStoreValue {
  leagues: League[];
  hydrated: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  resync: () => Promise<void>;
  createNewLeague: (input: {
    name: string;
    seasonLabel: string;
    managerNames: string[];
    rosterSize?: number;
    houseguests?: Houseguest[];
  }) => League;
  updateLeague: (league: League) => void;
  removeLeague: (id: LeagueId) => void;
  getById: (id: LeagueId) => League | undefined;
}

const LeagueStoreContext = createContext<LeagueStoreValue | null>(null);

const listeners = new Set<() => void>();

const EMPTY_LEAGUES: League[] = [];

let leaguesSnapshot: League[] = EMPTY_LEAGUES;
let syncStatusSnapshot: SyncStatus = isSupabaseConfigured()
  ? "syncing"
  : "local-only";
let syncErrorSnapshot: string | null = null;
let initialSyncDone = false;

if (typeof window !== "undefined") {
  leaguesSnapshot = loadLeagues();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((listener) => listener());
}

function getClientSnapshot(): League[] {
  return leaguesSnapshot;
}

function getServerSnapshot(): League[] {
  return EMPTY_LEAGUES;
}

function getSyncStatusSnapshot(): SyncStatus {
  return syncStatusSnapshot;
}

function getSyncStatusServerSnapshot(): SyncStatus {
  return "local-only";
}

function getSyncErrorSnapshot(): string | null {
  return syncErrorSnapshot;
}

function getSyncErrorServerSnapshot(): string | null {
  return null;
}

function getHydratedSnapshot(): boolean {
  return true;
}

function getHydratedServerSnapshot(): boolean {
  return false;
}

function setSyncState(status: SyncStatus, error: string | null = null) {
  syncStatusSnapshot = status;
  syncErrorSnapshot = error;
  emit();
}

function setLeaguesSnapshot(leagues: League[], persist = true) {
  leaguesSnapshot = leagues;
  if (persist) saveLeagues(leagues);
  emit();
}

async function runSync(local: League[]): Promise<League[]> {
  if (!isSupabaseConfigured()) {
    setSyncState("local-only", null);
    return local;
  }

  setSyncState("syncing", null);
  const { merged, error } = await syncLeagues(local);

  if (error) {
    setSyncState("error", error);
  } else {
    setSyncState("synced", null);
  }

  return merged;
}

export function LeagueStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const leagues = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribe,
    getHydratedSnapshot,
    getHydratedServerSnapshot,
  );
  const syncStatus = useSyncExternalStore(
    subscribe,
    getSyncStatusSnapshot,
    getSyncStatusServerSnapshot,
  );
  const syncError = useSyncExternalStore(
    subscribe,
    getSyncErrorSnapshot,
    getSyncErrorServerSnapshot,
  );

  useEffect(() => {
    if (initialSyncDone) return;
    initialSyncDone = true;

    void (async () => {
      const local = loadLeagues();
      const merged = await runSync(local);
      if (merged !== local) {
        setLeaguesSnapshot(merged);
      }
    })();
  }, []);

  const resync = useCallback(async () => {
    const merged = await runSync(loadLeagues());
    setLeaguesSnapshot(merged);
  }, []);

  const persistLeague = useCallback(async (league: League) => {
    const stamped = withUpdatedAt(league);
    setLeaguesSnapshot(upsertLeague(loadLeagues(), stamped));

    if (!isSupabaseConfigured()) return;

    try {
      await pushLeague(stamped);
      setSyncState("synced", null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      setSyncState("error", message);
    }
  }, []);

  const updateLeague = useCallback(
    (league: League) => {
      void persistLeague(league);
    },
    [persistLeague],
  );

  const removeLeague = useCallback((id: LeagueId) => {
    setLeaguesSnapshot(deleteLeague(loadLeagues(), id));

    if (!isSupabaseConfigured()) return;

    void (async () => {
      try {
        await deleteRemoteLeague(id);
        setSyncState("synced", null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sync failed";
        setSyncState("error", message);
      }
    })();
  }, []);

  const createNewLeague = useCallback(
    (input: {
      name: string;
      seasonLabel: string;
      managerNames: string[];
      rosterSize?: number;
      houseguests?: Houseguest[];
    }) => {
      const league = createLeague(input);
      void persistLeague(league);
      return league;
    },
    [persistLeague],
  );

  const getById = useCallback(
    (id: LeagueId) => leagues.find((l) => l.id === id),
    [leagues],
  );

  const value = useMemo(
    () => ({
      leagues,
      hydrated,
      syncStatus,
      syncError,
      resync,
      createNewLeague,
      updateLeague,
      removeLeague,
      getById,
    }),
    [
      leagues,
      hydrated,
      syncStatus,
      syncError,
      resync,
      createNewLeague,
      updateLeague,
      removeLeague,
      getById,
    ],
  );

  return (
    <LeagueStoreContext.Provider value={value}>
      {children}
    </LeagueStoreContext.Provider>
  );
}

export function useLeagueStore() {
  const ctx = useContext(LeagueStoreContext);
  if (!ctx) {
    throw new Error("useLeagueStore must be used within LeagueStoreProvider");
  }
  return ctx;
}
