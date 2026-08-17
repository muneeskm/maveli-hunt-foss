"use client";

import {
  MapPin,
  Question,
  TreeStructure,
} from "@phosphor-icons/react";
import { Chip } from "@/components/ui";
import { cn } from "@/lib/utils";

export function NodeTreeTimeline({
  className,
  title = "Investigation Trail",
  subtitle = "First Sighting: Cake Farm",
}: {
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div
      className={cn(
        "panel rounded-[16px] border border-[#b6b6b6] bg-white p-5 sm:p-6 shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#b6b6b6]/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#ffe95c] text-[#1a3300] border border-[rgba(26,51,0,0.15)]">
            <TreeStructure size={22} weight="bold" />
          </div>
          <div>
            <h2 className="font-display text-lg text-[#1a3300]">
              {title}
            </h2>
            <p className="font-sans text-xs text-[#666666]">
              {subtitle}
            </p>
          </div>
        </div>
        <Chip tone="yellow" className="shrink-0">
          1 / 7 Discovered
        </Chip>
      </div>

      {/* Node Tree Spine (Showing Node 1 and partial Node 2) */}
      <div className="relative mt-6">
        {/* Continuous tree trunk rail */}
        <div
          className="absolute bottom-4 left-4 sm:left-5 top-5 w-[2px] bg-[#1a3300]/25"
          aria-hidden="true"
        />

        <div className="space-y-4">
          {/* Node 1: Cake Farm Cafe (Active Target) */}
          <div className="relative flex items-start gap-3.5 sm:gap-4">
            {/* Node 1 Beacon - Fully Black */}
            <div className="relative z-10 flex shrink-0 items-center justify-center">
              <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center">
                <span className="anim-blink absolute inset-0 rounded-full bg-[#ffe95c]" />
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-black bg-white text-black shadow-md">
                  <MapPin size={18} weight="fill" className="shrink-0 text-black" />
                </span>
              </div>
            </div>

            {/* Node 1 Details Card */}
            <div className="min-w-0 flex-1 rounded-[12px] border border-[rgba(26,51,0,0.2)] bg-[#d5f5c2]/40 p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#1a3300]/80">
                    NODE 01
                  </span>

                  {/* Static 'Last Found at' badge */}
                  <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#ffe95c] px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider text-[#1a3300]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1a3300]" />
                    Last Found at
                  </span>
                </div>
                <span className="shrink-0 font-sans text-xs font-semibold text-[#1a3300]">
                  Active Target
                </span>
              </div>

              <div className="mt-1.5">
                <h3 className="text-sm font-bold text-[#1a3300]">
                  Cake Farm Cafe
                </h3>
              </div>

              <p className="mt-1 font-sans text-xs leading-relaxed text-[#555555]">
                Maveli was spotted near the food stall courtyard at Christ College of Engineering.
              </p>
            </div>
          </div>

          {/* Node 2: Partial / Peek View */}
          <div className="relative flex items-start gap-3.5 sm:gap-4 overflow-hidden max-h-16 opacity-70">
            {/* Fade overlay over Node 2 */}
            <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-b from-transparent via-white/60 to-white" />

            {/* Node 2 Icon */}
            <div className="relative z-10 flex shrink-0 items-center justify-center">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#b6b6b6] bg-[#fcfaf5] text-[#777777]">
                  <Question size={15} weight="bold" className="shrink-0" />
                </span>
              </div>
            </div>

            {/* Node 2 Peek Card */}
            <div className="min-w-0 flex-1 rounded-[12px] border border-[#b6b6b6]/60 bg-[#fcfaf5] p-3.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#1a3300]/70">
                  NODE 02
                </span>
                <span className="rounded-full border border-[#b6b6b6] bg-white px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#888888]">
                  LOCKED
                </span>
              </div>
              <h3 className="mt-1 font-mono text-sm tracking-widest text-[#777777]">
                ???
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Card footer notice */}
      <div className="mt-4 flex items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#b6b6b6] bg-[#fcfaf5] px-4 py-3 text-center">
        <span className="font-sans text-xs font-semibold text-[#1a3300]">
          More to be unlocked once the event starts :)
        </span>
      </div>
    </div>
  );
}
