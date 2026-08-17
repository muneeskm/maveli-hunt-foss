"use client";

import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Broadcast,
  Phone,
  SignOut,
  Trophy,
  WhatsappLogo,
  X,
} from "@phosphor-icons/react";
import { PhasePill, Panel } from "@/components/ui";
import { store } from "@/lib/store";
import type { Broadcast as BroadcastType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  phase,
  teamName,
  teamId,
  broadcasts,
  settings,
}: {
  children: ReactNode;
  phase: ReturnType<typeof store.game>["phase"];
  teamName?: string;
  teamId?: string;
  broadcasts: BroadcastType[];
  settings: ReturnType<typeof store.settings>;
}) {
  const router = useRouter();
  const [contactOpen, setContactOpen] = useState(false);

  const visible = useMemo(() => {
    return broadcasts
      .filter((b) => {
        if (b.audience === "team") return !!teamId && b.teamId === teamId;
        if (b.audience === "day1") return phase === "day1" || phase === "night";
        if (b.audience === "day2") return phase === "day2" || phase === "rescued";
        return true;
      })
      .slice(-1);
  }, [broadcasts, phase, teamId]);

  const tel = settings.volunteerPhone.replace(/[^+\d]/g, "");

  return (
    <div className="min-h-[100dvh] bg-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
          <PhasePill phase={phase} />
          <div className="flex items-center gap-1.5">
            <Link
              href="/leaderboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-fog hover:text-mist"
              aria-label="Leaderboard"
            >
              <Trophy size={20} />
            </Link>
            {teamId && (
              <button
                type="button"
                onClick={() => {
                  store.logout();
                  router.replace("/");
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-fog hover:text-mist"
                aria-label="Leave team"
              >
                <SignOut size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      {visible.length > 0 && (
        <div className="sticky top-[57px] z-30 border-b border-leaf/30 bg-ink-3">
          <div className="mx-auto flex max-w-md items-start gap-2 px-4 py-2.5">
            <Broadcast size={16} className="mt-0.5 shrink-0 text-leaf" />
            <p className="text-sm text-mist">{visible[0].message}</p>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-md px-4 pb-32 pt-5">{children}</main>

      {teamId && (
        <div className="pointer-events-none fixed inset-0 z-50">
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            aria-label="Contact volunteers"
            className="pointer-events-auto absolute bottom-5 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-leaf text-white shadow-xl shadow-leaf/25 active:scale-95 transition-transform"
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          >
            <Phone size={24} weight="fill" className="text-white" />
          </button>
        </div>
      )}

      {contactOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70"
          onClick={() => setContactOpen(false)}
        >
          <Panel
            className={cn(
              "w-full max-w-md rounded-b-none p-5",
              "animate-[mh-rise_0.3s_ease-out]",
            )}
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-mist">
                Stuck? Call a volunteer
              </h2>
              <button
                type="button"
                onClick={() => setContactOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-fog hover:text-mist"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mb-4 text-sm text-fog">
              A volunteer will guide you without giving the answer away.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`tel:${tel}`}
                className="btn flex items-center justify-center gap-2 rounded-xl bg-leaf py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-leaf-dim active:scale-98"
              >
                <Phone size={18} weight="fill" className="text-white" />
                <span className="text-white">Call</span>
              </a>
              <a
                href={settings.volunteerWhatsapp}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost flex items-center justify-center gap-2"
              >
                <WhatsappLogo size={18} weight="fill" className="text-leaf" /> WhatsApp
              </a>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
