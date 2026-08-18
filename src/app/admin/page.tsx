"use client";

import { useEffect, useReducer, useState, type ReactNode } from "react";
import QRCode from "react-qr-code";
import {
  Broadcast as BroadcastIcon,
  CaretDown,
  Check,
  DownloadSimple,
  Flag,
  Phone,
  Printer,
  SignOut,
  SlidersHorizontal,
  TrashSimple,
  Trophy,
  Users,
  WarningCircle,
} from "@phosphor-icons/react";
import { Btn, Chip, Field, Panel, PhasePill } from "@/components/ui";
import { useMounted } from "@/hooks/use-game";
import { correctAnswerAt, sightingScans, stageOf } from "@/lib/game";
import { store } from "@/lib/store";
import type { DB, Phase } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";

type Tab = "overview" | "teams" | "qr" | "broadcast" | "settings" | "audit" | "danger";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "teams", label: "Teams" },
  { id: "qr", label: "QR sheet" },
  { id: "broadcast", label: "Broadcast" },
  { id: "settings", label: "Settings" },
  { id: "audit", label: "Audit log" },
  { id: "danger", label: "Danger" },
];

export default function AdminPage() {
  const mounted = useMounted();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (mounted) setAuthed(store.adminAuthed());
  }, [mounted]);

  if (!mounted) return null;
  if (!authed) return <AdminLogin onAuthed={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={() => setAuthed(false)} />;
}

/* ---------- login ---------- */

function AdminLogin({ onAuthed }: { onAuthed: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!code.trim()) {
      setError("Enter the control code.");
      return;
    }
    setBusy(true);
    try {
      const res = await store.adminLogin(code);
      if (!res.ok) {
        setError(res.message || "Wrong code. This login is logged.");
        return;
      }
      onAuthed();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#090d0b] px-6 text-center">
      <div className="w-full max-w-sm rounded-[16px] border border-[#202d24] bg-[#111813] p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[10px] bg-[#14261a] border border-[#22c55e]/40 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/maveli-logo.png"
            alt="The Maveli Files"
            className="h-11 w-11 object-cover"
          />
        </div>
        <h1 className="font-display mt-4 text-2xl text-white">
          The Maveli Files
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[#9ca3af]">
          Admin Control Center
        </p>

        <div className="mt-6 space-y-4 text-left">
          <Field
            label="Admin Password"
            type="password"
            placeholder="Enter admin password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="current-password"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
          {error && (
            <p className="flex items-start gap-2 rounded-[6px] border border-red-800 bg-[#2d1414] p-2.5 font-sans text-xs font-semibold text-red-200">
              <WarningCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
              {error}
            </p>
          )}
          <Btn onClick={submit} disabled={busy} className="w-full justify-center text-sm py-2.5">
            {busy ? "Checking..." : "Log In to Control Center"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ---------- dashboard ---------- */

function useSnapshot() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => store.subscribe(() => force()), []);
  return store.snapshot();
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const db = useSnapshot();
  const locations = store.locations();
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="min-h-[100dvh] bg-[#090d0b] text-white">
      <header className="sticky top-0 z-40 border-b border-[#202d24] bg-[#111813]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#14261a] border border-[#22c55e]/40 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/maveli-logo.png"
                alt="The Maveli Files"
                className="h-6 w-6 object-cover"
              />
            </div>
            <span className="hidden font-sans text-sm font-bold tracking-tight text-white sm:block">
              The Maveli Files · Admin
            </span>
            <PhasePill phase={db.game.phase} />
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-[6px] border border-[#202d24] bg-[#16221a] px-3 py-1.5 font-sans text-xs font-medium text-white hover:bg-red-950/50 hover:text-red-400 hover:border-red-800 transition-colors"
          >
            <SignOut size={15} /> <span>Logout</span>
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 pb-2.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-[6px] px-3.5 py-1.5 font-sans text-xs font-medium transition-all",
                tab === t.id
                  ? "bg-[#22c55e] text-[#090d0b] font-bold"
                  : "bg-[#16221a] border border-[#202d24] text-[#9ca3af] hover:text-white hover:bg-[#1a2c20]",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === "overview" && <OverviewTab db={db} locations={locations} />}
        {tab === "teams" && <TeamsTab db={db} locations={locations} />}
        {tab === "qr" && <QRTab locations={locations} />}
        {tab === "broadcast" && <BroadcastTab db={db} />}
        {tab === "settings" && <SettingsTab db={db} />}
        {tab === "audit" && <AuditTab db={db} />}
        {tab === "danger" && <DangerTab db={db} />}
      </main>
    </div>
  );
}

/* ---------- overview ---------- */

const PHASES: { phase: Phase; label: string; confirm?: string }[] = [
  { phase: "setup", label: "Standby" },
  { phase: "day1", label: "Day 1" },
  { phase: "night", label: "Night" },
  { phase: "day2", label: "Day 2" },
  { phase: "rescued", label: "Rescued" },
  { phase: "ended", label: "End event", confirm: "End the event? This locks the leaderboard." },
];

function OverviewTab({ db, locations }: { db: DB; locations: ReturnType<typeof store.locations> }) {
  const finished = db.answers.filter((a) => a.kind === "reconstruction" && a.correct).length;
  const winner = db.game.winnerTeamId
    ? db.teams.find((t) => t.id === db.game.winnerTeamId)
    : null;

  const setPhase = (p: Phase, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    store.setPhase(p);
  };

  return (
    <div className="space-y-5">
      {/* High-level Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Teams" value={String(db.teams.length)} icon={<Users size={16} />} />
        <Stat label="Scans" value={String(db.scans.length)} icon={<Flag size={16} />} />
        <Stat label="Rescued" value={String(finished)} icon={<Trophy size={16} />} />
      </div>

      {/* Winner Spotlight (if active) */}
      {winner && (
        <Panel className="border border-[#22c55e]/40 bg-[#102317] p-4 text-white">
          <SectionHeader>First Discovery / Winner</SectionHeader>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-[#22c55e]">{winner.name}</p>
              <p className="text-xs text-[#9ca3af]">
                {winner.member1} / {winner.member2} · Code {winner.code}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#14281b] border border-[#22c55e]/40 text-[#22c55e]">
              <Trophy size={20} weight="fill" />
            </span>
          </div>
        </Panel>
      )}

      {/* Phase Control Panel */}
      <Panel className="p-5 bg-[#111813] border border-[#202d24]">
        <div className="flex items-center justify-between border-b border-[#202d24] pb-3">
          <div>
            <SectionHeader>Event Phase Control</SectionHeader>
            <p className="mt-0.5 text-xs text-[#9ca3af]">
              Active phase: <span className="font-mono font-bold text-[#22c55e] uppercase">{db.game.phase}</span>
            </p>
          </div>
          <PhasePill phase={db.game.phase} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {PHASES.map((p) => {
            const isActive = db.game.phase === p.phase;
            const isDanger = p.phase === "ended";
            return (
              <Btn
                key={p.phase}
                variant={isActive ? "primary" : isDanger ? "danger" : "ghost"}
                size="sm"
                onClick={() => setPhase(p.phase, p.confirm)}
                className={cn(
                  "justify-center py-2.5",
                  isActive && "font-bold shadow-sm",
                )}
              >
                {isActive && <Check size={14} weight="bold" />}
                <span>{p.label}</span>
              </Btn>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-[#9ca3af]">
          Phase transitions automatically unlock stage content for all squads. Teams will reflect changes within their 4-second polling cycle.
        </p>
      </Panel>

      {/* Recent Broadcasts Feed */}
      <Panel className="p-5 bg-[#111813] border border-[#202d24]">
        <SectionHeader>Recent Dispatch Broadcasts</SectionHeader>
        {db.broadcasts.length === 0 ? (
          <p className="mt-3 text-xs text-[#9ca3af]">No broadcasts dispatched yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#202d24]">
            {[...db.broadcasts].reverse().slice(0, 5).map((b) => (
              <li key={b.id} className="py-2.5">
                <div className="flex items-start gap-2.5">
                  <BroadcastIcon size={15} className="mt-0.5 shrink-0 text-[#22c55e]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{b.message}</p>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase text-[#9ca3af]">
                      <span className="rounded bg-[#16221a] px-1.5 py-0.5 border border-[#202d24] text-[#86efac]">
                        {b.audience}
                      </span>
                      {b.teamId && (
                        <span>· {db.teams.find((t) => t.id === b.teamId)?.name ?? "Squad"}</span>
                      )}
                      <span>· {formatTime(b.at)}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Panel className="p-3.5 bg-[#111813] border border-[#202d24]">
      <div className="flex items-center gap-1.5 text-[#22c55e]">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">{label}</span>
      </div>
      <p className="mt-1 font-mono text-2xl font-bold text-white">{value}</p>
    </Panel>
  );
}

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#9ca3af]">
      {children}
    </h2>
  );
}

/* ---------- teams ---------- */

function TeamsTab({ db, locations }: { db: DB; locations: ReturnType<typeof store.locations> }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const teams = db.teams
    .filter((t) => {
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.member1.toLowerCase().includes(q) ||
        t.member2.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeader>Registered Squads ({db.teams.length})</SectionHeader>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name / code / members..."
          className="field field-sm w-full sm:w-64"
          aria-label="Search teams"
        />
      </div>

      {teams.length === 0 ? (
        <Panel className="p-6 text-center text-sm text-[#9ca3af] bg-[#111813] border border-[#202d24]">
          {db.teams.length === 0
            ? "No squads registered yet. Teams register via the home screen."
            : "No squads match your search query."}
        </Panel>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {teams.map((t) => (
            <TeamCard key={t.id} teamId={t.id} db={db} locations={locations} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({
  teamId,
  db,
  locations,
}: {
  teamId: string;
  db: DB;
  locations: ReturnType<typeof store.locations>;
}) {
  const [open, setOpen] = useState(false);
  const [hintLoc, setHintLoc] = useState("");
  const [advLoc, setAdvLoc] = useState("");

  const team = db.teams.find((t) => t.id === teamId);
  if (!team) return null;

  const progress = sightingScans(teamId, db.scans, locations).length;
  const stage = stageOf(teamId, db.game.phase, locations, db.scans, db.answers, true);
  const finishedAt = correctAnswerAt(teamId, db.answers, "reconstruction");
  const sos = db.scans.some((s) => s.teamId === teamId && s.locationId === "sos");
  const bitchat = correctAnswerAt(teamId, db.answers, "bitchat") !== null;
  const final = db.scans.some((s) => s.teamId === teamId && s.locationId === "fin");

  const defaultHint = stage.location?.id ?? locations.find((l) => l.type === "sighting")?.id ?? "";
  const hintId = hintLoc || defaultHint;

  const tel = db.settings.volunteerPhone.replace(/[^+\d]/g, "");

  return (
    <Panel className="p-4 bg-[#111813] border border-[#202d24] text-white transition-colors hover:border-[#202d24]">
      {/* Collapsed Header (Clean high-signal triage row) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-white text-base">{team.name}</span>
            <Chip className="shrink-0 bg-[#14281b] border-[#22c55e]/40 text-[#22c55e] font-mono">
              {team.code}
            </Chip>
            {finishedAt && (
              <span className="rounded-full bg-[#22c55e]/20 border border-[#22c55e]/40 px-2 py-0.5 font-mono text-[9px] font-bold text-[#22c55e]">
                RESCUED
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-[#9ca3af] truncate">
            {team.member1} / {team.member2} · joined {formatTime(team.createdAt)}
          </p>

          <div className="mt-2.5 flex items-center gap-2.5">
            <ProgressDots n={progress} total={5} />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#86efac]">
              {stage.label}
            </span>
          </div>
        </div>

        <CaretDown
          size={18}
          className={cn(
            "shrink-0 text-[#9ca3af] transition-transform duration-200",
            open && "rotate-180 text-[#22c55e]",
          )}
        />
      </button>

      {/* Expanded Controls (Grouped logically) */}
      {open && (
        <div className="mt-4 space-y-4 border-t border-[#202d24] pt-4">
          {/* Milestone Status Badges */}
          <div className="rounded-[8px] bg-[#16201a] border border-[#202d24] p-2.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#9ca3af] mb-1.5">
              Checkpoint Status
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn("chip", progress === 5 ? "chip-leaf" : "")}>
                Words: {progress}/5
              </span>
              <span className={cn("chip", sos ? "chip-mint" : "")}>
                SOS {sos ? "✓" : "—"}
              </span>
              <span className={cn("chip", bitchat ? "chip-leaf" : "")}>
                BitChat {bitchat ? "✓" : "—"}
              </span>
              <span className={cn("chip", final ? "chip-mint" : "")}>
                Sanctuary {final ? "✓" : "—"}
              </span>
              {finishedAt && (
                <span className="chip chip-leaf">
                  Finished {formatTime(finishedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Intervention Group 1: Level 1 Hint */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#9ca3af]">
                Level 1 · Push Hint to Squad
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={hintLoc || defaultHint}
                onChange={(e) => setHintLoc(e.target.value)}
                className="field field-sm flex-1 text-xs"
                aria-label="Hint location"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.order}. {l.name}
                  </option>
                ))}
              </select>
              <Btn
                size="sm"
                variant="ghost"
                onClick={() => {
                  store.pushHint(teamId, hintId);
                  setOpen(false);
                }}
              >
                Push Hint
              </Btn>
            </div>
          </div>

          {/* Intervention Group 2: Level 3 Admin Advance */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#9ca3af]">
                Level 3 · Admin Advance Node
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={advLoc}
                onChange={(e) => setAdvLoc(e.target.value)}
                className="field field-sm flex-1 text-xs"
                aria-label="Advance location"
              >
                <option value="">Select location to grant...</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.order}. {l.name}
                  </option>
                ))}
              </select>
              <Btn
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!advLoc) return;
                  store.grantLocation(teamId, advLoc);
                  setAdvLoc("");
                  setOpen(false);
                }}
              >
                Grant Node
              </Btn>
            </div>
          </div>

          {/* Contact & Squad Reset Bar */}
          <div className="flex items-center justify-between border-t border-[#202d24] pt-3">
            <a
              href={`tel:${tel}`}
              className="btn btn-ghost btn-sm text-xs gap-1.5 text-[#9ca3af] hover:text-white"
            >
              <Phone size={14} /> <span>Call Lead ({team.member1})</span>
            </a>
            <Btn
              size="sm"
              variant="danger"
              onClick={() => {
                if (window.confirm(`Reset all progress for squad "${team.name}"?`)) {
                  store.resetTeam(teamId);
                }
              }}
            >
              <TrashSimple size={14} /> <span>Reset Squad</span>
            </Btn>
          </div>
        </div>
      )}
    </Panel>
  );
}

function ProgressDots({ n, total }: { n: number; total: number }) {
  return (
    <span className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i < n ? "bg-[#22c55e]" : "bg-[#202d24]",
          )}
        />
      ))}
    </span>
  );
}

/* ---------- QR sheet ---------- */

function QRTab({ locations }: { locations: ReturnType<typeof store.locations> }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const sortedLocations = [...locations].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <Panel className="p-5 bg-[#111813] border border-[#202d24] text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionHeader>Investigation Checkpoint QR Codes</SectionHeader>
            <p className="mt-1 text-xs text-[#9ca3af]">
              QR markers for all 7 checkpoints (Sightings 1–5, SOS Transmission, and Final Sanctuary).
              Print onto sheets or use test links directly.
            </p>
          </div>
          <Btn variant="primary" onClick={() => window.print()}>
            <Printer size={16} weight="bold" /> <span>Print QR Cards</span>
          </Btn>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedLocations.map((l) => {
          const scanUrl = `${origin}/scan/${l.token}`;

          return (
            <Panel
              key={l.id}
              className="flex flex-col items-center justify-between p-5 text-center transition-all bg-[#111813] border border-[#202d24] text-white hover:border-[#22c55e]/60 shadow-sm"
            >
              <div className="w-full">
                <div className="flex items-center justify-between border-b border-[#202d24] pb-2 text-left">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#22c55e]">
                    Node 0{l.order}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-[#9ca3af]">
                    {l.type}
                  </span>
                </div>

                <p className="mt-2.5 text-sm font-bold uppercase tracking-tight text-white">
                  {l.name}
                </p>
                <p className="font-mono text-[10px] text-[#9ca3af]">{l.token}</p>
              </div>

              {/* QR Code Container */}
              <div className="my-4 rounded-xl border border-[#202d24] bg-white p-3 shadow-inner">
                <QRCode
                  value={scanUrl}
                  size={140}
                  className="mx-auto"
                  fgColor="#03150a"
                  bgColor="#ffffff"
                />
              </div>

              <div className="w-full space-y-2">
                <div className="rounded bg-[#16221a] px-2 py-1 font-mono text-[10px] text-[#86efac] truncate border border-[#202d24]">
                  {scanUrl}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <a
                    href={scanUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#22c55e] hover:underline"
                  >
                    Open test link ↗
                  </a>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- broadcast ---------- */

function BroadcastTab({ db }: { db: DB }) {
  const [audience, setAudience] = useState<"all" | "day1" | "day2" | "team">("all");
  const [teamId, setTeamId] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const canSend = Boolean(message.trim()) && (audience !== "team" || Boolean(teamId));

  const send = () => {
    if (!canSend) return;
    store.addBroadcast(
      message.trim(),
      audience,
      audience === "team" ? teamId : undefined,
    );
    setMessage("");
    setSent(true);
    window.setTimeout(() => setSent(false), 2000);
  };

  return (
    <div className="space-y-5">
      <Panel className="p-5 bg-[#111813] border border-[#202d24] text-white">
        <SectionHeader>Dispatch a Broadcast</SectionHeader>
        <p className="mt-1 text-xs text-[#9ca3af]">
          Send high-priority tactical announcements to squads in the field.
        </p>

        <div className="mt-4 space-y-3.5">
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-[#9ca3af]">
              Target Audience
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["all", "day1", "day2", "team"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAudience(a)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                    audience === a
                      ? "border-[#22c55e] bg-[#22c55e] text-[#090d0b] font-bold shadow-sm"
                      : "border-[#202d24] bg-[#16221a] text-[#9ca3af] hover:text-white",
                  )}
                >
                  {a === "all" ? "Everyone" : a === "day1" ? "Day 1 Active" : a === "day2" ? "Day 2 Active" : "Specific Squad"}
                </button>
              ))}
            </div>
          </div>

          {audience === "team" && (
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#9ca3af]">
                Select Target Squad
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="field text-xs"
                aria-label="Target Squad"
              >
                <option value="">Choose squad...</option>
                {db.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
              {!teamId && (
                <p className="font-sans text-xs text-amber-400">
                  Please choose a target squad to send a private transmission.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-[#9ca3af]">
              Announcement Content
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type transmission to dispatch..."
              className="field min-h-24 resize-y text-sm"
              aria-label="Broadcast message"
            />
          </div>

          <Btn variant="primary" onClick={send} disabled={!canSend} className="w-full sm:w-auto">
            {sent ? <Check size={16} weight="bold" /> : <BroadcastIcon size={16} />}
            <span>{sent ? "Broadcast Dispatched" : "Dispatch Broadcast"}</span>
          </Btn>
        </div>
      </Panel>

      <Panel className="p-5 bg-[#111813] border border-[#202d24] text-white">
        <SectionHeader>Broadcast History ({db.broadcasts.length})</SectionHeader>
        {db.broadcasts.length === 0 ? (
          <p className="mt-3 text-xs text-[#9ca3af]">No broadcasts sent yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#202d24]">
            {[...db.broadcasts].reverse().map((b) => (
              <li key={b.id} className="py-2.5">
                <p className="text-sm font-medium text-white">{b.message}</p>
                <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase text-[#9ca3af]">
                  <span className="rounded bg-[#16221a] px-1.5 py-0.5 border border-[#202d24] text-[#86efac]">
                    {b.audience}
                  </span>
                  {b.teamId && (
                    <span>· {db.teams.find((t) => t.id === b.teamId)?.name ?? "Squad"}</span>
                  )}
                  <span>· {formatTime(b.at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* ---------- settings ---------- */

function SettingsTab({ db }: { db: DB }) {
  const [form, setForm] = useState({ ...db.settings });
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof form, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    store.updateSettings({
      volunteerPhone: form.volunteerPhone,
      volunteerWhatsapp: form.volunteerWhatsapp,
      instagramUrl: form.instagramUrl,
      bitchatGuide: form.bitchatGuide,
      bitchatCode: form.bitchatCode,
      adminCode: form.adminCode,
      sosLockSeconds: Math.max(1, Number(form.sosLockSeconds) || 4),
      mapillaryNote: form.mapillaryNote,
      eventStartIso: form.eventStartIso || "2026-08-19T14:40:00+05:30",
      day1EndIso: form.day1EndIso || "2026-08-19T15:40:00+05:30",
      day2StartIso: form.day2StartIso || "2026-08-20T14:40:00+05:30",
      day2EndIso: form.day2EndIso || "2026-08-20T15:40:00+05:30",
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const setDemoKickoff = (minsFromNow: number) => {
    const d = new Date(Date.now() + minsFromNow * 60 * 1000);
    set("eventStartIso", d.toISOString());
  };

  const resetOfficialSchedule = () => {
    set("eventStartIso", "2026-08-19T14:40:00+05:30");
    set("day1EndIso", "2026-08-19T15:40:00+05:30");
    set("day2StartIso", "2026-08-20T14:40:00+05:30");
    set("day2EndIso", "2026-08-20T15:40:00+05:30");
  };

  return (
    <div className="space-y-5">
      {/* Event Schedule & Kickoff Countdown */}
      <Panel className="p-5 bg-[#111813] border border-[#202d24] text-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#202d24] pb-3">
          <div>
            <SectionHeader>Event Timetable & Kickoff Schedule</SectionHeader>
            <p className="mt-0.5 text-xs text-[#9ca3af]">
              Controls the live kickoff countdown timer on the landing & tracker pages.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn size="sm" variant="ghost" onClick={() => setDemoKickoff(1)}>
              Demo: Start in 1m
            </Btn>
            <Btn size="sm" variant="ghost" onClick={resetOfficialSchedule}>
              Reset to 19/08 Official
            </Btn>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Day 1 Kickoff (Countdown Target)"
            value={form.eventStartIso ?? "2026-08-19T14:40:00+05:30"}
            onChange={(e) => set("eventStartIso", e.target.value)}
            hint="Format: YYYY-MM-DDTHH:MM:SS+05:30 (Default 19/08 14:40)"
          />
          <Field
            label="Day 1 Submission Close"
            value={form.day1EndIso ?? "2026-08-19T15:40:00+05:30"}
            onChange={(e) => set("day1EndIso", e.target.value)}
            hint="Format: YYYY-MM-DDTHH:MM:SS+05:30 (Default 19/08 15:40)"
          />
          <Field
            label="Day 2 Kickoff Time"
            value={form.day2StartIso ?? "2026-08-20T14:40:00+05:30"}
            onChange={(e) => set("day2StartIso", e.target.value)}
            hint="Format: YYYY-MM-DDTHH:MM:SS+05:30 (Default 20/08 14:40)"
          />
          <Field
            label="Day 2 Final Cutoff"
            value={form.day2EndIso ?? "2026-08-20T15:40:00+05:30"}
            onChange={(e) => set("day2EndIso", e.target.value)}
            hint="Format: YYYY-MM-DDTHH:MM:SS+05:30 (Default 20/08 15:40)"
          />
        </div>
      </Panel>

      {/* Contact & Social Links */}
      <Panel className="p-5 bg-[#111813] border border-[#202d24] text-white">
        <SectionHeader>Volunteer Contacts & Social Links</SectionHeader>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Volunteer phone number"
            value={form.volunteerPhone}
            onChange={(e) => set("volunteerPhone", e.target.value)}
            hint="For direct telephone contact links"
          />
          <Field
            label="WhatsApp group link"
            value={form.volunteerWhatsapp}
            onChange={(e) => set("volunteerWhatsapp", e.target.value)}
            hint="wa.me group link shown to teams"
          />
          <Field
            label="Instagram URL"
            value={form.instagramUrl}
            onChange={(e) => set("instagramUrl", e.target.value)}
            className="sm:col-span-2"
          />
        </div>
      </Panel>

      {/* Security, Game Codes & Lockouts */}
      <Panel className="p-5 bg-[#111813] border border-[#202d24] text-white">
        <SectionHeader>Game Credentials & Lockout Timers</SectionHeader>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="BitChat Secret Code"
            value={form.bitchatCode}
            onChange={(e) => set("bitchatCode", e.target.value)}
            hint="Code verified in Day 2 BitChat transmission"
          />
          <Field
            label="Admin Dashboard Password"
            value={form.adminCode}
            onChange={(e) => set("adminCode", e.target.value)}
            hint="Dashboard access password"
          />
          <Field
            label="SOS Scan Cooldown (seconds)"
            value={form.sosLockSeconds}
            onChange={(e) => set("sosLockSeconds", Number(e.target.value))}
            inputMode="numeric"
            hint="Default 4 seconds"
          />
        </div>
      </Panel>

      {/* Guidance Notes & Instructions */}
      <Panel className="p-5 bg-[#111813] border border-[#202d24] text-white">
        <SectionHeader>In-Game Stage Guidance Text</SectionHeader>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block font-sans text-xs font-semibold text-white">
              BitChat guide text (shown to squads in Day 2)
            </span>
            <textarea
              value={form.bitchatGuide}
              onChange={(e) => set("bitchatGuide", e.target.value)}
              className="field min-h-20 resize-y text-xs"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-sans text-xs font-semibold text-white">
              Mapillary hint note (shown in Sighting 01)
            </span>
            <textarea
              value={form.mapillaryNote}
              onChange={(e) => set("mapillaryNote", e.target.value)}
              className="field min-h-20 resize-y text-xs"
            />
          </label>
        </div>

        <div className="mt-5 border-t border-[#202d24] pt-4">
          <Btn variant="primary" onClick={save} className="w-full sm:w-auto">
            {saved ? <Check size={16} weight="bold" /> : <SlidersHorizontal size={16} />}
            <span>{saved ? "Settings Saved" : "Save All Settings"}</span>
          </Btn>
        </div>
      </Panel>
    </div>
  );
}

/* ---------- danger ---------- */

function DangerTab({ db }: { db: DB }) {
  const [restartConfirm, setRestartConfirm] = useState("");
  const [wipeConfirm, setWipeConfirm] = useState("");

  const exportJSON = async () => {
    const json = await store.exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mavelli-hunt-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* 1. Safe Operational Utility: Export Data */}
      <Panel className="p-5 bg-[#111813] border border-[#202d24] text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionHeader>Export Event Snapshot</SectionHeader>
            <p className="mt-1 text-xs text-[#9ca3af]">
              Download complete event record (teams, scans, answers, hints, broadcasts, audit trail) as JSON backup.
            </p>
          </div>
          <Btn variant="outline" onClick={exportJSON}>
            <DownloadSimple size={16} /> <span>Export JSON</span>
          </Btn>
        </div>
      </Panel>

      {/* 2. Event Conclusion */}
      <Panel className="p-5 bg-[#111813] border border-[#202d24] text-white">
        <SectionHeader>Conclude / End Event</SectionHeader>
        <p className="mt-1 text-xs text-[#9ca3af] leading-relaxed">
          Freezes the leaderboard, preserves final standings, and shifts all players to the "Event Over" screen.
        </p>
        <Btn
          variant="outline"
          className="mt-3.5"
          onClick={() => {
            if (window.confirm("Conclude the event and freeze leaderboard standings?")) {
              store.setPhase("ended");
            }
          }}
        >
          <Flag size={16} /> <span>End Event & Lock Board</span>
        </Btn>
      </Panel>

      {/* 3. Restart Game (High Friction: Type-to-Confirm) */}
      <div className="rounded-[14px] border border-amber-800/60 bg-[#1a130e] p-5 text-white">
        <div className="flex items-center gap-2 text-amber-400">
          <SlidersHorizontal size={18} />
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] font-bold">
            Restart Game (Soft Wipe)
          </h2>
        </div>
        <p className="mt-2 text-xs text-[#d1d5db] leading-relaxed">
          Keeps all registered squads in place, but wipes all scans, answers, hints, and active winners. Game resets to Standby phase.
        </p>
        <div className="mt-3.5 space-y-2">
          <label className="block font-mono text-[10px] uppercase text-amber-300">
            Type <span className="font-bold underline">RESTART</span> to authorize:
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              value={restartConfirm}
              onChange={(e) => setRestartConfirm(e.target.value.toUpperCase())}
              placeholder="RESTART"
              className="field field-sm w-40 font-mono text-center uppercase"
            />
            <Btn
              variant="outline"
              disabled={restartConfirm !== "RESTART"}
              onClick={() => {
                if (window.confirm("Confirm: Restart game progress for all squads?")) {
                  store.restartGame();
                  setRestartConfirm("");
                }
              }}
            >
              Restart Progress
            </Btn>
          </div>
        </div>
      </div>

      {/* 4. Full Factory Reset (High Friction: Type-to-Confirm) */}
      <div className="rounded-[14px] border border-red-900/80 bg-[#220d0d] p-5 text-white">
        <div className="flex items-center gap-2 text-red-400">
          <TrashSimple size={18} />
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] font-bold">
            New Game / Full Wipe (Hard Reset)
          </h2>
        </div>
        <p className="mt-2 text-xs text-[#d1d5db] leading-relaxed">
          Permanently destroys ALL registered squads, scans, answers, broadcasts, and game state. Use only when preparing a brand new event.
        </p>
        <div className="mt-3.5 space-y-2">
          <label className="block font-mono text-[10px] uppercase text-red-300">
            Type <span className="font-bold underline">WIPE</span> to authorize:
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              value={wipeConfirm}
              onChange={(e) => setWipeConfirm(e.target.value.toUpperCase())}
              placeholder="WIPE"
              className="field field-sm w-40 font-mono text-center uppercase"
            />
            <Btn
              variant="danger"
              disabled={wipeConfirm !== "WIPE"}
              onClick={() => {
                if (
                  window.confirm(
                    "CRITICAL: ALL registered squads, scans, answers, and broadcasts will be PERMANENTLY deleted. Proceed?",
                  )
                ) {
                  store.newGame();
                  setWipeConfirm("");
                }
              }}
            >
              Permanent Full Wipe
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- audit log ---------- */

function AuditTab({ db }: { db: DB }) {
  const [query, setQuery] = useState("");
  const logs = db.auditLog ?? [];

  const q = query.trim().toLowerCase();
  const filtered = logs.filter((entry) => {
    if (!q) return true;
    return (
      entry.actor.toLowerCase().includes(q) ||
      entry.action.toLowerCase().includes(q) ||
      entry.target.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <Panel className="p-5 bg-[#111813] border border-[#202d24] text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionHeader>System Audit Trail ({logs.length})</SectionHeader>
            <p className="mt-1 text-xs text-[#9ca3af]">
              Every administrative intervention, phase change, hint push, broadcast dispatch, settings modification, and login attempt is logged here.
            </p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter actor / action / target..."
            className="field field-sm w-full sm:w-64"
            aria-label="Filter audit log"
          />
        </div>
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="p-6 text-center text-sm text-[#9ca3af] bg-[#111813] border border-[#202d24]">
          {logs.length === 0 ? "No audit events recorded yet." : "No audit events match your filter query."}
        </Panel>
      ) : (
        <Panel className="p-0 overflow-hidden bg-[#111813] border border-[#202d24]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#202d24] bg-[#16221a] font-mono text-[10px] uppercase tracking-wider text-[#9ca3af]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202d24] font-sans">
                {filtered.map((entry, i) => {
                  const isFail = entry.action.includes("fail");
                  const isSuccess =
                    entry.action.includes("success") ||
                    entry.action.startsWith("set-") ||
                    entry.action.startsWith("grant-");
                  return (
                    <tr key={`${entry.at}-${entry.action}-${i}`} className="hover:bg-[#16221a]/50 transition-colors">
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-[#9ca3af]">
                        {formatTime(entry.at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-block rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
                            entry.actor === "admin"
                              ? "bg-[#14281b] text-[#22c55e] border border-[#22c55e]/40"
                              : "bg-[#16221a] text-[#9ca3af] border border-[#202d24]",
                          )}
                        >
                          {entry.actor}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "font-mono font-semibold",
                            isFail && "text-red-400",
                            isSuccess && "text-[#22c55e]",
                            !isFail && !isSuccess && "text-white",
                          )}
                        >
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-[#9ca3af] truncate max-w-xs">
                        {entry.target || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

