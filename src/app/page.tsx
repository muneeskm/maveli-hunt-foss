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
  TreeStructure,
  UserPlus,
  Users,
  Warning,
  WarningCircle,
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const scan = new URLSearchParams(window.location.search).get("scan");
    if (scan) setReturnTo(scan);
  }, []);

  useEffect(() => {
    if (mounted && team && !created) router.replace("/tracker");
  }, [mounted, team, created, router]);

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
  if (team && !created) return null;
  if (!team && sessionPending) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#fcfaf5]">
        <div className="text-center">
          <span className="anim-blink mx-auto block h-2.5 w-2.5 rounded-full bg-[#1a3300]" />
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-[#1a3300]">
            Syncing squad...
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
      <main className="min-h-[100dvh] bg-[#fcfaf5] px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-lg">
          {/* Header */}
          <div className="text-center">
            <TaglineBadge className="mx-auto">
              <Sparkle weight="fill" size={13} /> SQUAD ENROLLED
            </TaglineBadge>

            <h1 className="font-display mt-4 text-3xl font-extrabold text-[#1a3300] sm:text-4xl leading-tight">
              Save your squad <HighlightWord>credentials.</HighlightWord>
            </h1>
            <p className="mt-2 font-sans text-base text-[#1a3300]/80">
              Your squad is officially locked in for The Maveli Files.
            </p>
          </div>

          {/* Access Code Box (Highlighter Yellow Sticky Note) */}
          <div className="mt-6 rounded-[14px] border border-[rgba(26,51,0,0.2)] bg-[#ffe95c] p-6 text-center shadow-sm">
            <p className="font-mono text-xs uppercase tracking-widest text-[#1a3300]">
              Squad Access Code
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="font-mono text-4xl font-extrabold tracking-[0.24em] text-[#1a3300] sm:text-5xl">
                {created.code}
              </span>
              <button
                type="button"
                onClick={copy}
                aria-label="Copy access code"
                className="flex h-11 w-11 items-center justify-center rounded-[6px] border border-[#1a3300] bg-white text-[#1a3300] hover:bg-[#fcfaf5] active:translate-y-[1px] transition-all"
              >
                {copied ? (
                  <Check size={20} className="text-[#1a3300]" weight="bold" />
                ) : (
                  <Copy size={20} />
                )}
              </button>
            </div>

            {copied && (
              <p className="mt-2 font-mono text-xs font-semibold text-[#1a3300]">
                ✓ Access code copied to clipboard!
              </p>
            )}

            {/* Critical Save Notice */}
            <div className="mt-5 rounded-[8px] border border-[rgba(26,51,0,0.15)] bg-white/80 p-3.5 text-left text-xs leading-relaxed text-[#1a3300]">
              <div className="flex items-start gap-2.5">
                <Warning size={18} className="mt-0.5 shrink-0 text-[#1a3300]" weight="fill" />
                <p>
                  <strong>Important: Screenshot or save this code now.</strong>{" "}
                  Both members will use this code to log into the hunt tracker across their phones.
                </p>
              </div>
            </div>
          </div>

          {/* Team Summary Card (Mint Pastel Surface) */}
          <Panel tone="mint" className="mt-5">
            <div className="flex items-center justify-between border-b border-[rgba(26,51,0,0.12)] pb-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#1a3300]/80">
                Registered Squad
              </span>
              <span className="font-sans text-sm font-bold text-[#1a3300]">{created.name}</span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-[8px] border border-[rgba(26,51,0,0.12)] bg-white/70 p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#1a3300]/70">
                  Member 1 (Lead)
                </p>
                <p className="mt-1 font-sans text-sm font-semibold text-[#1a3300]">
                  {created.member1}
                </p>
                {(created.member1Sem || created.member1Class) && (
                  <p className="mt-0.5 font-mono text-xs text-[#1a3300]/80">
                    {[created.member1Sem, created.member1Class]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>

              <div className="rounded-[8px] border border-[rgba(26,51,0,0.12)] bg-white/70 p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#1a3300]/70">
                  Member 2
                </p>
                <p className="mt-1 font-sans text-sm font-semibold text-[#1a3300]">
                  {created.member2}
                </p>
                {(created.member2Sem || created.member2Class) && (
                  <p className="mt-0.5 font-mono text-xs text-[#1a3300]/80">
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
            <Btn
              variant="outline"
              onClick={() => setShowTimeline((prev) => !prev)}
              className="w-full justify-center"
            >
              <TreeStructure size={16} weight="bold" />
              {showTimeline ? "Hide Investigation Timeline" : "View Investigation Timeline"}
            </Btn>

            <Btn onClick={onDone} className="w-full justify-center text-base py-3.5">
              <span>Continue to Hunt Tracker</span>
              <ArrowRight size={18} />
            </Btn>
          </div>

          {/* 7-Node Node-Tree Timeline Section */}
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
    <main className="flex min-h-[100dvh] flex-col justify-center bg-[#fcfaf5] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <TaglineBadge className="mx-auto mb-4">
            <Sparkle weight="fill" size={13} /> CAMPUS INVESTIGATION
          </TaglineBadge>

          <h1 className="font-display text-4xl sm:text-5xl text-[#1a3300] leading-[1.08] tracking-[0.04em]">
            Search for Maveli <HighlightWord>in the wild.</HighlightWord>
          </h1>
          <p className="mt-3 font-sans text-base text-[#1a3300]/85 max-w-[500px] mx-auto leading-relaxed">
            Register your 2-member squad to unlock access credentials and track the clues left across campus.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mt-6 flex items-center justify-center gap-1 rounded-[8px] border border-[#b6b6b6] bg-white p-1">
          <button
            type="button"
            onClick={() => {
              setMode("create");
              setFormError(null);
              setCodeError(null);
            }}
            className={
              mode === "create"
                ? "flex-1 flex items-center justify-center gap-1.5 rounded-[6px] bg-[#1a3300] py-2 font-sans text-xs font-semibold text-[#fcfaf5] transition-all"
                : "flex-1 flex items-center justify-center gap-1.5 rounded-[6px] py-2 font-sans text-xs font-medium text-[#1a3300]/70 hover:text-[#1a3300] transition-colors"
            }
          >
            <UserPlus size={15} weight="bold" />
            Register Squad
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
                ? "flex-1 flex items-center justify-center gap-1.5 rounded-[6px] bg-[#1a3300] py-2 font-sans text-xs font-semibold text-[#fcfaf5] transition-all"
                : "flex-1 flex items-center justify-center gap-1.5 rounded-[6px] py-2 font-sans text-xs font-medium text-[#1a3300]/70 hover:text-[#1a3300] transition-colors"
            }
          >
            <Key size={15} weight="bold" />
            Access Code
          </button>
        </div>

        {/* Tab 1: Register Team */}
        {mode === "create" ? (
          <div className="mt-6 space-y-4">
            {/* Squad Name Field */}
            <Panel className="p-4">
              <Field
                label="Squad Name"
                placeholder="e.g. Cipher Syndicate"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                autoComplete="off"
                hint="Pick a creative squad name for the live leaderboard."
              />
            </Panel>

            {/* Member 1 Card (Sticky Note Mint) */}
            <Panel tone="mint" className="p-4">
              <div className="mb-3 flex items-center justify-between border-b border-[rgba(26,51,0,0.12)] pb-2">
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-[#1a3300]">
                  Member 1 (Squad Lead)
                </span>
                <span className="rounded-[4px] bg-[#1a3300] px-2 py-0.5 font-mono text-[9px] font-semibold text-[#fcfaf5]">
                  REQUIRED
                </span>
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
                      <option key={s} value={s}>
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
            </Panel>

            {/* Member 2 Card (Sticky Note Teal or Paper) */}
            <Panel tone="teal" className="p-4">
              <div className="mb-3 flex items-center justify-between border-b border-[rgba(26,51,0,0.12)] pb-2">
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-[#1a3300]">
                  Member 2 (Teammate)
                </span>
                <span className="rounded-[4px] bg-[#1a3300] px-2 py-0.5 font-mono text-[9px] font-semibold text-[#fcfaf5]">
                  REQUIRED
                </span>
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
                      <option key={s} value={s}>
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
            </Panel>

            {formError && (
              <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-900">
                <div className="flex items-start gap-2">
                  <WarningCircle size={16} className="mt-0.5 shrink-0 text-red-700" />
                  <span>{formError}</span>
                </div>
              </div>
            )}

            <Btn onClick={create} disabled={busy} className="w-full justify-center text-base py-3.5">
              <Users size={18} />
              <span>{busy ? "Registering Squad..." : "Enroll Squad & Get Code"}</span>
              <ArrowRight size={18} />
            </Btn>

            <p className="text-center font-sans text-xs text-[#888888]">
              no registration fee · both teammates must be present on campus
            </p>
          </div>
        ) : (
          /* Tab 2: Sign in with Access Code */
          <div className="mt-6 space-y-4">
            <Panel className="p-5 space-y-4">
              <div>
                <h2 className="font-sans text-sm font-bold text-[#1a3300]">
                  Authenticate Existing Squad
                </h2>
                <p className="mt-0.5 text-xs text-[#666666]">
                  Enter the 6-character code given after registration.
                </p>
              </div>

              <Field
                label="Squad Access Code"
                placeholder="XXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
              />

              {codeError && (
                <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-900">
                  <div className="flex items-start gap-2">
                    <WarningCircle size={16} className="mt-0.5 shrink-0 text-red-700" />
                    <span>{codeError}</span>
                  </div>
                </div>
              )}

              <Btn onClick={join} disabled={busy} className="w-full justify-center text-base py-3">
                <span>{busy ? "Authenticating..." : "Sign In to Squad"}</span>
                <ArrowRight size={18} />
              </Btn>
            </Panel>

            <div className="rounded-[10px] border border-[#b6b6b6] bg-white p-3.5 text-xs text-[#555555]">
              <div className="flex items-start gap-2">
                <Info size={16} className="mt-0.5 shrink-0 text-[#1a3300]" />
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
