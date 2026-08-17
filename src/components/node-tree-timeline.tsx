"use client";

import {
  MapPin,
  Question,
  ShieldCheck,
  TreeStructure,
} from "@phosphor-icons/react";
import { Chip, Panel, TaglineBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface NodeItem {
  id: number;
  label: string;
  badge?: string;
  detail: string;
}

const NODES_DATA: NodeItem[] = [
  {
    id: 1,
    label: "Cake Farm Cafe",
    badge: "Last Found at",
    detail: "Maveli was spotted near the food stall courtyard at Christ College of Engineering.",
  },
  {
    id: 2,
    label: "???",
    detail: "Location encrypted. Solve Node 01 to reveal the trail.",
  },
  {
    id: 3,
    label: "???",
    detail: "Location encrypted. Unlocks after previous checkpoint.",
  },
  {
    id: 4,
    label: "???",
    detail: "Location encrypted. Unlocks after previous checkpoint.",
  },
  {
    id: 5,
    label: "???",
    detail: "Location encrypted. Unlocks after previous checkpoint.",
  },
  {
    id: 6,
    label: "???",
    detail: "Emergency Transmission site. Unlocks on Day 2.",
  },
  {
    id: 7,
    label: "???",
    detail: "Final Sanctuary. Reconstruct all 5 words to rescue Maveli.",
  },
];

export function NodeTreeTimeline({
  className,
  title = "Investigation Node Tree",
  subtitle = "7-Node Trail Sequence",
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
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#ffe95c] text-[#1a3300] border border-[rgba(26,51,0,0.15)]">
            <TreeStructure size={20} weight="bold" />
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
        <Chip tone="yellow">
          1 / 7 Discovered
        </Chip>
      </div>

      {/* 7-Node Tree Spine */}
      <div className="relative mt-6">
        {/* Continuous tree trunk rail */}
        <div
          className="absolute bottom-6 left-5 top-5 w-[2px] bg-[#1a3300]/30"
          aria-hidden="true"
        />

        <div className="space-y-4">
          {NODES_DATA.map((node) => {
            const isFirst = node.id === 1;

            return (
              <div key={node.id} className="relative flex items-start gap-4">
                {/* Node icon / beacon */}
                <div className="relative z-10 flex shrink-0 items-center justify-center">
                  {isFirst ? (
                    <div className="relative flex h-10 w-10 items-center justify-center">
                      <span className="anim-blink absolute inset-0 rounded-full bg-[#ffe95c]/60" />
                      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#1a3300] text-[#fcfaf5] shadow-sm">
                        <MapPin size={16} weight="fill" />
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#b6b6b6] bg-[#fcfaf5] font-mono text-xs text-[#888888]">
                        <Question size={14} weight="bold" />
                      </span>
                    </div>
                  )}
                </div>

                {/* Node details card */}
                <div
                  className={cn(
                    "min-w-0 flex-1 rounded-[12px] border p-3.5 transition-all",
                    isFirst
                      ? "border-[rgba(26,51,0,0.2)] bg-[#d5f5c2]/40"
                      : "border-[#b6b6b6]/60 bg-[#fcfaf5] opacity-75",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#1a3300]/80">
                      NODE 0{node.id}
                    </span>

                    {/* Static 'Last Found at' badge on Node 1 */}
                    {node.badge && (
                      <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#ffe95c] px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider text-[#1a3300]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1a3300]" />
                        {node.badge}
                      </span>
                    )}

                    {!isFirst && (
                      <span className="rounded-full border border-[#b6b6b6] bg-white px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#888888]">
                        LOCKED
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <h3
                      className={cn(
                        "text-sm font-bold text-[#1a3300]",
                        !isFirst && "font-mono tracking-widest text-[#777777]",
                      )}
                    >
                      {node.label}
                    </h3>

                    {isFirst && (
                      <span className="shrink-0 font-sans text-xs font-semibold text-[#1a3300]">
                        Active Target
                      </span>
                    )}
                  </div>

                  <p className="mt-1 font-sans text-xs leading-relaxed text-[#555555]">
                    {node.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-6 flex items-center gap-2.5 rounded-[8px] border border-[#b6b6b6]/60 bg-[#fcfaf5] p-3 text-xs text-[#555555]">
        <ShieldCheck size={18} className="shrink-0 text-[#1a3300]" weight="fill" />
        <span>
          Solve each sighting landmark on campus to decrypt subsequent nodes on the tree.
        </span>
      </div>
    </div>
  );
}
