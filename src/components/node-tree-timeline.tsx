"use client";

import { useMemo } from "react";
import {
  CheckCircle,
  Leaf,
  Lock,
  MapPin,
  Question,
  Radio,
  Sparkle,
  TreeStructure,
} from "@phosphor-icons/react";
import { Chip } from "@/components/ui";
import { useGame } from "@/hooks/use-game";
import { cn } from "@/lib/utils";

export type NodeStatus = "completed" | "active" | "locked";

export interface InvestigationNode {
  id: string;
  nodeNumber: string;
  kind: "sighting" | "sos" | "final";
  name: string;
  status: NodeStatus;
  detail?: string;
  recoveredWord?: string;
}

interface NodeTreeTimelineProps {
  className?: string;
  title?: string;
  subtitle?: string;
  mode?: "preview" | "active";
}

export function NodeTreeTimeline({
  className,
  title = "Investigation Trail",
  subtitle = "7-Node Campus Search Grid",
  mode = "preview",
}: NodeTreeTimelineProps) {
  const { team, game, locations, scans, answers, words, sessionPending } =
    useGame();

  const nodes = useMemo<InvestigationNode[]>(() => {
    if (mode === "preview" || !team) {
      // STATIC PREVIEW: Node 01 active waypoint, Nodes 02-07 locked teasers
      return [
        {
          id: "s1",
          nodeNumber: "01",
          kind: "sighting",
          name: "Cake Farm Cafe",
          status: "active",
          detail: "Initial sighting coordinate at Christ College of Engineering.",
        },
        {
          id: "s2",
          nodeNumber: "02",
          kind: "sighting",
          name: "Classified Waypoint",
          status: "locked",
        },
        {
          id: "s3",
          nodeNumber: "03",
          kind: "sighting",
          name: "Classified Waypoint",
          status: "locked",
        },
        {
          id: "s4",
          nodeNumber: "04",
          kind: "sighting",
          name: "Classified Waypoint",
          status: "locked",
        },
        {
          id: "s5",
          nodeNumber: "05",
          kind: "sighting",
          name: "Classified Waypoint",
          status: "locked",
        },
        {
          id: "sos",
          nodeNumber: "06",
          kind: "sos",
          name: "Emergency Frequency SOS",
          status: "locked",
        },
        {
          id: "fin",
          nodeNumber: "07",
          kind: "final",
          name: "Sanctuary Reconstruction Gate",
          status: "locked",
        },
      ];
    }

    // ACTIVE GAME: Computed dynamically from authoritative server state
    const sightings = locations
      .filter((l) => l.type === "sighting")
      .sort((a, b) => a.order - b.order);

    const teamScanned = new Set(
      scans.filter((s) => s.teamId === team.id).map((s) => s.locationId),
    );

    const sosScanned = teamScanned.has("sos");
    const finScanned = teamScanned.has("fin");
    const rescued = answers.some(
      (a) => a.teamId === team.id && a.kind === "reconstruction" && a.correct,
    );

    const result: InvestigationNode[] = [];

    // Sightings 01..05
    let currentFound = false;
    for (let i = 0; i < 5; i++) {
      const loc = sightings[i];
      const nodeNumber = `0${i + 1}`;
      const locId = loc?.id ?? `s${i + 1}`;
      const isDone = loc ? teamScanned.has(loc.id) : false;
      const word = words[locId]?.word;

      let status: NodeStatus = "locked";
      if (isDone) {
        status = "completed";
      } else if (!currentFound && game.phase === "day1") {
        status = "active";
        currentFound = true;
      }

      result.push({
        id: locId,
        nodeNumber,
        kind: "sighting",
        name: isDone
          ? loc?.name ?? `Sighting ${nodeNumber}`
          : status === "active"
            ? loc?.name ?? `Sighting ${nodeNumber}`
            : "Classified Waypoint",
        status,
        detail: isDone
          ? word
            ? `Evidence recovered: "${word}"`
            : "Sighting confirmed"
          : status === "active"
            ? loc?.clueText ?? "Locate the landmark and type the diff word."
            : undefined,
        recoveredWord: isDone ? word : undefined,
      });
    }

    // Node 06: SOS Transmission
    const allSightingsDone = sightings.every((s) => teamScanned.has(s.id));
    let sosStatus: NodeStatus = "locked";
    if (sosScanned) {
      sosStatus = "completed";
    } else if (
      !currentFound &&
      (game.phase === "day2" || (allSightingsDone && game.phase === "night"))
    ) {
      sosStatus = "active";
      currentFound = true;
    }

    result.push({
      id: "sos",
      nodeNumber: "06",
      kind: "sos",
      name: sosScanned ? "Emergency SOS Beacon" : "Classified Transmission",
      status: sosStatus,
      detail: sosScanned
        ? "Transmission payload received."
        : sosStatus === "active"
          ? "Scan the Maveli Emergency Broadcast poster."
          : undefined,
    });

    // Node 07: Final Gate Sanctuary
    let finStatus: NodeStatus = "locked";
    if (rescued) {
      finStatus = "completed";
    } else if (!currentFound && (finScanned || sosScanned)) {
      finStatus = "active";
      currentFound = true;
    }

    result.push({
      id: "fin",
      nodeNumber: "07",
      kind: "final",
      name: rescued
        ? "Sanctuary Reconstructed"
        : finScanned
          ? "Final Reconstruction Gate"
          : "Sanctuary Gate",
      status: finStatus,
      detail: rescued
        ? "Maveli is safe. All words verified in sequence."
        : finStatus === "active"
          ? "Reconstruct the five words in sequence to open the gate."
          : undefined,
    });

    return result;
  }, [mode, team, game, locations, scans, answers, words]);

  const completedCount = nodes.filter((n) => n.status === "completed").length;
  const activeNode = nodes.find((n) => n.status === "active");

  if (mode === "active" && sessionPending) {
    return (
      <div className={cn("panel rounded-[16px] border border-[#b6b6b6] bg-white p-6 text-center shadow-sm", className)}>
        <span className="anim-blink mx-auto block h-3 w-3 rounded-full bg-[#1a3300]" />
        <p className="mt-3 font-mono text-xs uppercase tracking-widest text-[#1a3300]">
          Syncing investigation tree...
        </p>
      </div>
    );
  }

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
            <h2 className="font-display text-lg text-[#1a3300]">{title}</h2>
            <p className="font-sans text-xs text-[#666666]">{subtitle}</p>
          </div>
        </div>
        <Chip
          tone={completedCount > 0 ? "yellow" : "default"}
          className="shrink-0 font-mono text-xs font-bold"
        >
          {completedCount} / 7 Solved
        </Chip>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-[#f1f1f1] overflow-hidden">
          <div
            className="h-full bg-[#1a3300] transition-all duration-500 ease-out"
            style={{ width: `${Math.round((completedCount / 7) * 100)}%` }}
          />
        </div>
        <span className="font-mono text-[10px] font-semibold text-[#666666]">
          {Math.round((completedCount / 7) * 100)}%
        </span>
      </div>

      {/* Node Tree Circuit Map */}
      <div className="relative mt-6">
        {/* Central Vertical Trunk Line */}
        <div
          className="absolute bottom-6 left-4 sm:left-5 top-5 w-[2px] bg-[#1a3300]/20"
          aria-hidden="true"
        />

        <div className="space-y-3">
          {nodes.map((node, index) => {
            const isCompleted = node.status === "completed";
            const isActive = node.status === "active";
            const isLocked = node.status === "locked";

            return (
              <div
                key={node.id}
                className={cn(
                  "relative flex items-start gap-3.5 sm:gap-4 transition-all",
                  isLocked && "opacity-60",
                )}
              >
                {/* Node Icon Beacon */}
                <div className="relative z-10 flex shrink-0 items-center justify-center">
                  <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center">
                    {isActive && (
                      <span className="anim-blink absolute inset-0 rounded-full bg-[#ffe95c]" />
                    )}
                    <span
                      className={cn(
                        "relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border transition-all shadow-sm",
                        isCompleted &&
                          "border-[#1a3300] bg-[#1a3300] text-[#fcfaf5]",
                        isActive &&
                          "border-black bg-white text-black shadow-md ring-2 ring-[#ffe95c]",
                        isLocked &&
                          "border-[#b6b6b6] bg-[#fcfaf5] text-[#888888]",
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle size={17} weight="bold" />
                      ) : isActive ? (
                        node.kind === "sos" ? (
                          <Radio size={16} weight="fill" className="text-black" />
                        ) : node.kind === "final" ? (
                          <Leaf size={16} weight="fill" className="text-black" />
                        ) : (
                          <MapPin size={16} weight="fill" className="text-black" />
                        )
                      ) : (
                        <Lock size={13} weight="bold" />
                      )}
                    </span>
                  </div>
                </div>

                {/* Node Card */}
                <div
                  className={cn(
                    "min-w-0 flex-1 rounded-[12px] border p-3 sm:p-3.5 transition-colors",
                    isCompleted &&
                      "border-[rgba(26,51,0,0.2)] bg-[#d5f5c2]/30",
                    isActive &&
                      "border-[rgba(26,51,0,0.35)] bg-[#ffe95c]/20 ring-1 ring-[#1a3300]/10",
                    isLocked && "border-[#b6b6b6]/50 bg-[#fcfaf5]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#1a3300]/80">
                        NODE {node.nodeNumber}
                      </span>

                      {/* Status Badges */}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#1a3300] px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wider text-[#fcfaf5]">
                          Solved
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#ffe95c] px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wider text-[#1a3300] border border-[rgba(26,51,0,0.15)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#1a3300]" />
                          Active Target
                        </span>
                      )}
                      {isLocked && (
                        <span className="rounded-full border border-[#b6b6b6] bg-white px-2 py-0.2 font-mono text-[9px] uppercase tracking-wider text-[#888888]">
                          Classified
                        </span>
                      )}
                    </div>

                    <span className="shrink-0 font-mono text-[10px] uppercase text-[#666666]">
                      {node.kind === "sighting"
                        ? "Sighting"
                        : node.kind === "sos"
                          ? "Day 2 SOS"
                          : "Final Gate"}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <h3
                      className={cn(
                        "text-xs sm:text-sm font-bold truncate",
                        isCompleted && "text-[#1a3300]",
                        isActive && "text-[#1a3300]",
                        isLocked && "font-mono tracking-widest text-[#777777]",
                      )}
                    >
                      {node.name}
                    </h3>

                    {/* Recovered Word Badge */}
                    {node.recoveredWord && (
                      <span className="shrink-0 rounded-[4px] bg-[#ffe95c] px-2 py-0.5 font-mono text-[11px] font-bold tracking-widest text-[#1a3300] border border-[rgba(26,51,0,0.15)]">
                        {node.recoveredWord}
                      </span>
                    )}
                  </div>

                  {node.detail && (
                    <p className="mt-1 font-sans text-xs leading-relaxed text-[#555555]">
                      {node.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer info banner */}
      <div className="mt-5 flex items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#b6b6b6] bg-[#fcfaf5] px-4 py-2.5 text-center">
        <Sparkle size={14} weight="fill" className="shrink-0 text-[#1a3300]" />
        <span className="font-sans text-xs font-semibold text-[#1a3300]">
          {completedCount === 7
            ? "All nodes reconstructed. The hunt is complete!"
            : activeNode
              ? `Next objective: Node ${activeNode.nodeNumber} (${activeNode.name})`
              : "Nodes activate sequentially as each waypoint is solved."}
        </span>
      </div>
    </div>
  );
}
