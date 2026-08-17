"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Copy,
  Info,
  Key,
  ShieldCheck,
  TreeStructure,
  UserPlus,
  Users,
  Warning,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { Btn, Chip, Field, Panel, SelectField } from "@/components/ui";
import { TrackerIntro } from "@/components/tracker-intro";
import { NodeTreeTimeline } from "@/components/node-tree-timeline";
import { useGame, useMounted } from "@/hooks/use-game";
import { store } from "@/lib/store";
import type { Team } from "@/lib/types";

const INTRO_SEEN_KEY = "mh:intro-seen";
const SEMESTERS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];

type IntroStep = "intro" | "join";

export default function HomePage() {
  const router = useRouter();
  const mounted = useMounted();
  const { team, sessionPending } = useGame();
  const [step, setStep] = useState<IntroStep>("join");
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [created, setCreated] = useState<Team | null>(null);

  // Capture ?scan= backflow target once, client-side.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const scan = new URLSearchParams(window.location.search).get("scan");
    if (scan) setReturnTo(scan);
  }, []);

  // Already signed in on arrival: go straight to the tracker.
  // Skipped while the just-created team's access-code screen is showing.
  useEffect(() => {
    if (mounted && team && !created) router.replace("/tracker");
  }, [mounted, team, created, router]);

  // Returning phones skip the intro sequence.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(INTRO_SEEN_KEY)) setStep("join");
  }, []);

  const skipIntro = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    }
    setStep("join");
  }, []);

  const go = (path: string) => router.replace(path);

  const afterJoin = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    }
    go(returnTo ?? "/tracker");
  };

  if (!mounted) return null;
  if (team && !created) return null; // redirecting to tracker
  if (!team && sessionPending) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-ink">
        <div className="text-center">
          <span className="anim-blink mx-auto block h-2 w-2 rounded-full bg-leaf" />
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.24em] text-fog">
            Syncing your team...
          </p>
        </div>
      </div>
    );
  }

  if (step === "intro") {
    return <TrackerIntro onDone={skipIntro} />;
  }

  // ---- join / registration ----
  return (
    <JoinScreen
      created={created}
      setCreated={setCreated}
      onDone={afterJoin}
    />
  );
}

/* ---------- join screen ---------- */

function JoinScreen({
  created,
  setCreated,
  onDone,
}: {
  created: Team | null;
  setCreated: (t: Team | null) => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"create" | "code">("create");
  const [teamName, setTeamName] = useState("");

  // Member 1 fields
  const [m1Name, setM1Name] = useState("");
  const [m1Sem, setM1Sem] = useState("S5");
  const [m1Class, setM1Class] = useState("");

  // Member 2 fields
  const [m2Name, setM2Name] = useState("");
  const [m2Sem, setM2Sem] = useState("S5");
  const [m2Class, setM2Class] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const create = async () => {
    if (busy) return;
    setFormError(null);

    const name1 = m1Name.trim();
    const sem1 = m1Sem.trim();
    const class1 = m1Class.trim();
    const name2 = m2Name.trim();
    const sem2 = m2Sem.trim();
    const class2 = m2Class.trim();
    const tName = teamName.trim() || `${name1.split(" ")[0] || "Team"} & ${name2.split(" ")[0] || "Squad"}`;

    if (!name1 || !sem1 || !class1) {
      setFormError("Member 1 requires Full Name, Semester, and Class.");
      return;
    }
    if (!name2 || !sem2 || !class2) {
      setFormError("Member 2 requires Full Name, Semester, and Class.");
      return;
    }

    setBusy(true);
    try {
      const team = await store.createTeam(
        tName,
        name1,
        name2,
        sem1,
        class1,
        sem2,
        class2,
      );
      await store.login(team.code);
      setCreated(team);
    } catch (e) {
      setFormError((e as Error).message ?? "Could not register. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    if (busy) return;
    setCodeError(null);
    if (!code.trim()) {
      setCodeError("Please enter your 6-character access code.");
      return;
    }
    setBusy(true);
    try {
      const team = await store.login(code);
      if (!team) {
        setCodeError("No team found with that code. Check with your teammate.");
        return;
      }
      onDone();
    } catch {
      setCodeError("Could not sign in with that code. Check your network.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  /* ---------- Post-Registration Success View ---------- */
  if (created) {
    return (
      <main className="min-h-[100dvh] bg-ink px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-lg">
          {/* Header */}
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/maveli-logo.png"
              alt="The Maveli Files"
              className="mx-auto h-16 w-16 rounded-full border border-line-2 object-cover shadow-lg shadow-leaf/20"
            />
            <div className="mt-3 flex items-center justify-center gap-2">
              <Chip tone="leaf">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-leaf" />
                Team Registered
              </Chip>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-mist sm:text-3xl">
              Save Your Access Code
            </h1>
            <p className="mt-1 text-sm text-fog">
              Your squad is locked in for The Maveli Files.
            </p>
          </div>

          {/* Access Code Box */}
          <div className="mt-6 rounded-2xl border-2 border-leaf/60 bg-surface/95 p-6 text-center shadow-xl shadow-leaf/10 backdrop-blur-md">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fog">
              Team Access Code
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-black tracking-[0.28em] text-leaf sm:text-4xl">
                {created.code}
              </span>
              <button
                type="button"
                onClick={copy}
                aria-label="Copy access code"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-line-2 bg-ink-3 text-fog transition-colors hover:border-leaf hover:text-mist active:scale-95"
              >
                {copied ? (
                  <Check size={20} className="text-leaf" weight="bold" />
                ) : (
                  <Copy size={20} />
                )}
              </button>
            </div>

            {copied && (
              <p className="mt-2 font-mono text-[11px] font-semibold text-leaf">
                Access code copied to clipboard!
              </p>
            )}

            {/* Critical Save Notice */}
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-left text-xs leading-relaxed text-amber-200/90">
              <div className="flex items-start gap-2.5">
                <Warning size={18} className="mt-0.5 shrink-0 text-amber-400" weight="fill" />
                <p>
                  <strong className="font-semibold text-amber-100">
                    Important: Save or screenshot this code now!
                  </strong>{" "}
                  Both members will use this code to log in and track the hunt across phones.
                </p>
              </div>
            </div>
          </div>

          {/* Team Summary Card */}
          <Panel className="mt-5 p-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fog">
                Registered Squad
              </span>
              <span className="font-semibold text-mist">{created.name}</span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line-2/60 bg-ink-3 p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-moss">
                  Member 1 (Lead)
                </p>
                <p className="mt-0.5 text-sm font-semibold text-mist">
                  {created.member1}
                </p>
                {(created.member1Sem || created.member1Class) && (
                  <p className="mt-0.5 font-mono text-xs text-leaf">
                    {[created.member1Sem, created.member1Class]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-line-2/60 bg-ink-3 p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-moss">
                  Member 2
                </p>
                <p className="mt-0.5 text-sm font-semibold text-mist">
                  {created.member2}
                </p>
                {(created.member2Sem || created.member2Class) && (
                  <p className="mt-0.5 font-mono text-xs text-leaf">
                    {[created.member2Sem, created.member2Class]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </div>
          </Panel>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {/* Timeline Button */}
            <Btn
              variant="ghost"
              onClick={() => setShowTimeline((prev) => !prev)}
              className="w-full justify-center border-leaf/40 bg-ink-2 text-mist hover:border-leaf hover:bg-surface-2"
            >
              <TreeStructure size={18} className="text-leaf" weight="bold" />
              {showTimeline ? "Hide Investigation Timeline" : "View Investigation Timeline"}
            </Btn>

            {/* Continue to Tracker */}
            <Btn onClick={onDone} className="w-full justify-center">
              Continue to Hunt Tracker <ArrowRight size={18} />
            </Btn>
          </div>

          {/* 7-Node Node-Tree Timeline Section (Revealed via Timeline Button) */}
          {showTimeline && (
            <div className="mt-6 anim-rise">
              <NodeTreeTimeline
                title="Investigation Trail (7 Nodes)"
                subtitle="First Sighting: Cake Farm"
              />
            </div>
          )}
        </div>
      </main>
    );
  }

  /* ---------- Registration / Sign-In Form View ---------- */
  return (
    <main className="flex min-h-[100dvh] flex-col justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/maveli-logo.png"
            alt="The Maveli Files"
            className="mx-auto h-16 w-16 rounded-full border border-line-2 object-cover shadow-lg shadow-leaf/20"
          />
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-mist sm:text-3xl">
            The Maveli Files
          </h1>
          <p className="mt-1 text-sm text-fog">
            Register your 2-member squad to receive your hunt access code.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-line bg-ink-2 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("create");
              setFormError(null);
              setCodeError(null);
            }}
            className={
              mode === "create"
                ? "flex items-center justify-center gap-1.5 rounded-lg bg-leaf px-3 py-2 text-sm font-semibold text-[#03150a] shadow-sm transition-all"
                : "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-fog hover:text-mist transition-colors"
            }
          >
            <UserPlus size={16} weight="bold" />
            Register Team
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("code");
              setFormError(null);
              setCodeError(null);
            }}
            className={
              mode === "code"
                ? "flex items-center justify-center gap-1.5 rounded-lg bg-leaf px-3 py-2 text-sm font-semibold text-[#03150a] shadow-sm transition-all"
                : "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-fog hover:text-mist transition-colors"
            }
          >
            <Key size={16} weight="bold" />
            Access Code
          </button>
        </div>

        {/* Tab 1: Register Team */}
        {mode === "create" ? (
          <div className="mt-6 space-y-5">
            {/* Team Name */}
            <Field
              label="Team Name"
              placeholder="e.g. Cipher Syndicate"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              autoComplete="off"
              hint="Pick a creative squad name for the leaderboard."
            />

            {/* Member 1 Card */}
            <div className="rounded-xl border border-line bg-surface/70 p-4">
              <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-leaf">
                  Member 1 (Squad Lead)
                </span>
                <span className="font-mono text-[10px] text-fog">Required</span>
              </div>
              <div className="space-y-3">
                <Field
                  label="Full Name"
                  placeholder="e.g. Arjun Krishna"
                  value={m1Name}
                  onChange={(e) => setM1Name(e.target.value)}
                  autoComplete="name"
                />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Semester"
                    value={m1Sem}
                    onChange={(e) => setM1Sem(e.target.value)}
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s} className="bg-ink-3 text-mist">
                        {s}
                      </option>
                    ))}
                  </SelectField>
                  <Field
                    label="Class / Branch"
                    placeholder="e.g. CSE A"
                    value={m1Class}
                    onChange={(e) => setM1Class(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            {/* Member 2 Card */}
            <div className="rounded-xl border border-line bg-surface/70 p-4">
              <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-leaf">
                  Member 2 (Teammate)
                </span>
                <span className="font-mono text-[10px] text-fog">Required</span>
              </div>
              <div className="space-y-3">
                <Field
                  label="Full Name"
                  placeholder="e.g. Deepak Menon"
                  value={m2Name}
                  onChange={(e) => setM2Name(e.target.value)}
                  autoComplete="name"
                />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Semester"
                    value={m2Sem}
                    onChange={(e) => setM2Sem(e.target.value)}
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s} className="bg-ink-3 text-mist">
                        {s}
                      </option>
                    ))}
                  </SelectField>
                  <Field
                    label="Class / Branch"
                    placeholder="e.g. ECE B"
                    value={m2Class}
                    onChange={(e) => setM2Class(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            {formError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                <div className="flex items-start gap-2">
                  <WarningCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
                  <span>{formError}</span>
                </div>
              </div>
            )}

            <Btn onClick={create} disabled={busy} className="w-full justify-center">
              <Users size={18} />
              {busy ? "Registering Squad..." : "Register Team & Get Code"}
            </Btn>

            <p className="text-center font-mono text-[11px] text-moss">
              Both team members must be present on campus during the hunt.
            </p>
          </div>
        ) : (
          /* Tab 2: Sign in with Access Code */
          <div className="mt-6 space-y-4">
            <Field
              label="Team Access Code"
              placeholder="XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              hint="Enter the 6-character code given after registration."
            />

            {codeError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                <div className="flex items-start gap-2">
                  <WarningCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
                  <span>{codeError}</span>
                </div>
              </div>
            )}

            <Btn onClick={join} disabled={busy} className="w-full justify-center">
              {busy ? "Authenticating..." : "Sign In to Team"} <ArrowRight size={18} />
            </Btn>

            <div className="rounded-xl border border-line bg-ink-3 p-3.5 text-xs text-fog">
              <div className="flex items-start gap-2">
                <Info size={16} className="mt-0.5 shrink-0 text-leaf" />
                <span>
                  Teammate already registered? Ask them for the 6-character access code to join the live session.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
