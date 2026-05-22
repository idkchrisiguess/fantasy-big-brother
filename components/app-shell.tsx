import { SyncStatus } from "@/components/sync-status";
import Link from "next/link";

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-full bg-[#0b1020] text-zinc-100">
      <header className="border-b border-white/10 bg-[#0f1629]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-lg font-bold shadow-lg shadow-orange-900/30">
              FBB
            </span>
            <div>
              <p className="text-sm font-semibold tracking-wide text-white group-hover:text-orange-200">
                Fantasy Big Brother
              </p>
              <p className="text-xs text-zinc-400">Draft · Score · Rank</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <SyncStatus />
            <Link
              href="/league/new"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              New draft
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {title ? (
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-zinc-400">{subtitle}</p>
            ) : null}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
