"use client";

import { MapPin, Question, ShieldCheck, TreeStructure } from "@phosphor-icons/react";
import { Chip } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface NodeTreeItem {
  id: number;
  label: string;
  badge?: string;
  status: "active" | "locked";
  detail: string;
}

const NODES_DATA: NodeTreeItem[] = [
  {
    id: 1,
    label: "Cake Farm",
    badge: "Last Found at",
    status: "active",
    detail: "Mavelli spotted near Cake Farm courtyard · Sighting 01",
  },
  {
    id: 2,
    label: "???",
    status: "locked",
    detail: "Encrypted campus coordinate · Sighting 02",
  },
  {
    id: 3,
    label: "???",
    status: "locked",
    detail: "Encrypted campus coordinate · Sighting 03",
  },
  {
    id: 4,
    label: "???",
    status: "locked",
    detail: "Encrypted campus coordinate · Sighting 04",
  },
  {
    id: 5,
    label: "???",
    status: "locked",
    detail: "Encrypted campus coordinate · Sighting 05",
  },
  {
    id: 6,
    label: "???",
    status: "locked",
    detail: "Emergency Signal Frequency · SOS Stage",
  },
  {
    id: 7,
    label: "???",
    status: "locked",
    detail: "Final Sanctuary Gateway · Recovery Stage",
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
        "rounded-2xl border border-line bg-surface/90 p-5 sm:p-6 backdrop-blur-md",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-line-2 bg-ink-3 text-leaf">
            <TreeStructure size={20} weight="bold" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-mist">
              {title}
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fog">
              {subtitle}
            </p>
          </div>
        </div>
        <Chip tone="leaf">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-leaf" />
          1 / 7 Discovered
        </Chip>
      </div>

      {/* 7-Node Tree Spine */}
      <div className="relative mt-6">
        {/* Continuous tree trunk rail */}
        <div
          className="absolute bottom-6 left-5 top-5 w-[2px] bg-line-2"
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
                      {/* Pulsing beacon glow on current node indicator */}
                      <span className="anim-blink absolute inset-0 rounded-full border-2 border-leaf/70 bg-leaf/20" />
                      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-leaf font-bold text-[#03150a] shadow-lg shadow-leaf/30">
                        <MapPin size={18} weight="fill" />
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line-2 bg-ink-3 font-mono text-sm font-semibold text-moss transition-colors">
                        <Question size={16} weight="bold" />
                      </span>
                    </div>
                  )}
                </div>

                {/* Node details card */}
                <div
                  className={cn(
                    "min-w-0 flex-1 rounded-xl border p-3.5 transition-all",
                    isFirst
                      ? "border-leaf/50 bg-leaf/5 shadow-[0_0_20px_rgba(62,165,56,0.08)]"
                      : "border-line/70 bg-ink-3/60 opacity-70",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-moss">
                      NODE 0{node.id}
                    </span>

                    {/* Static 'Last Found at' badge on Node 1 */}
                    {node.badge && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-leaf/60 bg-leaf/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-leaf">
                        <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
                        {node.badge}
                      </span>
                    )}

                    {!isFirst && (
                      <span className="rounded-full border border-line-2 bg-surface px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-moss">
                        LOCKED
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <h3
                      className={cn(
                        "text-base font-bold tracking-tight",
                        isFirst ? "text-mist" : "font-mono tracking-widest text-fog",
                      )}
                    >
                      {node.label}
                    </h3>

                    {isFirst && (
                      <span className="shrink-0 font-mono text-[11px] font-semibold text-leaf">
                        ACTIVE TARGET
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs leading-relaxed text-fog">
                    {node.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-line bg-ink-2 px-3.5 py-2.5 text-xs text-fog">
        <ShieldCheck size={18} className="shrink-0 text-leaf" weight="fill" />
        <span>
          Solve each sighting landmark on campus to decrypt subsequent nodes on the tree.
        </span>
      </div>
    </div>
  );
}
