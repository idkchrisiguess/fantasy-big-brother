"use client";

import { LeagueStoreProvider } from "@/components/providers/league-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <LeagueStoreProvider>{children}</LeagueStoreProvider>;
}
