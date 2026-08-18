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
  Sparkle,
  UserPlus,
  Users,
  Warning,
  WarningCircle,
  WhatsappLogo,
} from "@phosphor-icons/react";
import {
  Btn,
  Chip,
  Field,
  HighlightWord,
  Panel,
  SelectField,
  TaglineBadge,
} from "@/components/ui";
import { CountdownTimer } from "@/components/countdown-timer";
import { TrackerIntro } from "@/components/tracker-intro";
import { useGame, useMounted } from "@/hooks/use-game";
import { store } from "@/lib/store";
import type { Team } from "@/lib/types";

const INTRO_COMPLETED_KEY = "maveli-intro-completed";
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const scan = new URLSearchParams(window.location.search).get("scan");
    if (scan) setReturnTo(scan);
  }, []);

  useEffect(() => {
    if (mounted && team && !created) router.replace("/tracker");
  }, [mounted, team, created, router]);

  useEffect(() => {
    // Intro temporarily disabled while schema changes are being finalized/committed.
    // TrackerIntro component and assets remain preserved in the codebase.
    setStep("join");
  }, []);

  const skipIntro = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(INTRO_COMPLETED_KEY, "true");
        sessionStorage.setItem(INTRO_SEEN_KEY, "1");
      } catch { }
    }
    setStep("join");
  }, []);

  const go = (path: string) => router.replace(path);

  const afterJoin = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(INTRO_COMPLETED_KEY, "true");
        sessionStorage.setItem(INTRO_SEEN_KEY, "1");
      } catch { }
    }
    go(returnTo ?? "/tracker");
  };

  if (!mounted) return null;
  if (team && !created) return null;
  if (!team && sessionPending) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#090d0b]">
        <div className="text-center">
          <span className="anim-blink mx-auto block h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-[#22c55e]">
            Syncing team...
          </p>
        </div>
      </div>
    );
  }

  if (step === "intro") {
    return <TrackerIntro onDone={skipIntro} />;
  }

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
  const [m1Sem, setM1Sem] = useState("S1");
  const [m1Class, setM1Class] = useState("");

  // Member 2 fields
  const [m2Name, setM2Name] = useState("");
  const [m2Sem, setM2Sem] = useState("S1");
  const [m2Class, setM2Class] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (busy) return;
    setFormError(null);

    const name1 = m1Name.trim();
    const sem1 = m1Sem.trim();
    const class1 = m1Class.trim();
    const name2 = m2Name.trim();
    const sem2 = m2Sem.trim();
    const class2 = m2Class.trim();
    const tName = teamName.trim() || `${name1.split(" ")[0] || "Team"} & ${name2.split(" ")[0] || "Team"}`;

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
      <main className="relative min-h-screen bg-[#020712] px-4 py-8 sm:px-6 sm:py-12 overflow-x-hidden">
        {/* Pixel Art Mobile Background Layer (Hardware Composited) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mobile-bg.png"
          alt=""
          aria-hidden="true"
          className="bg-mobile-layer"
        />

        <div className="relative z-10 mx-auto max-w-lg">
          {/* Header */}
          <div className="text-center">
            <TaglineBadge className="mx-auto">
              <Sparkle weight="fill" size={13} /> TEAM ENROLLED
            </TaglineBadge>

            <h1 className="font-display mt-4 text-3xl font-extrabold text-white sm:text-4xl leading-tight drop-shadow-md">
              Save your team <HighlightWord>credentials.</HighlightWord>
            </h1>
            <p className="mt-2 font-sans text-base text-[#cbd5e1] drop-shadow-sm">
              Your team is officially locked in for The Maveli Files.
            </p>
          </div>

          {/* Access Code Box (Pure Translucent Liquid Glass) */}
          <div className="liquid-glass mt-6 p-6 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-[#86efac]">
              Team Access Code
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="font-mono text-4xl font-extrabold tracking-[0.24em] text-[#22c55e] sm:text-5xl drop-shadow-md">
                {created.code}
              </span>
              <button
                type="button"
                onClick={copy}
                aria-label="Copy access code"
                className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-white/20 bg-white/10 text-[#22c55e] hover:bg-white/20 active:translate-y-[1px] transition-all backdrop-blur-md shadow-md"
              >
                {copied ? (
                  <Check size={20} className="text-[#22c55e]" weight="bold" />
                ) : (
                  <Copy size={20} />
                )}
              </button>
            </div>

            {copied && (
              <p className="mt-2 font-mono text-xs font-semibold text-[#86efac]">
                ✓ Access code copied to clipboard!
              </p>
            )}

            {/* Critical Save Notice */}
            <div className="liquid-glass-subtle mt-5 p-3.5 text-left text-xs leading-relaxed text-white">
              <div className="flex items-start gap-2.5">
                <Warning size={18} className="mt-0.5 shrink-0 text-[#22c55e]" weight="fill" />
                <p>
                  <strong>Important: Screenshot and take note of this code now.</strong>{" "}
                  Both members will use this code to log into the hunt tracker across their phones.
                </p>
              </div>
            </div>
          </div>

          {/* Mandatory WhatsApp Group Callout */}
          <div className="liquid-glass mt-5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-[#020712]">
                <WhatsappLogo size={24} weight="fill" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-sans text-base font-bold text-white">
                    Join Official WhatsApp Group
                  </h3>
                  <span className="rounded-[4px] bg-[#22c55e] px-2 py-0.5 font-mono text-[9px] font-bold text-[#020712]">
                    REQUIRED
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#cbd5e1]">
                  <strong>Every team member must join.</strong> Real-time broadcasts, game alerts, and starting instructions will be posted here.
                </p>
                <a
                  href="https://chat.whatsapp.com/FFQ517Asdpv13omB9ArMwv"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary mt-3 flex w-full items-center justify-center gap-2 text-sm font-semibold py-2.5 shadow-lg"
                >
                  <WhatsappLogo size={18} weight="fill" />
                  <span>Join WhatsApp Group ↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* Team Summary Card */}
          <div className="liquid-glass mt-5 p-5 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                Registered Team
              </span>
              <span className="font-sans text-sm font-bold text-white">{created.name}</span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="liquid-glass-subtle p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#94a3b8]">
                  Member 1 (Lead)
                </p>
                <p className="mt-1 font-sans text-sm font-semibold text-white">
                  {created.member1}
                </p>
                {(created.member1Sem || created.member1Class) && (
                  <p className="mt-0.5 font-mono text-xs text-[#86efac]">
                    {[created.member1Sem, created.member1Class]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>

              <div className="liquid-glass-subtle p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#94a3b8]">
                  Member 2
                </p>
                <p className="mt-1 font-sans text-sm font-semibold text-white">
                  {created.member2}
                </p>
                {(created.member2Sem || created.member2Class) && (
                  <p className="mt-0.5 font-mono text-xs text-[#86efac]">
                    {[created.member2Sem, created.member2Class]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6">
            <Btn onClick={onDone} className="w-full justify-center text-base py-3.5 shadow-xl">
              <span>Continue to Hunt Tracker</span>
              <ArrowRight size={18} />
            </Btn>
          </div>
        </div>
      </main>
    );
  }

  /* ---------- Registration / Sign-In Form View ---------- */
  return (
    <main className="relative min-h-screen flex flex-col justify-center bg-[#020712] px-4 py-8 sm:px-6 sm:py-12 overflow-x-hidden">
      {/* Pixel Art Mobile Background Layer (Hardware Composited) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mobile-bg.png"
        alt=""
        aria-hidden="true"
        className="bg-mobile-layer"
      />

      <div className="relative z-10 mx-auto w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/foss-logo.png"
              alt="FOSS CCE"
              className="h-10 w-10 rounded-full border border-white/20 object-cover shadow-lg"
            />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#94a3b8] drop-shadow-sm">
              FOSS CCE Presents
            </span>
          </div>
          <TaglineBadge className="mx-auto mb-4">
            <Sparkle weight="fill" size={13} /> THE MAVELI FILES
          </TaglineBadge>

          <h1 className="font-display text-4xl sm:text-5xl text-white leading-[1.08] tracking-[0.04em] drop-shadow-lg">
            Search for Maveli <HighlightWord>in the wild.</HighlightWord>
          </h1>
          <p className="mt-3 font-sans text-base text-[#cbd5e1] max-w-[500px] mx-auto leading-relaxed drop-shadow-md">
            Maveli was last seen at ████ ████ ████. Follow through his tracks and find him.
          </p>
        </div>

        {/* Event Countdown Timer (Liquid Glass) */}
        <CountdownTimer className="liquid-glass mt-6" />

        {/* Mode Switcher Tabs (Liquid Glass Capsule) */}
        <div className="liquid-glass-subtle mt-6 flex items-center justify-center gap-1 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("create");
              setFormError(null);
              setCodeError(null);
            }}
            className={
              mode === "create"
                ? "flex-1 flex items-center justify-center gap-1.5 rounded-[10px] bg-[#22c55e] py-2.5 font-sans text-xs font-bold text-[#020712] shadow-md transition-all"
                : "flex-1 flex items-center justify-center gap-1.5 rounded-[10px] py-2.5 font-sans text-xs font-medium text-[#cbd5e1] hover:text-white transition-colors"
            }
          >
            <UserPlus size={15} weight="bold" />
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
                ? "flex-1 flex items-center justify-center gap-1.5 rounded-[10px] bg-[#22c55e] py-2.5 font-sans text-xs font-bold text-[#020712] shadow-md transition-all"
                : "flex-1 flex items-center justify-center gap-1.5 rounded-[10px] py-2.5 font-sans text-xs font-medium text-[#cbd5e1] hover:text-white transition-colors"
            }
          >
            <Key size={15} weight="bold" />
            Join with Code
          </button>
        </div>

        {/* Tab 1: Register Team */}
        {mode === "create" ? (
          <div className="mt-6 space-y-4">
            {/* Team Name Field */}
            <div className="liquid-glass p-5 text-white">
              <label className="block">
                <span className="mb-1.5 block font-sans text-xs font-semibold text-white">
                  Team Name
                </span>
                <input
                  type="text"
                  placeholder="e.g. Cipher Syndicate"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  autoComplete="off"
                  className="liquid-glass-input w-full px-3.5 py-2.5 font-sans text-sm font-medium outline-none"
                />
                <span className="mt-1.5 block font-sans text-xs text-[#94a3b8]">
                  Pick a creative team name for the live leaderboard.
                </span>
              </label>
            </div>

            {/* Member 1 Card (Liquid Glass) */}
            <div className="liquid-glass p-5 text-white">
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-white">
                  Member 1 (Team Lead)
                </span>
              </div>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1.5 block font-sans text-xs font-semibold text-white">
                    Full Name
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={m1Name}
                    onChange={(e) => setM1Name(e.target.value)}
                    autoComplete="name"
                    className="liquid-glass-input w-full px-3.5 py-2.5 font-sans text-sm font-medium outline-none"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block font-sans text-xs font-semibold text-white">
                      Semester
                    </span>
                    <select
                      value={m1Sem}
                      onChange={(e) => setM1Sem(e.target.value)}
                      className="liquid-glass-input w-full cursor-pointer px-3.5 py-2.5 font-sans text-sm font-semibold text-white outline-none"
                    >
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s} className="bg-[#0b1626] text-white">
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block font-sans text-xs font-semibold text-white">
                      Class / Branch
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. CSE A"
                      value={m1Class}
                      onChange={(e) => setM1Class(e.target.value)}
                      autoComplete="off"
                      className="liquid-glass-input w-full px-3.5 py-2.5 font-sans text-sm font-medium outline-none"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Member 2 Card (Liquid Glass) */}
            <div className="liquid-glass p-5 text-white">
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-white">
                  Member 2 (Teammate)
                </span>
              </div>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1.5 block font-sans text-xs font-semibold text-white">
                    Full Name
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Deepak Menon"
                    value={m2Name}
                    onChange={(e) => setM2Name(e.target.value)}
                    autoComplete="name"
                    className="liquid-glass-input w-full px-3.5 py-2.5 font-sans text-sm font-medium outline-none"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block font-sans text-xs font-semibold text-white">
                      Semester
                    </span>
                    <select
                      value={m2Sem}
                      onChange={(e) => setM2Sem(e.target.value)}
                      className="liquid-glass-input w-full cursor-pointer px-3.5 py-2.5 font-sans text-sm font-semibold text-white outline-none"
                    >
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s} className="bg-[#0b1626] text-white">
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block font-sans text-xs font-semibold text-white">
                      Class / Branch
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. ECE B"
                      value={m2Class}
                      onChange={(e) => setM2Class(e.target.value)}
                      autoComplete="off"
                      className="liquid-glass-input w-full px-3.5 py-2.5 font-sans text-sm font-medium outline-none"
                    />
                  </label>
                </div>
              </div>
            </div>

            {formError && (
              <div className="rounded-[12px] border border-red-500/40 bg-[#381111]/80 backdrop-blur-md p-3.5 text-xs font-semibold text-red-200 shadow-md">
                <div className="flex items-start gap-2">
                  <WarningCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                  <span>{formError}</span>
                </div>
              </div>
            )}

            <Btn onClick={create} disabled={busy} className="w-full justify-center text-base py-3.5 shadow-xl">
              <Users size={18} />
              <span>{busy ? "Registering Team..." : "Enroll Team & Get Code"}</span>
              <ArrowRight size={18} />
            </Btn>

            <p className="text-center font-sans text-xs text-[#cbd5e1] drop-shadow-sm">
              no registration fee · both teammates must be present on campus
            </p>
          </div>
        ) : (
          /* Tab 2: Sign in with Access Code */
          <div className="mt-6 space-y-4">
            <div className="liquid-glass p-6 space-y-4 text-white">
              <div>
                <h2 className="font-sans text-sm font-bold text-white">
                  Authenticate Existing Team
                </h2>
                <p className="mt-0.5 text-xs text-[#94a3b8]">
                  Enter the 6-character code given after registration.
                </p>
              </div>

              <label className="block">
                <span className="mb-1.5 block font-sans text-xs font-semibold text-white">
                  Team Access Code
                </span>
                <input
                  type="text"
                  placeholder="XXXXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  className="liquid-glass-input w-full px-4 py-3 font-mono text-lg font-bold tracking-[0.2em] uppercase text-center outline-none"
                />
              </label>

              {codeError && (
                <div className="rounded-[12px] border border-red-500/40 bg-[#381111]/80 backdrop-blur-md p-3 text-xs font-semibold text-red-200 shadow-md">
                  <div className="flex items-start gap-2">
                    <WarningCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                    <span>{codeError}</span>
                  </div>
                </div>
              )}

              <Btn onClick={join} disabled={busy} className="w-full justify-center text-base py-3 shadow-xl">
                <span>{busy ? "Authenticating..." : "Sign In to Team"}</span>
                <ArrowRight size={18} />
              </Btn>
            </div>

            <p className="text-center font-sans text-xs text-[#cbd5e1] drop-shadow-sm">
              Lost code? Contact volunteers near the registration desk.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
