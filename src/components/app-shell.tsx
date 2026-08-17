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
import { PhasePill, Panel, Btn } from "@/components/ui";
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
    <div className="min-h-[100dvh] bg-[#fcfaf5]">
      {/* Floating Pill Top Nav */}
      <header className="sticky top-3 z-40 mx-auto max-w-xl px-4">
        <div className="flex items-center justify-between gap-2 rounded-[16px] border border-[#b6b6b6] bg-[#fcfaf5]/95 px-3.5 py-2.5 backdrop-blur-md shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
          <Link href="/" className="flex items-center gap-2.5">
            {/* 36x36 Highlighter Yellow logo square */}
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#ffe95c] border border-[rgba(26,51,0,0.15)] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/maveli-logo.png"
                alt="Maveli"
                className="h-7 w-7 object-cover"
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-sans text-sm font-bold tracking-tight text-[#1a3300]">
                The Maveli Files
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <PhasePill phase={phase} />

            <Link
              href="/leaderboard"
              className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#b6b6b6] bg-white text-[#1a3300] hover:bg-[#f1f1f1] transition-colors"
              aria-label="Leaderboard"
            >
              <Trophy size={16} weight="bold" />
            </Link>

            {teamId && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Leave current squad session?")) {
                    store.logout();
                    router.replace("/");
                  }
                }}
                className="flex h-8 items-center gap-1 rounded-[6px] border border-[#b6b6b6] bg-white px-2.5 font-sans text-xs font-medium text-[#1a3300] hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                aria-label="Leave team"
              >
                <SignOut size={14} />
                <span className="hidden sm:inline">Leave</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {visible.length > 0 && (
        <div className="mx-auto mt-4 max-w-xl px-4">
          <div className="flex items-center gap-2.5 rounded-[10px] border border-[#a8e5e5] bg-[#a8e5e5]/30 px-4 py-2.5 text-xs text-[#1a3300]">
            <Broadcast size={16} weight="bold" className="shrink-0 text-[#1a3300]" />
            <p className="truncate font-sans font-medium">{visible[0].message}</p>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-xl px-4 pb-32 pt-5">{children}</main>

      {/* Floating Volunteer Call Button */}
      {teamId && (
        <div className="pointer-events-none fixed inset-0 z-50">
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            aria-label="Contact volunteers"
            className="pointer-events-auto absolute bottom-5 right-4 flex h-13 w-13 items-center justify-center rounded-full bg-[#1a3300] text-[#fcfaf5] shadow-lg hover:opacity-90 active:scale-95 transition-all"
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          >
            <Phone size={22} weight="fill" />
          </button>
        </div>
      )}

      {/* Contact Modal */}
      {contactOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setContactOpen(false)}
        >
          <Panel
            tone="paper"
            className="w-full max-w-md rounded-[16px] p-6 shadow-xl anim-rise"
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between border-b border-[#b6b6b6] pb-3">
              <h2 className="font-sans text-base font-bold text-[#1a3300]">
                Need guidance? Contact a volunteer
              </h2>
              <button
                type="button"
                onClick={() => setContactOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#666666] hover:bg-black/5"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mb-5 font-sans text-sm text-[#555555]">
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
