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
      <div className={cn("panel rounded-[16px] border border-[#202d24] bg-[#111813] p-6 text-center shadow-sm", className)}>
        <span className="anim-blink mx-auto block h-3 w-3 rounded-full bg-[#22c55e]" />
        <p className="mt-3 font-mono text-xs uppercase tracking-widest text-[#22c55e]">
          Syncing investigation tree...
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "panel rounded-[16px] border border-[#202d24] bg-[#111813] p-5 sm:p-6 shadow-sm text-white",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#202d24] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#14261a] text-[#22c55e] border border-[#22c55e]/40">
            <TreeStructure size={22} weight="bold" />
          </div>
          <div>
            <h2 className="font-display text-lg text-white tracking-wide">{title}</h2>
            <p className="font-sans text-xs text-[#9ca3af]">{subtitle}</p>
          </div>
        </div>
        <Chip
          tone={completedCount > 0 ? "leaf" : "default"}
          className="shrink-0 font-mono text-xs font-bold"
        >
          {completedCount} / 7 Solved
        </Chip>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-[#16221a] overflow-hidden border border-[#202d24]">
          <div
            className="h-full bg-[#22c55e] transition-all duration-500 ease-out"
            style={{ width: `${Math.round((completedCount / 7) * 100)}%` }}
          />
        </div>
        <span className="font-mono text-[10px] font-semibold text-[#9ca3af]">
          {Math.round((completedCount / 7) * 100)}%
        </span>
      </div>

      {/* Node Tree Circuit Map */}
      <div className="relative mt-6">
        {/* Central Vertical Trunk Line */}
        <div
          className="absolute bottom-6 left-4 sm:left-5 top-5 w-[2px] bg-[#202d24]"
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
                  isLocked && "opacity-50",
                )}
              >
                {/* Node Icon Beacon */}
                <div className="relative z-10 flex shrink-0 items-center justify-center">
                  <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center">
                    {isActive && (
                      <span className="anim-blink absolute inset-0 rounded-full bg-[#22c55e]/30" />
                    )}
                    <span
                      className={cn(
                        "relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border transition-all shadow-sm",
                        isCompleted &&
                          "border-[#22c55e] bg-[#14281b] text-[#22c55e]",
                        isActive &&
                          "border-[#22c55e] bg-[#22c55e] text-[#090d0b] shadow-sm ring-2 ring-[#22c55e]/40",
                        isLocked &&
                          "border-[#202d24] bg-[#111813] text-[#6b7280]",
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle size={17} weight="bold" />
                      ) : isActive ? (
                        node.kind === "sos" ? (
                          <Radio size={16} weight="fill" className="text-[#090d0b]" />
                        ) : node.kind === "final" ? (
                          <Leaf size={16} weight="fill" className="text-[#090d0b]" />
                        ) : (
                          <MapPin size={16} weight="fill" className="text-[#090d0b]" />
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
                      "border-[#22c55e]/30 bg-[#102117]",
                    isActive &&
                      "border-[#22c55e] bg-[#14281b] ring-1 ring-[#22c55e]/30",
                    isLocked && "border-[#202d24] bg-[#111813]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#86efac]">
                        NODE {node.nodeNumber}
                      </span>

                      {/* Status Badges */}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#14281b] px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wider text-[#22c55e] border border-[#22c55e]/40">
                          Solved
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#22c55e] px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wider text-[#090d0b]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#090d0b]" />
                          Active Target
                        </span>
                      )}
                      {isLocked && (
                        <span className="rounded-full border border-[#202d24] bg-[#16221a] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#6b7280]">
                          Classified
                        </span>
                      )}
                    </div>

                    <span className="shrink-0 font-mono text-[10px] uppercase text-[#9ca3af]">
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
                        isCompleted && "text-[#22c55e]",
                        isActive && "text-white",
                        isLocked && "font-mono tracking-wider text-[#6b7280]",
                      )}
                    >
                      {node.name}
                    </h3>

                    {/* Recovered Word Badge */}
                    {node.recoveredWord && (
                      <span className="shrink-0 rounded-[4px] bg-[#14281b] px-2 py-0.5 font-mono text-[11px] font-bold tracking-widest text-[#22c55e] border border-[#22c55e]/40">
                        {node.recoveredWord}
                      </span>
                    )}
                  </div>

                  {node.detail && (
                    <p className="mt-1 font-sans text-xs leading-relaxed text-[#9ca3af]">
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
      <div className="mt-5 flex items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#202d24] bg-[#14261a]/60 px-4 py-2.5 text-center">
        <Sparkle size={14} weight="fill" className="shrink-0 text-[#22c55e]" />
        <span className="font-sans text-xs font-semibold text-[#86efac]">
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
