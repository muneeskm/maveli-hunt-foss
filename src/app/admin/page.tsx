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

type Tab = "overview" | "teams" | "qr" | "broadcast" | "settings" | "danger";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "teams", label: "Teams" },
  { id: "qr", label: "QR sheet" },
  { id: "broadcast", label: "Broadcast" },
  { id: "settings", label: "Settings" },
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
      const ok = await store.adminLogin(code);
      if (!ok) {
        setError("Wrong code. This login is logged.");
        return;
      }
      onAuthed();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#fcfaf5] px-6 text-center">
      <div className="w-full max-w-sm rounded-[16px] border border-[#b6b6b6] bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[10px] bg-[#ffe95c] border border-[rgba(26,51,0,0.15)] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/maveli-logo.png"
            alt="The Maveli Files"
            className="h-11 w-11 object-cover"
          />
        </div>
        <h1 className="font-display mt-4 text-2xl text-[#1a3300]">
          The Maveli Files
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[#666666]">
          Admin Control Center
        </p>

        <div className="mt-6 space-y-4 text-left">
          <Field
            label="Control Code"
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
          />
          {error && (
            <p className="flex items-start gap-2 rounded-[6px] border border-red-200 bg-red-50 p-2.5 font-sans text-xs font-semibold text-red-800">
              <WarningCircle size={16} className="mt-0.5 shrink-0 text-red-700" />
              {error}
            </p>
          )}
          <Btn onClick={submit} disabled={busy} className="w-full justify-center text-sm py-2.5">
            {busy ? "Checking..." : "Unlock Control"}
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
    <div className="min-h-[100dvh] bg-[#fcfaf5]">
      <header className="sticky top-0 z-40 border-b border-[#b6b6b6] bg-[#fcfaf5]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#ffe95c] border border-[rgba(26,51,0,0.15)] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/maveli-logo.png"
                alt="The Maveli Files"
                className="h-6 w-6 object-cover"
              />
            </div>
            <span className="hidden font-sans text-sm font-bold tracking-tight text-[#1a3300] sm:block">
              The Maveli Files · Admin
            </span>
            <PhasePill phase={db.game.phase} />
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-[6px] border border-[#b6b6b6] bg-white px-3 py-1.5 font-sans text-xs font-medium text-[#1a3300] hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
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
                  ? "bg-[#1a3300] text-[#fcfaf5]"
                  : "bg-white border border-[#b6b6b6] text-[#1a3300] hover:bg-[#f1f1f1]",
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
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Teams" value={String(db.teams.length)} icon={<Users size={16} />} />
        <Stat label="Scans" value={String(db.scans.length)} icon={<Flag size={16} />} />
        <Stat label="Rescued" value={String(finished)} icon={<Trophy size={16} />} />
      </div>

      <Panel className="p-4">
        <SectionHeader>Phase control</SectionHeader>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PHASES.map((p) => (
            <Btn
              key={p.phase}
              variant={db.game.phase === p.phase ? "primary" : "ghost"}
              size="sm"
              onClick={() => setPhase(p.phase, p.confirm)}
            >
              {p.label}
            </Btn>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[#666666]">
          Content unlocks per phase. End event locks the leaderboard and
          records the winner. Teams keep playing until then.
        </p>
      </Panel>

      {winner && (
        <Panel className="border-[rgba(26,51,0,0.2)] bg-[#ffe95c]/20 p-4">
          <SectionHeader>Winner</SectionHeader>
          <p className="mt-2 text-lg font-bold text-[#1a3300]">{winner.name}</p>
          <p className="text-sm text-[#666666]">
            {winner.member1} / {winner.member2}
          </p>
        </Panel>
      )}

      <Panel className="p-4">
        <SectionHeader>Recent broadcasts</SectionHeader>
        {db.broadcasts.length === 0 ? (
          <p className="mt-2 text-sm text-[#666666]">No broadcasts yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[#b6b6b6]/40">
            {[...db.broadcasts].reverse().slice(0, 8).map((b) => (
              <li key={b.id} className="py-2">
                <div className="flex items-start gap-2">
                  <BroadcastIcon size={14} className="mt-0.5 shrink-0 text-[#1a3300]" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1a3300]">{b.message}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-[#666666]">
                      {b.audience}
                      {b.teamId ? ` · ${db.teams.find((t) => t.id === b.teamId)?.name ?? ""}` : ""} · {formatTime(b.at)}
                    </p>
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
    <Panel className="p-3">
      <div className="flex items-center gap-1.5 text-[#1a3300]/80">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-1 font-mono text-2xl font-bold text-[#1a3300]">{value}</p>
    </Panel>
  );
}

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#666666]">
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
      <div className="flex items-center justify-between gap-3">
        <SectionHeader>Teams ({db.teams.length})</SectionHeader>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name / code"
          className="field field-sm w-56"
          aria-label="Search teams"
        />
      </div>

      {teams.length === 0 ? (
        <Panel className="p-6 text-center text-sm text-[#666666]">
          No teams yet. They register on the site.
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
    <Panel className="p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-[#1a3300]">{team.name}</span>
            <Chip className="shrink-0">{team.code}</Chip>
          </div>
          <p className="mt-0.5 text-xs text-[#666666]">
            {team.member1} / {team.member2} · joined {formatTime(team.createdAt)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <ProgressDots n={progress} total={5} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#1a3300]/80">
              {stage.label}
            </span>
          </div>
        </div>
        <CaretDown
          size={16}
          className={cn(
            "shrink-0 text-[#666666] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {progress === 5 && <Chip tone="leaf">All words</Chip>}
        {sos && <Chip>SOS</Chip>}
        {bitchat && <Chip tone="leaf">BitChat ✓</Chip>}
        {final && <Chip>Final found</Chip>}
        {finishedAt && <Chip tone="leaf">RESCUED {formatTime(finishedAt)}</Chip>}
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-[#b6b6b6]/60 pt-4">
          <div>
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#666666]">
              Level 1 - push hint
            </p>
            <div className="flex gap-2">
              <select
                value={hintLoc || defaultHint}
                onChange={(e) => setHintLoc(e.target.value)}
                className="field field-sm"
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
                Push
              </Btn>
            </div>
          </div>

          <div>
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#666666]">
              Level 3 - admin advance
            </p>
            <div className="flex gap-2">
              <select
                value={advLoc}
                onChange={(e) => setAdvLoc(e.target.value)}
                className="field field-sm"
                aria-label="Advance location"
              >
                <option value="">Select location...</option>
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
                  if (!advLoc) return;
                  store.grantLocation(teamId, advLoc);
                  setAdvLoc("");
                  setOpen(false);
                }}
              >
                Grant
              </Btn>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <a href={`tel:${tel}`} className="btn btn-ghost btn-sm">
              <Phone size={16} /> Call
            </a>
            <Btn
              size="sm"
              variant="danger"
              onClick={() => {
                if (window.confirm(`Reset progress for ${team.name}?`)) {
                  store.resetTeam(teamId);
                }
              }}
            >
              <TrashSimple size={16} /> Reset
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
            i < n ? "bg-[#1a3300]" : "bg-[#b6b6b6]/40",
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
      <Panel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionHeader>Investigation QR codes</SectionHeader>
            <p className="mt-1 text-sm text-[#666666]">
              QR codes for all 7 checkpoints (Sightings 1–5, SOS Transmission, and Final Sanctuary).
              Print on A4 or test scan URLs directly below.
            </p>
          </div>
          <Btn onClick={() => window.print()}>
            <Printer size={18} /> Print QR cards
          </Btn>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedLocations.map((l) => {
          const scanUrl = `${origin}/scan/${l.token}`;

          return (
            <Panel
              key={l.id}
              className="flex flex-col items-center justify-between p-5 text-center transition-all hover:border-[#1a3300]"
            >
              <div className="w-full">
                <div className="flex items-center justify-between border-b border-[#b6b6b6]/60 pb-2 text-left">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#1a3300]">
                    Node 0{l.order}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-[#666666]">
                    {l.type}
                  </span>
                </div>

                <p className="mt-2 text-sm font-bold uppercase tracking-tight text-[#1a3300]">
                  {l.name}
                </p>
                <p className="font-mono text-[10px] text-[#666666]">{l.token}</p>
              </div>

              {/* QR Code Container */}
              <div className="my-4 rounded-xl border border-[#b6b6b6] bg-white p-3 shadow-inner">
                <QRCode
                  value={scanUrl}
                  size={140}
                  className="mx-auto"
                  fgColor="#03150a"
                  bgColor="#ffffff"
                />
              </div>

              <div className="w-full space-y-2">
                <div className="rounded bg-[#f1f1f1] px-2 py-1 font-mono text-[10px] text-[#1a3300]/80 truncate">
                  {scanUrl}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <a
                    href={scanUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a3300] hover:underline"
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

  const send = () => {
    if (!message.trim()) return;
    store.addBroadcast(
      message.trim(),
      audience,
      audience === "team" ? teamId || undefined : undefined,
    );
    setMessage("");
    setSent(true);
    window.setTimeout(() => setSent(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Panel className="p-4">
        <SectionHeader>Send a broadcast</SectionHeader>
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["all", "day1", "day2", "team"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAudience(a)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  audience === a
                    ? "border-[#1a3300] bg-[#1a3300] text-[#fcfaf5]"
                    : "border-[#b6b6b6] bg-white text-[#666666] hover:bg-[#f1f1f1]",
                )}
              >
                {a === "all" ? "Everyone" : a === "day1" ? "Day 1" : a === "day2" ? "Day 2" : "One team"}
              </button>
            ))}
          </div>
          {audience === "team" && (
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="field text-sm"
              aria-label="Team"
            >
              <option value="">Select team...</option>
              {db.teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          )}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message to teams..."
            className="field min-h-24 resize-y"
            aria-label="Broadcast message"
          />
          <Btn onClick={send} className="w-full sm:w-auto">
            {sent ? <Check size={18} /> : <BroadcastIcon size={18} />}
            {sent ? "Sent" : "Send broadcast"}
          </Btn>
        </div>
      </Panel>

      <Panel className="p-4">
        <SectionHeader>History</SectionHeader>
        {db.broadcasts.length === 0 ? (
          <p className="mt-2 text-sm text-[#666666]">No broadcasts yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[#b6b6b6]/40">
            {[...db.broadcasts].reverse().map((b) => (
              <li key={b.id} className="py-2">
                <p className="text-sm font-medium text-[#1a3300]">{b.message}</p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-[#666666]">
                  {b.audience}
                  {b.teamId ? ` · ${db.teams.find((t) => t.id === b.teamId)?.name ?? ""}` : ""} · {formatTime(b.at)}
                </p>
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
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Panel className="p-4">
      <SectionHeader>Event settings</SectionHeader>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Field
          label="Volunteer phone"
          value={form.volunteerPhone}
          onChange={(e) => set("volunteerPhone", e.target.value)}
        />
        <Field
          label="WhatsApp link"
          value={form.volunteerWhatsapp}
          onChange={(e) => set("volunteerWhatsapp", e.target.value)}
          hint="wa.me link shown to teams"
        />
        <Field
          label="Instagram URL"
          value={form.instagramUrl}
          onChange={(e) => set("instagramUrl", e.target.value)}
        />
        <Field
          label="BitChat code"
          value={form.bitchatCode}
          onChange={(e) => set("bitchatCode", e.target.value)}
          hint="The code Mavelli sends via BitChat"
        />
        <Field
          label="Admin code"
          value={form.adminCode}
          onChange={(e) => set("adminCode", e.target.value)}
          hint="Shared login for this dashboard"
        />
        <Field
          label="SOS lock seconds"
          value={form.sosLockSeconds}
          onChange={(e) => set("sosLockSeconds", Number(e.target.value))}
          inputMode="numeric"
        />
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block font-sans text-xs font-semibold text-[#1a3300]">
            BitChat guide (shown to teams)
          </span>
          <textarea
            value={form.bitchatGuide}
            onChange={(e) => set("bitchatGuide", e.target.value)}
            className="field min-h-20 resize-y"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block font-sans text-xs font-semibold text-[#1a3300]">
            Mapillary note (sighting 1)
          </span>
          <textarea
            value={form.mapillaryNote}
            onChange={(e) => set("mapillaryNote", e.target.value)}
            className="field min-h-20 resize-y"
          />
        </label>
      </div>
      <Btn onClick={save} className="mt-4">
        {saved ? <Check size={18} /> : <SlidersHorizontal size={18} />}
        {saved ? "Saved" : "Save settings"}
      </Btn>
    </Panel>
  );
}

/* ---------- danger ---------- */

function DangerTab({ db }: { db: DB }) {
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
    <div className="space-y-4">
      <Panel className="p-4">
        <SectionHeader>End event</SectionHeader>
        <p className="mt-2 text-sm leading-relaxed text-[#666666]">
          Locks the leaderboard and records the winner from the archive. Teams
          see the "event over" screen.
        </p>
        <Btn
          variant="danger"
          className="mt-3"
          onClick={() => {
            if (window.confirm("End the event and lock results?")) {
              store.setPhase("ended");
            }
          }}
        >
          <Flag size={18} /> End event
        </Btn>
      </Panel>

      <Panel className="p-4">
        <SectionHeader>Restart game</SectionHeader>
        <p className="mt-2 text-sm leading-relaxed text-[#666666]">
          Keeps teams registered, wipes all scans, answers, and hints. Game
          returns to standby.
        </p>
        <Btn
          variant="ghost"
          className="mt-3"
          onClick={() => {
            if (window.confirm("Restart the game? Teams stay registered, all progress is wiped.")) {
              store.restartGame();
            }
          }}
        >
          <SlidersHorizontal size={18} /> Restart game
        </Btn>
      </Panel>

      <Panel className="p-4">
        <SectionHeader>New game</SectionHeader>
        <p className="mt-2 text-sm leading-relaxed text-[#666666]">
          Wipes everything including registered teams. Use only for a brand new
          event.
        </p>
        <Btn
          variant="danger"
          className="mt-3"
          onClick={() => {
            if (
              window.confirm(
                "New game: ALL teams, scans, answers, and broadcasts will be permanently wiped. Continue?",
              )
            ) {
              store.newGame();
            }
          }}
        >
          <TrashSimple size={18} /> New game (wipe all)
        </Btn>
      </Panel>

      <Panel className="p-4">
        <SectionHeader>Export data</SectionHeader>
        <p className="mt-2 text-sm leading-relaxed text-[#666666]">
          Downloads the full game record (teams, scans, answers, hints,
          broadcasts, settings) as JSON.
        </p>
        <Btn variant="ghost" className="mt-3" onClick={exportJSON}>
          <DownloadSimple size={18} /> Export JSON
        </Btn>
      </Panel>
    </div>
  );
}
