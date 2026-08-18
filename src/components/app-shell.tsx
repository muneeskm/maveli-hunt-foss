"use client";

import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Broadcast,
  Phone,
  WhatsappLogo,
  X,
} from "@phosphor-icons/react";
import { PhasePill, Panel, Btn } from "@/components/ui";
import { filterBroadcastsForTeam } from "@/lib/game";
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
    return filterBroadcastsForTeam(broadcasts, phase, teamId).slice(-1);
  }, [broadcasts, phase, teamId]);

  const tel = settings.volunteerPhone.replace(/[^+\d]/g, "");

  return (
    <div className="relative min-h-screen bg-[#020712] text-white overflow-x-hidden">
      {/* Pixel Art Mobile Background Layer (Hardware Composited) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mobile-bg.png"
        alt=""
        aria-hidden="true"
        className="bg-mobile-layer"
      />

      <div className="relative z-10">
        {/* Floating Pill Top Nav */}
        <header className="sticky top-3 z-40 mx-auto max-w-xl px-4">
          <div className="liquid-glass-subtle flex items-center justify-between gap-2 px-3.5 py-2.5">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              {/* Logo square */}
              <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[8px] bg-white/10 border border-white/20 overflow-hidden shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/maveli-logo.png"
                  alt="Maveli"
                  className="h-[28px] w-[28px] object-cover"
                />
              </div>
              <span className="font-sans text-xs sm:text-sm font-bold tracking-tight text-white drop-shadow-sm">
                The Maveli Files
              </span>
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <PhasePill phase={phase} />

              {teamId && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Leave current squad session?")) {
                      store.logout();
                      router.replace("/");
                    }
                  }}
                  className="flex h-[26px] shrink-0 items-center rounded-[8px] border border-white/15 bg-white/5 px-2.5 font-sans text-xs font-medium text-white hover:bg-red-950/60 hover:text-red-400 hover:border-red-800 transition-colors backdrop-blur-md"
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        </header>

        {visible.length > 0 && (
          <div className="mx-auto mt-4 max-w-xl px-4">
            <div className="liquid-glass-subtle flex items-center gap-2.5 px-4 py-2.5 text-xs text-white">
              <Broadcast size={16} weight="bold" className="shrink-0 text-[#22c55e]" />
              <p className="truncate font-sans font-medium">{visible[0].message}</p>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-xl px-4 pb-32 pt-5">{children}</main>
      </div>

      {/* Floating Volunteer Call Button */}
      {teamId && (
        <div className="hidden pointer-events-none fixed inset-0 z-50">
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            aria-label="Contact volunteers"
            className="pointer-events-auto absolute bottom-5 right-4 flex h-13 w-13 items-center justify-center rounded-full bg-[#22c55e] text-[#090d0b] shadow-lg hover:opacity-90 active:scale-95 transition-all"
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          >
            <Phone size={22} weight="fill" />
          </button>
        </div>
      )}

      {/* Contact Modal */}
      {contactOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setContactOpen(false)}
        >
          <Panel
            tone="paper"
            className="w-full max-w-md rounded-[16px] p-6 shadow-xl anim-rise bg-[#111813] border border-[#202d24]"
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between border-b border-[#202d24] pb-3">
              <h2 className="font-sans text-base font-bold text-white">
                Need guidance? Contact a volunteer
              </h2>
              <button
                type="button"
                onClick={() => setContactOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#9ca3af] hover:bg-white/10"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mb-5 font-sans text-sm text-[#9ca3af]">
              A student volunteer will assist your squad without giving the secret away.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`tel:${tel}`}
                className="btn btn-primary flex items-center justify-center gap-2 py-3 text-sm"
              >
                <Phone size={16} weight="fill" />
                <span>Call Now</span>
              </a>
              <a
                href={settings.volunteerWhatsapp}
                target="_blank"
                rel="noreferrer"
                className="btn btn-mint flex items-center justify-center gap-2 py-3 text-sm"
              >
                <WhatsappLogo size={18} weight="fill" /> WhatsApp
              </a>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
