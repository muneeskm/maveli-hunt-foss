"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Copy,
  Leaf,
  MapPin,
  Users,
  WarningCircle,
} from "@phosphor-icons/react";
import { Btn, Field, Panel } from "@/components/ui";
import { useGame, useMounted } from "@/hooks/use-game";
import { store } from "@/lib/store";
import type { Team } from "@/lib/types";

const INTRO_SEEN_KEY = "mh:intro-seen";
const LOCATING_MS = 3200;
const NOTFOUND_MS = 1400;
const WARNING_MS = 2600;

type IntroStep = "locating" | "notfound" | "warning" | "join";

/*
 * Landing page. First visit: the tracker pings Mavelli's last known position,
 * reports NOT FOUND, raises the warning, then hands over to "Join the search".
 * Returning members (or the same phone) skip straight to the join screen.
 */
export default function HomePage() {
  const router = useRouter();
  const mounted = useMounted();
  const { team } = useGame();
  const [step, setStep] = useState<IntroStep>("locating");
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

  // Intro sequencing; returning phones skip it.
  useEffect(() => {
    if (step === "locating" || step === "notfound" || step === "warning") {
      if (typeof window !== "undefined" && window.sessionStorage.getItem(INTRO_SEEN_KEY)) {
        setStep("join");
        return;
      }
    }
    const timings: Record<Exclude<IntroStep, "join">, number> = {
      locating: LOCATING_MS,
      notfound: NOTFOUND_MS,
      warning: WARNING_MS,
    };
    const ms = timings[step as Exclude<IntroStep, "join">];
    if (!ms) return;
    const t = window.setTimeout(() => {
      setStep((s) => (s === "locating" ? "notfound" : s === "notfound" ? "warning" : "join"));
    }, ms);
    return () => window.clearTimeout(t);
  }, [step]);

  const skipIntro = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    }
    setStep("join");
  };

  const go = (path: string) => router.replace(path);

  const afterJoin = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    }
    go(returnTo ?? "/tracker");
  };

  if (!mounted) return null;
  if (team && !created) return null; // redirecting to tracker

  if (step === "locating") {
    return (
      <div
        className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center"
        onClick={skipIntro}
      >
        <div className="relative flex h-40 w-40 items-center justify-center">
          <span className="anim-ping-ring absolute inset-0 rounded-full border-2 border-leaf/40" />
          <span className="anim-ping-ring absolute inset-0 rounded-full border-2 border-leaf/20 [animation-delay:0.7s]" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-leaf/50 bg-ink-3">
            <span className="anim-blink h-3 w-3 rounded-full bg-leaf" />
          </div>
        </div>
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.24em] text-fog">
          FOSS Mavelli Hunt
        </p>
        <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-mist">
          Mavelli tracker
        </h1>
        <p className="mt-4 flex items-center gap-1.5 text-sm text-fog">
          <MapPin size={16} className="text-leaf" /> Last known location:
          scanning campus...
        </p>
      </div>
    );
  }

  if (step === "notfound") {
    return (
      <div
        className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center"
        onClick={skipIntro}
      >
        <p className="anim-flicker font-mono text-5xl font-black uppercase tracking-[0.18em] text-leaf">
          Not found!
        </p>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.24em] text-fog">
          Last signal {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} local
        </p>
      </div>
    );
  }

  if (step === "warning") {
    return (
      <div
        className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center"
        onClick={skipIntro}
      >
        <div className="hazard h-2 w-full max-w-xs rounded-full" />
        <WarningCircle
          size={40}
          weight="fill"
          className="anim-blink mt-8 text-leaf"
        />
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.24em] text-fog">
          Warning
        </p>
        <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-mist">
          Mavelli is missing
        </h1>
        <p className="mx-auto mt-4 max-w-[34ch] text-sm leading-relaxed text-fog">
          A search has been opened. Teams are forming now.
        </p>
      </div>
    );
  }

  // ---- join ----
  return <JoinScreen created={created} setCreated={setCreated} onDone={afterJoin} />;
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
  const [member1, setMember1] = useState("");
  const [member2, setMember2] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const create = () => {
    if (!teamName.trim() || !member1.trim() || !member2.trim()) {
      setFormError("Team name and both member names are required.");
      return;
    }
    const team = store.createTeam(teamName, member1, member2);
    store.login(team.code);
    setCreated(team);
  };

  const join = () => {
    const team = store.login(code);
    if (!team) {
      setCodeError("No team found with that code. Check with your partner.");
      return;
    }
    onDone();
  };

  const copy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  if (created) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10 text-center">
        <Leaf size={36} weight="fill" className="text-leaf" />
        <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-mist">
          Team registered
        </h1>
        <p className="mt-1 text-sm text-fog">
          This is your team&apos;s access code.
        </p>
        <Panel className="mt-6 w-full max-w-xs p-6">
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-3xl font-black tracking-[0.24em] text-leaf">
              {created.code}
            </span>
            <button
              type="button"
              onClick={copy}
              aria-label="Copy access code"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line-2 text-fog hover:text-mist"
            >
              {copied ? <Check size={18} className="text-leaf" /> : <Copy size={18} />}
            </button>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-fog">
            {created.member1} / {created.member2} - {created.name}
          </p>
        </Panel>
        <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-fog">
          Every member signs in with this code. Progress syncs live across all
          your phones.
        </p>
        <Btn onClick={onDone} className="mt-6 w-full max-w-xs">
          Continue to the tracker <ArrowRight size={18} />
        </Btn>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <Leaf size={34} weight="fill" className="text-leaf" />
        <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-mist">
          Join the search
        </h1>
        <p className="mt-1 text-sm text-fog">
          Mavelli needs every team it can get.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-line p-1">
          {(["create", "code"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setFormError(null);
                setCodeError(null);
              }}
              className={
                mode === m
                  ? "rounded-lg bg-leaf px-3 py-2 text-sm font-semibold text-[#03150a]"
                  : "rounded-lg px-3 py-2 text-sm font-medium text-fog"
              }
            >
              {m === "create" ? "Create team" : "Team code"}
            </button>
          ))}
        </div>

        {mode === "create" ? (
          <div className="mt-6 space-y-4">
            <Field
              label="Team name"
              placeholder="e.g. Onam Avengers"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              autoComplete="off"
            />
            <Field
              label="Member 1"
              placeholder="Full name"
              value={member1}
              onChange={(e) => setMember1(e.target.value)}
              autoComplete="off"
            />
            <Field
              label="Member 2"
              placeholder="Full name"
              value={member2}
              onChange={(e) => setMember2(e.target.value)}
              autoComplete="off"
            />
            {formError && (
              <p className="flex items-start gap-2 text-sm text-red-300">
                <WarningCircle size={18} className="mt-0.5 shrink-0" />
                {formError}
              </p>
            )}
            <Btn onClick={create} className="w-full">
              <Users size={18} /> Register team
            </Btn>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <Field
              label="Access code"
              placeholder="XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              hint="The code your team leader shared with you."
            />
            {codeError && (
              <p className="flex items-start gap-2 text-sm text-red-300">
                <WarningCircle size={18} className="mt-0.5 shrink-0" />
                {codeError}
              </p>
            )}
            <Btn onClick={join} className="w-full">
              Sign in <ArrowRight size={18} />
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
